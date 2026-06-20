import { NextResponse } from "next/server";
import { asStringArray, parseJsonResponse } from "@/lib/ai-json";
import { demoIdeas, getOpenAIDemoReason, insertWithOptionalDemoColumns } from "@/lib/demo-ai";
import { getOpenAI, OPENAI_TEXT_MODEL } from "@/lib/openai-client";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { DesignIdea } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project, error: projectError }, { data: analysis }, { data: swot }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("analyses").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("swots").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle()
    ]);
    if (projectError || !project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    if (!analysis) return NextResponse.json({ error: "Lance d'abord l'analyse." }, { status: 400 });

    let parsedIdeas: DesignIdea[];
    let demoReason: string | null = null;
    try {
      const prompt = `Genere exactement 3 idees d'amenagement vraiment differentes pour ce jardin de villa:
1 idee "light" intervention legere,
1 idee "medium" intervention moyenne,
1 idee "strong" intervention forte.

Utilise explicitement les noms d'espaces detectes dans l'analyse photo par photo: entree, jardin piscine, sortie/passage, terrasse, masses vegetales, ou les noms equivalents trouves.
Chaque idee doit etre actionnable et utilisable pour guider un benchmark visuel puis un plan.
Projet: ${JSON.stringify(project)}
Analyse: ${JSON.stringify(analysis.analysis_json)}
SWOT: ${JSON.stringify(swot || {})}
Retourne uniquement JSON {"ideas":[{"title":"","description":"","intervention_level":"light|medium|strong","spaces_concerned":[""],"spatial_moves":[""],"concept_keywords":[""],"materials":[""],"plants":[""],"furniture":[""],"lighting":[""],"cost_level":"","maintenance_level":"","preserved_elements":[""],"transformed_elements":[""]}]}.

Contraintes:
- les trois intervention_level doivent etre exactement light, medium, strong;
- precise ce qui est conserve et ce qui est transforme;
- cite les espaces concernes avec les memes noms que dans l'analyse;
- light = intervention sobre: conserver les sols et structures, clarifier les seuils, ajouter plantations/eclairage/mobilier ponctuels;
- medium = intervention de recomposition partielle: creer une vraie terrasse ou sequence piscine, reprendre certains sols, densifier les masses vegetales;
- strong = transformation ambitieuse: redessiner les circulations, unifier les sols, structurer plusieurs pieces de jardin et assumer un chantier plus lourd;
- chaque idee doit avoir une logique spatiale differente, pas seulement plus ou moins de budget;
- donne au moins 4 gestes spatiaux, 4 vegetaux, 3 materiaux, 2 elements de mobilier et 2 intentions lumineuses par idee;
- les descriptions doivent parler de l'usage, du confort climatique, de l'entretien et de l'effet visuel client.`;
      const response = await getOpenAI().responses.create({ model: OPENAI_TEXT_MODEL, input: prompt, text: { format: { type: "json_object" } } } as any);
      parsedIdeas = parseJsonResponse<{ ideas: DesignIdea[] }>(response.output_text).ideas || [];
    } catch (openAiError) {
      demoReason = getOpenAIDemoReason(openAiError);
      if (!demoReason) throw openAiError;
      parsedIdeas = demoIdeas();
    }

    const rows = parsedIdeas.slice(0, 3).map((idea) => ({
      project_id: projectId,
      analysis_id: analysis.id,
      title: idea.title,
      description: idea.description,
      intervention_level: idea.intervention_level,
      spaces_concerned: asStringArray(idea.spaces_concerned),
      spatial_moves: asStringArray(idea.spatial_moves),
      concept_keywords: asStringArray(idea.concept_keywords),
      materials: asStringArray(idea.materials),
      plants: asStringArray(idea.plants),
      furniture: asStringArray(idea.furniture),
      lighting: asStringArray(idea.lighting),
      cost_level: idea.cost_level,
      maintenance_level: idea.maintenance_level,
      preserved_elements: asStringArray(idea.preserved_elements),
      transformed_elements: asStringArray(idea.transformed_elements),
      status: "suggested",
      selected: false,
      is_demo: Boolean(demoReason),
      demo_reason: demoReason
    }));

    if (rows.length !== 3) return NextResponse.json({ error: "La generation doit produire exactement 3 idees." }, { status: 502 });

    const { data, error } = await insertWithOptionalDemoColumns(supabase, "ideas", rows, "id,title");
    if (error) throw error;
    return NextResponse.json({ ok: true, ideas: data, demoMode: Boolean(demoReason), demoReason });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur idees.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
