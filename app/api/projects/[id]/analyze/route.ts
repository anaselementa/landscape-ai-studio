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
    const user = `Analyse ce projet d'architecture de paysage en francais. Retourne uniquement un JSON avec: summary, spaces_detected, existing_assets, issues, opportunities, design_direction.\n\nProjet: ${project.name}\nType: ${project.project_type || "non precise"}\nLocalisation: ${project.location || "non precisee"}\nStyle souhaite: ${project.style || "non precise"}\nContraintes: ${project.constraints || "aucune"}\nPhotos: ${images.map((img: any) => img.space_name || img.title).join(", ")}`;

    const { data, usedDemo, error } = await generateJsonWithOpenAI({
      system: "Tu es un architecte de paysage senior. Analyse des photos de site et propose une direction paysagere realiste, precise et non generique.",
      user,
      imageUrls: images.map((img: any) => img.public_url || img.image_url).filter(Boolean),
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
