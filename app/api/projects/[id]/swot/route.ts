import { NextResponse } from "next/server";
import { asStringArray, parseJsonResponse } from "@/lib/ai-json";
import { getOpenAI, OPENAI_TEXT_MODEL } from "@/lib/openai-client";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type SwotPayload = {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
};

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = getSupabaseAdmin();

    const [{ data: project, error: projectError }, { data: analysis }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("analyses").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle()
    ]);

    if (projectError || !project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    if (!analysis) {
      return NextResponse.json({ error: "Lance d'abord l'analyse paysagere." }, { status: 400 });
    }

    const prompt = `
Tu es un consultant en architecture de paysage.
Genere un SWOT clair pour ce projet, a partir de l'analyse suivante.

Projet: ${project.name}
Type: ${project.project_type || "non precise"}
Localisation: ${project.location || "non precisee"}
Style: ${project.style || "non precise"}
Contraintes: ${project.constraints || "non precisees"}
Analyse: ${JSON.stringify(analysis.analysis_json)}

Retourne uniquement un JSON valide:
{
  "strengths": ["string"],
  "weaknesses": ["string"],
  "opportunities": ["string"],
  "threats": ["string"]
}
`;

    const response = await getOpenAI().responses.create({
      model: OPENAI_TEXT_MODEL,
      input: prompt,
      text: {
        format: { type: "json_object" }
      }
    } as any);

    const parsed = parseJsonResponse<SwotPayload>(response.output_text);
    const payload = {
      strengths: asStringArray(parsed.strengths),
      weaknesses: asStringArray(parsed.weaknesses),
      opportunities: asStringArray(parsed.opportunities),
      threats: asStringArray(parsed.threats)
    };

    const { data, error } = await supabase
      .from("swots")
      .insert({
        project_id: projectId,
        analysis_id: analysis.id,
        ...payload
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, swot_id: data.id, swot: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur pendant la generation SWOT.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
