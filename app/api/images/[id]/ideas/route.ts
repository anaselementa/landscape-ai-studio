import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { openai, OPENAI_TEXT_MODEL } from "@/lib/openai-client";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: imageId } = await params;

    const { data: image, error: imageError } = await supabaseAdmin
      .from("site_images")
      .select("*, projects(*), image_analyses(*)")
      .eq("id", imageId)
      .single();

    if (imageError || !image) throw imageError || new Error("Image introuvable.");

    const analysis = image.image_analyses?.[0]?.analysis_json;
    if (!analysis) {
      return NextResponse.json({ error: "Analyse IA manquante. Lance d’abord l’analyse." }, { status: 400 });
    }

    const prompt = `
Tu es un architecte de paysage senior spécialisé en jardins de villas au Maroc.
Génère 3 idées d'aménagement pour cet espace.

Projet : ${image.projects?.name}
Localisation : ${image.projects?.location}
Style souhaité : ${image.projects?.style}
Contraintes : ${image.projects?.constraints}
Espace : ${image.space_name}
Analyse IA : ${JSON.stringify(analysis)}

Retourne uniquement un JSON valide :
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
Les idées doivent respecter la contrainte de ne pas dénaturer l'existant complètement.
`;

    const response = await openai.responses.create({
      model: OPENAI_TEXT_MODEL,
      input: prompt,
      text: {
        format: {
          type: "json_object"
        }
      }
    } as any);

    const raw = response.output_text;
    const parsed = JSON.parse(raw);
    const ideas = parsed.ideas || [];

    const rows = ideas.map((idea: any) => ({
      project_id: image.project_id,
      site_image_id: image.id,
      title: idea.title,
      description: idea.description,
      intervention_level: idea.intervention_level,
      materials: idea.materials || [],
      plants: idea.plants || [],
      furniture: idea.furniture || [],
      lighting: idea.lighting || [],
      cost_level: idea.cost_level,
      maintenance_level: idea.maintenance_level,
      status: "suggested"
    }));

    const { data, error: insertError } = await supabaseAdmin
      .from("design_ideas")
      .insert(rows)
      .select("id,title");

    if (insertError) throw insertError;

    return NextResponse.json({ ok: true, ideas: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur génération idées." }, { status: 500 });
  }
}
