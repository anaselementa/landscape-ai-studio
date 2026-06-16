import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { openai, OPENAI_TEXT_MODEL } from "@/lib/openai-client";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: imageId } = await params;

    const { data: image, error: imageError } = await supabaseAdmin
      .from("site_images")
      .select("*, projects(*)")
      .eq("id", imageId)
      .single();

    if (imageError || !image) throw imageError || new Error("Image introuvable.");

    const prompt = `
Tu es un architecte de paysage senior. Analyse cette photo de site à aménager.
Projet : ${image.projects?.name || "non précisé"}
Type : ${image.projects?.project_type || "non précisé"}
Localisation : ${image.projects?.location || "non précisée"}
Style souhaité : ${image.projects?.style || "non précisé"}
Contraintes : ${image.projects?.constraints || "non précisées"}
Espace : ${image.space_name || "non nommé"}

Retourne uniquement un JSON valide avec cette structure :
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
Sois précis, professionnel, adapté à Casablanca, et évite les généralités.
`;

    const response = await openai.responses.create({
      model: OPENAI_TEXT_MODEL,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: image.public_url }
          ]
        }
      ],
      text: {
        format: {
          type: "json_object"
        }
      }
    } as any);

    const raw = response.output_text;
    const analysisJson = JSON.parse(raw);

    const summary = `${analysisJson.space_type || "Espace"} — ${analysisJson.landscape_diagnosis || analysisJson.objective_description || "Analyse générée."}`;

    const { data, error: insertError } = await supabaseAdmin
      .from("image_analyses")
      .insert({
        project_id: image.project_id,
        site_image_id: image.id,
        analysis_json: analysisJson,
        summary
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ ok: true, analysis_id: data.id, analysis: analysisJson });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur analyse IA." }, { status: 500 });
  }
}
