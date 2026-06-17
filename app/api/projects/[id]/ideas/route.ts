import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { demoIdeas, generateJsonWithOpenAI } from "@/lib/ai";

export const runtime = "nodejs";

type Params = { id: string };

export async function POST(_request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project }, { data: analyses }, { data: swots }, { data: refs }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("analyses").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("swots").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("project_references").select("*").eq("project_id", id).order("created_at", { ascending: false })
    ]);
    const analysis = analyses?.[0];
    if (!project || !analysis) return NextResponse.json({ error: "Analyse introuvable." }, { status: 400 });

    const fallback = demoIdeas();
    const { data, usedDemo, error } = await generateJsonWithOpenAI({
      system: "Tu es architecte de paysage senior. Propose des concepts realistes, construisibles, avec materiaux, vegetation et entretien. Retourne uniquement JSON.",
      user: `Projet: ${project.name}, ${project.location}, style ${project.style}, contraintes: ${project.constraints}. Analyse: ${JSON.stringify(analysis.analysis_json)}. SWOT: ${JSON.stringify(swots?.[0] || {})}. References: ${JSON.stringify(refs || [])}. Retourne JSON {ideas:[{title,description,intervention_level,materials[],plants[],furniture[],lighting[],cost_level,maintenance_level}]} avec exactement 3 idees: une intervention legere/moyenne, une premium, une sobre/faible entretien.`,
      fallback
    });

    const ideas = (data as any).ideas || fallback.ideas;
    await supabase.from("ideas").delete().eq("project_id", id);
    const rows = ideas.map((idea: any) => ({
      project_id: id,
      analysis_id: analysis.id,
      title: idea.title,
      description: idea.description,
      intervention_level: idea.intervention_level,
      materials: idea.materials || [],
      plants: idea.plants || [],
      furniture: idea.furniture || [],
      lighting: idea.lighting || [],
      cost_level: idea.cost_level,
      maintenance_level: idea.maintenance_level,
      selected: false,
      status: "suggested"
    }));
    const { data: inserted, error: insertError } = await supabase.from("ideas").insert(rows).select("*");
    if (insertError) throw insertError;

    await supabase.from("projects").update({ status: "ideas_ready", updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ideas: inserted, usedDemo, openaiError: error || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur idees.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
