import { NextResponse } from "next/server";
import { asStringArray, parseJsonResponse } from "@/lib/ai-json";
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

    if (projectError || !project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const imageInputs = (images || []).slice(0, 8).map((image: any) => ({
      type: "input_image",
      image_url: image.public_url
    }));

    const prompt = `
Tu es un architecte paysagiste senior. Produis une analyse paysagere structuree pour ce projet.

Projet:
- Nom: ${project.name}
- Type: ${project.project_type || "non precise"}
- Localisation: ${project.location || "non precisee"}
- Style souhaite: ${project.style || "non precise"}
- Contraintes: ${project.constraints || "non precisees"}

Photos disponibles: ${(images || []).length}

Retourne uniquement un JSON valide avec cette structure exacte:
{
  "space_type": "string",
  "objective_description": "string",
  "existing_elements": ["string"],
  "landscape_diagnosis": "string",
  "elements_to_keep": ["string"],
  "elements_to_improve": ["string"],
  "swot": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "design_direction": "string"
}

Sois concret, professionnel, adapte au climat local et aux contraintes du projet.
`;

    const response = await getOpenAI().responses.create({
      model: OPENAI_TEXT_MODEL,
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }, ...imageInputs]
        }
      ],
      text: {
        format: { type: "json_object" }
      }
    } as any);

    const parsed = parseJsonResponse<LandscapeAnalysis>(response.output_text);
    const analysis: LandscapeAnalysis = {
      space_type: parsed.space_type || "Projet paysager",
      objective_description: parsed.objective_description || "",
      existing_elements: asStringArray(parsed.existing_elements),
      landscape_diagnosis: parsed.landscape_diagnosis || "",
      elements_to_keep: asStringArray(parsed.elements_to_keep),
      elements_to_improve: asStringArray(parsed.elements_to_improve),
      swot: {
        strengths: asStringArray(parsed.swot?.strengths),
        weaknesses: asStringArray(parsed.swot?.weaknesses),
        opportunities: asStringArray(parsed.swot?.opportunities),
        threats: asStringArray(parsed.swot?.threats)
      },
      design_direction: parsed.design_direction || ""
    };

    const summary = `${analysis.space_type}: ${analysis.landscape_diagnosis || analysis.objective_description}`;

    const { data, error } = await supabase
      .from("analyses")
      .insert({
        project_id: projectId,
        summary,
        analysis_json: analysis
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, analysis_id: data.id, analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur pendant l'analyse.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
