import { NextResponse } from "next/server";
import { asStringArray, parseJsonResponse } from "@/lib/ai-json";
import { demoIdeas, getOpenAIDemoReason, insertWithOptionalDemoColumns } from "@/lib/demo-ai";
import { getOpenAI, OPENAI_TEXT_MODEL } from "@/lib/openai-client";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { DesignIdea } from "@/lib/types";

export const runtime = "nodejs";

type IdeasPayload = {
  ideas: DesignIdea[];
};

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = getSupabaseAdmin();

    const [{ data: project, error: projectError }, { data: analysis }, { data: swot }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("analyses").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("swots").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle()
    ]);

    if (projectError || !project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    if (!analysis) {
      return NextResponse.json({ error: "Lance d'abord l'analyse paysagere." }, { status: 400 });
    }

    let demoReason: string | null = null;
    let parsedIdeas: DesignIdea[];

    try {
      const prompt = `
Tu es un architecte paysagiste senior specialise dans les villas et jardins mediterraneens.
Genere exactement 3 idees d'amenagement actionnables pour ce projet.

Projet:
- Nom: ${project.name}
- Type: ${project.project_type || "non precise"}
- Localisation: ${project.location || "non precisee"}
- Style souhaite: ${project.style || "non precise"}
- Contraintes: ${project.constraints || "non precisees"}

Analyse: ${JSON.stringify(analysis.analysis_json)}
SWOT: ${JSON.stringify(swot || analysis.analysis_json?.swot || {})}

Retourne uniquement un JSON valide:
{
  "ideas": [
    {
      "title": "string",
      "description": "string",
      "intervention_level": "light | medium | strong",
      "materials": ["string"],
      "plants": ["string"],
      "furniture": ["string"],
      "lighting": ["string"],
      "cost_level": "string",
      "maintenance_level": "string"
    }
  ]
}
`;

      const response = await getOpenAI().responses.create({
        model: OPENAI_TEXT_MODEL,
        input: prompt,
        text: {
          format: { type: "json_object" }
        }
      } as any);

      parsedIdeas = parseJsonResponse<IdeasPayload>(response.output_text).ideas || [];
    } catch (openAiError) {
      demoReason = getOpenAIDemoReason(openAiError);

      if (!demoReason) {
        throw openAiError;
      }

      parsedIdeas = demoIdeas();
    }

    const ideas = parsedIdeas.slice(0, 3).map((idea) => ({
      project_id: projectId,
      analysis_id: analysis.id,
      title: idea.title,
      description: idea.description,
      intervention_level: idea.intervention_level,
      materials: asStringArray(idea.materials),
      plants: asStringArray(idea.plants),
      furniture: asStringArray(idea.furniture),
      lighting: asStringArray(idea.lighting),
      cost_level: idea.cost_level,
      maintenance_level: idea.maintenance_level,
      status: "suggested",
      is_demo: Boolean(demoReason),
      demo_reason: demoReason
    }));

    if (ideas.length !== 3) {
      return NextResponse.json({ error: "La generation n'a pas retourne exactement 3 idees." }, { status: 502 });
    }

    const { data, error } = await insertWithOptionalDemoColumns(supabase, "ideas", ideas, "id,title");

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, ideas: data, demoMode: Boolean(demoReason), demoReason });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur pendant la generation des idees.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
