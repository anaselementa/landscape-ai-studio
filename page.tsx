import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { benchmarkImageUrl, benchmarkSearchUrl, demoReferences, generateJsonWithOpenAI } from "@/lib/ai";

export const runtime = "nodejs";

type Params = { id: string };

export async function POST(_request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project }, { data: analyses }, { data: swots }, { data: selectedIdeas }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("analyses").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("swots").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("ideas").select("*").eq("project_id", id).eq("selected", true).limit(1)
    ]);
    const analysis = analyses?.[0];
    const swot = swots?.[0];
    const selectedIdea = selectedIdeas?.[0] || null;
    if (!project || !analysis) return NextResponse.json({ error: "Analyse introuvable." }, { status: 400 });

    const fallback = demoReferences();
    const { data, usedDemo, error } = await generateJsonWithOpenAI({
      system: "Tu es un curateur de références visuelles en architecture de paysage. Tu proposes des benchmarks réalistes avec mots-clés d'image, justification et pertinence. JSON strict uniquement.",
      user: `
Projet : ${project.name}
Localisation : ${project.location}
Style souhaité : ${project.style}
Contraintes : ${project.constraints}
Analyse : ${JSON.stringify(analysis.analysis_json)}
SWOT : ${JSON.stringify(swot || {})}
Idée sélectionnée, si disponible : ${JSON.stringify(selectedIdea || {})}

Retourne uniquement :
{
  "references": [
    {
      "title": "titre court de référence",
      "description": "ce qu'on voit / ce que la référence apporte",
      "tags": ["tags"],
      "image_query": "requête courte en anglais pour rechercher une image pertinente",
      "visual_prompt": "description visuelle en français exploitable pour moodboard ou génération image",
      "reason": "pourquoi cette référence est utile pour CE projet",
      "relevance_score": 0-100
    }
  ]
}

Contraintes :
- Donne 6 références.
- Couvre au minimum : piscine/terrasse, entrée, jardin latéral/passage, palette végétale, matériaux, éclairage.
- Si une idée est sélectionnée, oriente au moins 3 références vers cette idée.
- Ne donne pas de faux liens. Donne des image_query précis et réalistes.
- Évite les références trop luxueuses ou hors climat si elles ne sont pas justifiées.
`,
      fallback
    });

    const references = ((data as any).references || fallback.references).slice(0, 8);
    await supabase.from("project_references").delete().eq("project_id", id);
    const rows = references.map((ref: any) => {
      const imageQuery = ref.image_query || ref.title;
      return {
        project_id: id,
        analysis_id: analysis.id,
        idea_id: selectedIdea?.id || null,
        title: ref.title,
        description: ref.description,
        tags: ref.tags || [],
        image_query: imageQuery,
        image_url: ref.image_url || benchmarkImageUrl(imageQuery, ref.title),
        external_url: ref.external_url || benchmarkSearchUrl(imageQuery, ref.title),
        visual_prompt: ref.visual_prompt || ref.description,
        relevance_score: ref.relevance_score || 80,
        reason: ref.reason,
        is_demo: usedDemo,
        demo_reason: error || null
      };
    });
    const { data: inserted, error: insertError } = await supabase.from("project_references").insert(rows).select("*");
    if (insertError) throw insertError;

    await supabase.from("projects").update({ status: "references_ready", updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ references: inserted, usedDemo, openaiError: error || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur references.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
