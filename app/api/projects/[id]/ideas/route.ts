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
      const prompt = `Genere exactement 3 concepts d'amenagement differencies pour un jardin de villa.
Chaque idee doit etre actionnable et utilisable pour guider un benchmark visuel puis un plan.
Projet: ${JSON.stringify(project)}
Analyse: ${JSON.stringify(analysis.analysis_json)}
SWOT: ${JSON.stringify(swot || {})}
Retourne uniquement JSON {"ideas":[{"title":"","description":"","intervention_level":"light|medium|strong","concept_keywords":[""],"materials":[""],"plants":[""],"furniture":[""],"lighting":[""],"cost_level":"","maintenance_level":""}]}.`;
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
      concept_keywords: asStringArray(idea.concept_keywords),
      materials: asStringArray(idea.materials),
      plants: asStringArray(idea.plants),
      furniture: asStringArray(idea.furniture),
      lighting: asStringArray(idea.lighting),
      cost_level: idea.cost_level,
      maintenance_level: idea.maintenance_level,
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
