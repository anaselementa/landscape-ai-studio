import { NextResponse } from "next/server";
import { parseJsonResponse } from "@/lib/ai-json";
import { demoPlan, getOpenAIDemoReason, insertWithOptionalDemoColumns } from "@/lib/demo-ai";
import { getOpenAI, OPENAI_TEXT_MODEL } from "@/lib/openai-client";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type PlanPayload = ReturnType<typeof demoPlan>;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = getSupabaseAdmin();

    const [{ data: project, error: projectError }, { data: analysis }, { data: ideas }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("analyses").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("ideas").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(3)
    ]);

    if (projectError || !project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    let plan: PlanPayload;
    let demoReason: string | null = null;

    try {
      const prompt = `
Tu es un concepteur paysagiste. Genere un plan texture textuel et un prompt de rendu realiste.

Projet: ${project.name}
Type: ${project.project_type || "non precise"}
Localisation: ${project.location || "non precisee"}
Style: ${project.style || "non precise"}
Contraintes: ${project.constraints || "non precisees"}
Analyse: ${JSON.stringify(analysis?.analysis_json || {})}
Idees: ${JSON.stringify(ideas || [])}

Retourne uniquement un JSON valide:
{
  "plan_title": "string",
  "textured_plan_prompt": "string",
  "zones": ["string"],
  "materials": ["string"],
  "planting": ["string"],
  "validation_notes": ["string"]
}
`;

      const response = await getOpenAI().responses.create({
        model: OPENAI_TEXT_MODEL,
        input: prompt,
        text: {
          format: { type: "json_object" }
        }
      } as any);

      plan = parseJsonResponse<PlanPayload>(response.output_text);
    } catch (openAiError) {
      demoReason = getOpenAIDemoReason(openAiError);

      if (!demoReason) {
        throw openAiError;
      }

      plan = demoPlan(project);
    }

    const { data, error } = await insertWithOptionalDemoColumns(
      supabase,
      "plans",
      {
        project_id: projectId,
        analysis_id: analysis?.id || null,
        plan_json: plan,
        realistic_plan_prompt: plan.textured_plan_prompt,
        is_demo: Boolean(demoReason),
        demo_reason: demoReason
      },
      "id"
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, plan_id: data.id, plan, demoMode: Boolean(demoReason), demoReason });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur pendant la generation du plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
