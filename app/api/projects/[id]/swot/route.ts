import { NextResponse } from "next/server";
import { asStringArray, parseJsonResponse } from "@/lib/ai-json";
import { demoSwot, getOpenAIDemoReason, insertWithOptionalDemoColumns } from "@/lib/demo-ai";
import { getOpenAI, OPENAI_TEXT_MODEL } from "@/lib/openai-client";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { SwotPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project, error: projectError }, { data: analysis }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("analyses").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle()
    ]);
    if (projectError || !project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    if (!analysis) return NextResponse.json({ error: "Lance d'abord l'analyse." }, { status: 400 });

    let swot: SwotPayload;
    let demoReason: string | null = null;
    try {
      const prompt = `Genere un SWOT paysager decisionnel, concret et priorise pour un architecte paysagiste.
Projet: ${project.name}
Analyse: ${JSON.stringify(analysis.analysis_json)}

Regles strictes:
- Interdiction des menaces generiques comme "concurrence d'autres projets", "marche", "budget client" ou "tendances".
- Les faiblesses doivent etre directement liees aux photos, aux espaces detectes et a l'etat visible du site.
- Les menaces doivent concerner uniquement: climat, arrosage, entretien, ombrage, materiaux, contraintes d'execution, vieillissement de l'existant.
- Chaque point doit etre operationnel et utile pour arbitrer un amenagement.

Retourne uniquement JSON {"strengths":[""],"weaknesses":[""],"opportunities":[""],"threats":[""]}.`;
      const response = await getOpenAI().responses.create({ model: OPENAI_TEXT_MODEL, input: prompt, text: { format: { type: "json_object" } } } as any);
      const parsed = parseJsonResponse<SwotPayload>(response.output_text);
      swot = {
        strengths: asStringArray(parsed.strengths),
        weaknesses: asStringArray(parsed.weaknesses),
        opportunities: asStringArray(parsed.opportunities),
        threats: asStringArray(parsed.threats)
      };
    } catch (openAiError) {
      demoReason = getOpenAIDemoReason(openAiError);
      if (!demoReason) throw openAiError;
      swot = demoSwot();
    }

    const { data, error } = await insertWithOptionalDemoColumns(supabase, "swots", {
      project_id: projectId,
      analysis_id: analysis.id,
      ...swot,
      is_demo: Boolean(demoReason),
      demo_reason: demoReason
    }, "id");
    if (error) throw error;
    return NextResponse.json({ ok: true, swot_id: data.id, swot, demoMode: Boolean(demoReason), demoReason });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur SWOT.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
