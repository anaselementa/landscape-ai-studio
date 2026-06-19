import { NextResponse } from "next/server";
import { asStringArray, parseJsonResponse } from "@/lib/ai-json";
import { demoAnalysis, getOpenAIDemoReason, insertWithOptionalDemoColumns } from "@/lib/demo-ai";
import { getOpenAI, OPENAI_TEXT_MODEL } from "@/lib/openai-client";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { LandscapeAnalysis } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project, error: projectError }, { data: images }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("site_images").select("*").eq("project_id", projectId).order("created_at", { ascending: true })
    ]);

    if (projectError || !project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

    let analysis: LandscapeAnalysis;
    let demoReason: string | null = null;

    try {
      const imageInputs = (images || []).slice(0, 8).map((image: any) => ({ type: "input_image", image_url: image.public_url }));
      const prompt = `
Tu es un architecte paysagiste senior. Analyse ce projet de villa et ses photos comme un diagnostic V0.3 exploitable.
Priorites: climat mediterraneen, usages de villa, eau, ombre, entretien, circulation, ambiance et potentiel de valorisation.

Projet:
- Nom: ${project.name}
- Type: ${project.project_type || "non precise"}
- Localisation: ${project.location || "non precisee"}
- Style souhaite: ${project.style || "non precise"}
- Contraintes: ${project.constraints || "non precisees"}
- Photos: ${(images || []).length}

Retourne uniquement ce JSON:
{
  "site_summary": "string",
  "climate_reading": "string",
  "existing_elements": ["string"],
  "opportunities": ["string"],
  "constraints_to_respect": ["string"],
  "design_direction": "string",
  "recommended_next_steps": ["string"]
}`;

      const response = await getOpenAI().responses.create({
        model: OPENAI_TEXT_MODEL,
        input: [{ role: "user", content: [{ type: "input_text", text: prompt }, ...imageInputs] }],
        text: { format: { type: "json_object" } }
      } as any);

      const parsed = parseJsonResponse<LandscapeAnalysis>(response.output_text);
      analysis = {
        site_summary: parsed.site_summary || "",
        climate_reading: parsed.climate_reading || "",
        existing_elements: asStringArray(parsed.existing_elements),
        opportunities: asStringArray(parsed.opportunities),
        constraints_to_respect: asStringArray(parsed.constraints_to_respect),
        design_direction: parsed.design_direction || "",
        recommended_next_steps: asStringArray(parsed.recommended_next_steps)
      };
    } catch (openAiError) {
      demoReason = getOpenAIDemoReason(openAiError);
      if (!demoReason) throw openAiError;
      analysis = demoAnalysis(project);
    }

    const { data, error } = await insertWithOptionalDemoColumns(supabase, "analyses", {
      project_id: projectId,
      summary: analysis.site_summary,
      analysis_json: analysis,
      is_demo: Boolean(demoReason),
      demo_reason: demoReason
    }, "id");
    if (error) throw error;

    return NextResponse.json({ ok: true, analysis_id: data.id, analysis, demoMode: Boolean(demoReason), demoReason });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur analyse.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
