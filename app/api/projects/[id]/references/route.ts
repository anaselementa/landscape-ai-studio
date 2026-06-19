import { NextResponse } from "next/server";
import { asNumber, parseJsonResponse } from "@/lib/ai-json";
import { demoBenchmark, getOpenAIDemoReason, insertWithOptionalDemoColumns } from "@/lib/demo-ai";
import { getOpenAI, OPENAI_TEXT_MODEL } from "@/lib/openai-client";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { BenchmarkPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project, error: projectError }, { data: analysis }, { data: selectedIdea }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("analyses").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("ideas").select("*").eq("project_id", projectId).eq("selected", true).maybeSingle()
    ]);
    if (projectError || !project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    if (!selectedIdea) return NextResponse.json({ error: "Selectionne une idee avant le benchmark." }, { status: 400 });

    let benchmark: BenchmarkPayload;
    let demoReason: string | null = null;
    try {
      const prompt = `Genere un benchmark visuel pour l'idee selectionnee.
Chaque reference doit inclure title, justification, image_query et score 0-100.
Le champ image_url est optionnel: ne l'ajoute que si tu as une URL image publique directe et fiable; sinon mets null.
La structure doit etre compatible avec une future API d'images qui utilisera image_query.
Projet: ${JSON.stringify(project)}
Analyse: ${JSON.stringify(analysis?.analysis_json || {})}
Idee selectionnee: ${JSON.stringify(selectedIdea)}
Retourne uniquement JSON {"summary":"","selected_idea_title":"","references":[{"title":"","image_url":null,"image_query":"","justification":"","score":90}]}.`;
      const response = await getOpenAI().responses.create({ model: OPENAI_TEXT_MODEL, input: prompt, text: { format: { type: "json_object" } } } as any);
      const parsed = parseJsonResponse<BenchmarkPayload>(response.output_text);
      benchmark = {
        summary: parsed.summary || "",
        selected_idea_title: parsed.selected_idea_title || selectedIdea.title,
        references: (parsed.references || []).slice(0, 3).map((reference) => ({
          title: reference.title,
          image_url: isValidImageUrl(reference.image_url) ? reference.image_url : null,
          image_query: reference.image_query,
          justification: reference.justification,
          score: Math.max(0, Math.min(100, asNumber(reference.score, 75)))
        }))
      };
    } catch (openAiError) {
      demoReason = getOpenAIDemoReason(openAiError);
      if (!demoReason) throw openAiError;
      benchmark = demoBenchmark(project, selectedIdea);
    }

    const { data, error } = await insertWithOptionalDemoColumns(supabase, "benchmarks", {
      project_id: projectId,
      analysis_id: analysis?.id || null,
      selected_idea_id: selectedIdea.id,
      summary: benchmark.summary,
      benchmark_json: benchmark,
      is_demo: Boolean(demoReason),
      demo_reason: demoReason
    }, "id");
    if (error) throw error;
    return NextResponse.json({ ok: true, benchmark_id: data.id, benchmark, demoMode: Boolean(demoReason), demoReason });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur benchmark.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isValidImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
