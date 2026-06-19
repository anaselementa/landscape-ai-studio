import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { demoSwot, generateJsonWithOpenAI } from "@/lib/ai";

export const runtime = "nodejs";

type Params = { id: string };

export async function POST(_request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project }, { data: analyses }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("analyses").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1)
    ]);
    const analysis = analyses?.[0];
    if (!project || !analysis) return NextResponse.json({ error: "Analyse introuvable. Lance d'abord l'analyse." }, { status: 400 });

    const fallback = demoSwot();
    const { data, usedDemo, error } = await generateJsonWithOpenAI({
      system: "Tu es architecte de paysage. Produis un SWOT professionnel, opérationnel et spécifique au site, pas un SWOT générique. JSON strict uniquement.",
      user: `
Projet : ${project.name}
Type : ${project.project_type}
Localisation : ${project.location}
Style souhaité : ${project.style}
Contraintes : ${project.constraints}
Analyse : ${JSON.stringify(analysis.analysis_json || analysis.analysis)}

Retourne uniquement ce JSON :
{
  "summary": "synthèse en 2-3 phrases",
  "strengths": ["4 forces précises et liées au site"],
  "weaknesses": ["4 faiblesses précises et actionnables"],
  "opportunities": ["4 opportunités de projet exploitables"],
  "threats": ["4 risques réels de conception, entretien, eau, confort, budget ou cohérence"]
}

Règles :
- Interdiction de parler de concurrence, marketing ou voisinage sauf si visible dans les photos.
- Chaque point doit servir à une décision de conception.
- Cite les éléments observables : piscine, pelouse, haies, dalles, entrée, terrasse, passage, façade, végétation existante si présents dans l'analyse.
- Respecte le contexte climatique de Casablanca et la contrainte de conserver l'identité existante.
`,
      fallback
    });

    const swot: any = data;
    const { data: inserted, error: insertError } = await supabase
      .from("swots")
      .insert({
        project_id: id,
        analysis_id: analysis.id,
        image_id: analysis.image_id || null,
        summary: swot.summary || fallback.summary,
        strengths: swot.strengths || fallback.strengths,
        weaknesses: swot.weaknesses || fallback.weaknesses,
        opportunities: swot.opportunities || fallback.opportunities,
        threats: swot.threats || fallback.threats,
        is_demo: usedDemo,
        demo_reason: error || null
      })
      .select("*")
      .single();
    if (insertError) throw insertError;

    await supabase.from("projects").update({ status: "swot_ready", updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ swot: inserted, usedDemo, openaiError: error || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur SWOT.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
