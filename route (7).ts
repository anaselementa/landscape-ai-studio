import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { demoAnalysis, generateJsonWithOpenAI } from "@/lib/ai";

export const runtime = "nodejs";

type Params = { id: string };

export async function POST(_request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const [{ data: project }, { data: images }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("site_images").select("*").eq("project_id", id).order("created_at", { ascending: true })
    ]);

    if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    if (!images?.length) return NextResponse.json({ error: "Importe au moins une photo avant l'analyse." }, { status: 400 });

    const fallback = demoAnalysis(project.name, project.style);
    const imageBrief = (images || []).slice(0, 8).map((img: any, index: number) => ({
      index: index + 1,
      space_name: img.space_name || img.title || `Photo ${index + 1}`,
      file_name: img.file_name || img.title,
      url: img.public_url || img.image_url
    }));

    const user = `
Tu analyses un projet réel d'architecture de paysage à partir de photos de site.
Réponds en français, avec le niveau d'un architecte paysagiste senior. Ne fais pas une description générique : chaque conclusion doit être reliée à un élément visible ou à une contrainte du brief.

Projet : ${project.name}
Type : ${project.project_type || "non précisé"}
Localisation : ${project.location || "non précisée"}
Style souhaité : ${project.style || "non précisé"}
Contraintes du client : ${project.constraints || "aucune"}
Images envoyées : ${JSON.stringify(imageBrief)}

Structure JSON obligatoire :
{
  "summary": "diagnostic synthétique spécifique au site en 4-6 lignes",
  "image_by_image": [
    {
      "space_name": "nom de l'espace reconnu ou fourni",
      "visual_observations": ["éléments visibles précis"],
      "spatial_diagnosis": "lecture spatiale précise",
      "vegetation_diagnosis": "lecture végétale",
      "materials_diagnosis": "lecture matériaux/sols/bordures",
      "issues": ["problèmes concrets"],
      "opportunities": ["opportunités concrètes"]
    }
  ],
  "spaces_detected": ["espaces réellement détectés"],
  "existing_assets": ["éléments à valoriser"],
  "to_conserve": ["éléments à conserver"],
  "issues": ["problèmes transversaux"],
  "opportunities": ["opportunités transversales"],
  "priority_actions": ["actions classées par priorité"],
  "design_direction": "direction de conception précise et réaliste"
}

Règles :
- Mentionne les espaces distincts : entrée, sortie/passage, piscine/terrasse, jardin latéral si visibles.
- Fais la différence entre ce qu'il faut conserver, améliorer, supprimer ou transformer.
- Évite les phrases vagues comme « manque d'esthétique » sans préciser pourquoi.
- Ne propose pas de plantes incompatibles avec Casablanca.
- Respecte la contrainte : ne pas dénaturer complètement l'existant.
`;

    const { data, usedDemo, error } = await generateJsonWithOpenAI({
      system: "Tu es un architecte de paysage senior spécialisé en rénovation de jardins de villas au Maroc. Tu analyses les photos en profondeur et tu produis un JSON strict, sans markdown.",
      user,
      imageUrls: imageBrief.map((img: any) => img.url).filter(Boolean),
      fallback
    });

    const { data: inserted, error: insertError } = await supabase
      .from("analyses")
      .insert({
        project_id: id,
        image_id: images[0]?.id || null,
        summary: (data as any).summary || fallback.summary,
        analysis: data,
        analysis_json: { ...data, used_demo: usedDemo, openai_error: error || null }
      })
      .select("*")
      .single();
    if (insertError) throw insertError;

    await supabase.from("projects").update({ status: "site_analyzed", updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ analysis: inserted, usedDemo, openaiError: error || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur analyse.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
