import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { demoReferences, generateJsonWithOpenAI } from "@/lib/ai";

export const runtime = "nodejs";

type Params = { id: string };

export async function POST(_request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project }, { data: analyses }, { data: swots }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("analyses").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("swots").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1)
    ]);
    const analysis = analyses?.[0];
    const swot = swots?.[0];
    if (!project || !analysis) return NextResponse.json({ error: "Analyse introuvable." }, { status: 400 });

    const fallback = demoReferences();
    const { data, usedDemo, error } = await generateJsonWithOpenAI({
      system: "Tu es un curateur de references en architecture de paysage. Tu proposes des benchmarks visuels realistes sans inventer de liens. Retourne uniquement du JSON.",
      user: `Projet: ${project.name}, ${project.location}, style ${project.style}. Analyse: ${JSON.stringify(analysis.analysis_json)}. SWOT: ${JSON.stringify(swot || {})}. Retourne JSON {references:[{title,description,tags[],image_query,reason}]} avec 6 references benchmark, dont au moins une pour piscine, une pour entree, une pour jardin lateral si pertinent.`,
      fallback
    });

    const references = (data as any).references || fallback.references;
    await supabase.from("project_references").delete().eq("project_id", id);
    const rows = references.map((ref: any) => ({
      project_id: id,
      analysis_id: analysis.id,
      title: ref.title,
      description: ref.description,
      tags: ref.tags || [],
      image_query: ref.image_query,
      reason: ref.reason
    }));
    const { data: inserted, error: insertError } = await supabase.from("project_references").insert(rows).select("*");
    if (insertError) throw insertError;

    await supabase.from("projects").update({ status: "references_ready", updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ references: inserted, usedDemo, openaiError: error || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur references.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
