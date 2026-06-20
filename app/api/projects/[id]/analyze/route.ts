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
      const imageList = (images || []).slice(0, 8);
      const imageInputs = imageList.map((image: any) => ({ type: "input_image", image_url: image.public_url }));
      const photoIndex = imageList.map((image: any, index: number) => ({
        index: index + 1,
        id: image.id,
        title: image.title,
        space_name: image.space_name,
        image_url: image.public_url
      }));
      const prompt = `
Tu es un architecte paysagiste senior et directeur de conception. Produis un diagnostic de site exploitable avant esquisse.
Analyse ce projet de villa a partir des photos fournies. Tu dois analyser chaque photo separement avant de produire la synthese globale.
Chaque observation doit etre specifique aux photos: evite les phrases generiques, les suppositions non visibles et les conseils vagues.
Quand un element n'est pas visible, ecris "non visible" plutot que d'inventer.

Projet:
- Nom: ${project.name}
- Type: ${project.project_type || "non precise"}
- Localisation: ${project.location || "non precisee"}
- Style souhaite: ${project.style || "non precise"}
- Contraintes: ${project.constraints || "non precisees"}
- Photos: ${(images || []).length}

Index des photos:
${JSON.stringify(photoIndex)}

Retourne uniquement ce JSON:
{
  "site_summary": "string",
  "climate_reading": "string",
  "photo_analyses": [
    {
      "photo_id": "string",
      "photo_title": "string",
      "image_url": "string",
      "probable_space": "string",
      "visible_existing_elements": ["string"],
      "visible_materials": ["string"],
      "visible_vegetation": ["string"],
      "possible_uses": ["string"],
      "problems": ["string"],
      "opportunities": ["string"],
      "recommended_interventions": ["string"]
    }
  ],
  "existing_elements": ["string"],
  "opportunities": ["string"],
  "constraints_to_respect": ["string"],
  "design_direction": "string",
  "recommended_next_steps": ["string"]
}

Contraintes de qualite:
- une entree dans photo_analyses par photo fournie, dans le meme ordre que l'index;
- pour chaque photo, fournis au moins 4 observations concretes dans elements, materiaux, problemes, opportunites et interventions;
- nomme les espaces detectes: entree, jardin piscine, terrasse, sortie/passage, massif, allee, cour technique, seuil, etc.;
- decris aussi les relations spatiales: seuils, transitions, vues, zones d'ombre, sols, limites, circulations;
- les problemes doivent etre visibles ou directement deduits de l'etat du site: surchauffe, glissance, manque d'ombrage, confusion de circulation, arrosage, vieillissement des materiaux;
- les interventions recommandees doivent etre actionnables pour un architecte paysagiste;
- la synthese globale doit etre plus longue qu'une phrase et reprendre les noms d'espaces detectes.`;

      const response = await getOpenAI().responses.create({
        model: OPENAI_TEXT_MODEL,
        input: [{ role: "user", content: [{ type: "input_text", text: prompt }, ...imageInputs] }],
        text: { format: { type: "json_object" } }
      } as any);

      const parsed = parseJsonResponse<LandscapeAnalysis>(response.output_text);
      analysis = {
        site_summary: parsed.site_summary || "",
        climate_reading: parsed.climate_reading || "",
        photo_analyses: normalizePhotoAnalyses(parsed.photo_analyses),
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

function normalizePhotoAnalyses(value: LandscapeAnalysis["photo_analyses"]) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((photo) => ({
    photo_id: photo.photo_id || null,
    photo_title: photo.photo_title || null,
    image_url: photo.image_url || null,
    probable_space: photo.probable_space || "espace non identifie",
    visible_existing_elements: asStringArray(photo.visible_existing_elements),
    visible_materials: asStringArray(photo.visible_materials),
    visible_vegetation: asStringArray(photo.visible_vegetation),
    possible_uses: asStringArray(photo.possible_uses),
    problems: asStringArray(photo.problems),
    opportunities: asStringArray(photo.opportunities),
    recommended_interventions: asStringArray(photo.recommended_interventions)
  }));
}
