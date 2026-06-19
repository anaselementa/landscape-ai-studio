import { NextResponse } from "next/server";
import { asStringArray, parseJsonResponse } from "@/lib/ai-json";
import { buildConceptSvg, demoPlan, getOpenAIDemoReason, insertWithOptionalDemoColumns } from "@/lib/demo-ai";
import { getOpenAI, OPENAI_TEXT_MODEL } from "@/lib/openai-client";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { PlanPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project, error: projectError }, { data: analysis }, { data: selectedIdea }, { data: benchmark }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("analyses").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("ideas").select("*").eq("project_id", projectId).eq("selected", true).maybeSingle(),
      supabase.from("benchmarks").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle()
    ]);
    if (projectError || !project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    if (!selectedIdea) return NextResponse.json({ error: "Selectionne une idee avant le plan." }, { status: 400 });

    let plan: PlanPayload;
    let demoReason: string | null = null;
    try {
      const prompt = `Genere un plan texture V0.3 pour l'idee selectionnee. Le SVG sera construit par l'app, mais fournis zones, materiaux, vegetaux, notes et prompt image realiste.
Projet: ${JSON.stringify(project)}
Analyse: ${JSON.stringify(analysis?.analysis_json || {})}
Idee selectionnee: ${JSON.stringify(selectedIdea)}
Benchmark: ${JSON.stringify(benchmark?.benchmark_json || {})}
Retourne uniquement JSON {"plan_title":"","realistic_image_prompt":"","zones":[""],"materials":[""],"planting":[""],"validation_notes":[""]}.`;
      const response = await getOpenAI().responses.create({ model: OPENAI_TEXT_MODEL, input: prompt, text: { format: { type: "json_object" } } } as any);
      const parsed = parseJsonResponse<Omit<PlanPayload, "concept_svg">>(response.output_text);
      plan = {
        plan_title: parsed.plan_title || selectedIdea.title,
        concept_svg: buildConceptSvg(selectedIdea.title),
        realistic_image_prompt: parsed.realistic_image_prompt || "",
        zones: asStringArray(parsed.zones),
        materials: asStringArray(parsed.materials),
        planting: asStringArray(parsed.planting),
        validation_notes: asStringArray(parsed.validation_notes)
      };
    } catch (openAiError) {
      demoReason = getOpenAIDemoReason(openAiError);
      if (!demoReason) throw openAiError;
      plan = demoPlan(project, selectedIdea);
    }

    const { data, error } = await insertWithOptionalDemoColumns(supabase, "plans", {
      project_id: projectId,
      analysis_id: analysis?.id || null,
      selected_idea_id: selectedIdea.id,
      plan_json: plan,
      concept_svg: plan.concept_svg,
      realistic_image_prompt: plan.realistic_image_prompt,
      is_demo: Boolean(demoReason),
      demo_reason: demoReason
    }, "id");
    if (error) throw error;
    return NextResponse.json({ ok: true, plan_id: data.id, plan, demoMode: Boolean(demoReason), demoReason });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
