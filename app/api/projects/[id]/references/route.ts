import { NextResponse } from "next/server";
import { asNumber, asStringArray, parseJsonResponse } from "@/lib/ai-json";
import { defaultPinterestQueries, searchBenchmarkImages } from "@/lib/benchmark-search";
import { demoBenchmark } from "@/lib/demo-ai";
import { getOpenAI, OPENAI_TEXT_MODEL } from "@/lib/openai-client";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { BenchmarkPlatform } from "@/lib/types";

export const runtime = "nodejs";

type QueryPayload = {
  queries: string[];
};

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project, error: projectError }, { data: analysis }, { data: swot }, { data: selectedIdea }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("analyses").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("swots").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("ideas").select("*").eq("project_id", projectId).eq("selected", true).maybeSingle()
    ]);

    if (projectError || !project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const querySeed = {
      style: project.style,
      location: project.location,
      ideaTitle: selectedIdea?.title,
      interventionLevel: selectedIdea?.intervention_level,
      spaces: selectedIdea?.spaces_concerned || analysis?.analysis_json?.existing_elements || []
    };

    const queries = await getPinterestQueries({
      project,
      analysis,
      swot,
      selectedIdea,
      fallback: defaultPinterestQueries(querySeed)
    });

    const search = await searchBenchmarkImages(queries, 3);
    const platform = search.platform;
    const fallbackBenchmark = demoBenchmark(project, selectedIdea);
    const externalResults = search.results.slice(0, 8);

    const rows = externalResults.length
      ? externalResults.map((result, index) => ({
          project_id: projectId,
          idea_id: selectedIdea?.id || null,
          title: result.title || `Reference Pinterest ${index + 1}`,
          source_platform: result.source_platform,
          image_url: validUrlOrNull(result.image_url),
          thumbnail_url: validUrlOrNull(result.thumbnail_url),
          source_url: validUrlOrNull(result.source_url),
          image_query: result.image_query,
          justification: buildJustification(project, selectedIdea, result.image_query),
          relevance_score: Math.max(60, Math.min(98, 94 - index * 3)),
          tags: buildTags(project, selectedIdea),
          is_external: true
        }))
      : fallbackBenchmark.references.map((reference, index) => ({
          project_id: projectId,
          idea_id: selectedIdea?.id || null,
          title: reference.title,
          source_platform: "fallback" as BenchmarkPlatform,
          image_url: null,
          thumbnail_url: null,
          source_url: null,
          image_query: reference.image_query,
          justification: reference.justification,
          relevance_score: asNumber(reference.score, 75) - index,
          tags: buildTags(project, selectedIdea),
          is_external: false
        }));

    await supabase.from("benchmark_queries").insert(
      queries.map((query) => ({
        project_id: projectId,
        idea_id: selectedIdea?.id || null,
        query,
        platform,
        status: externalResults.length ? "results_found" : "fallback_moodboard"
      }))
    );

    const { data, error } = await supabase.from("benchmark_results").insert(rows).select("*");
    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      platform,
      results: data,
      fallback: !externalResults.length,
      errors: search.errors
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur benchmark.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getPinterestQueries(input: {
  project: any;
  analysis: any;
  swot: any;
  selectedIdea: any;
  fallback: string[];
}) {
  try {
    const prompt = `Genere 5 a 8 requetes de recherche image orientees Pinterest pour benchmark paysage.
Chaque requete doit commencer par site:pinterest.com et etre adaptee au style, climat, espaces detectes et idee selectionnee.
Projet: ${JSON.stringify(input.project)}
Analyse: ${JSON.stringify(input.analysis?.analysis_json || {})}
SWOT: ${JSON.stringify(input.swot || {})}
Idee selectionnee: ${JSON.stringify(input.selectedIdea || {})}
Retourne uniquement JSON {"queries":["site:pinterest.com ..."]}.`;

    const response = await getOpenAI().responses.create({
      model: OPENAI_TEXT_MODEL,
      input: prompt,
      text: { format: { type: "json_object" } }
    } as any);
    const parsed = parseJsonResponse<QueryPayload>(response.output_text);
    const queries = asStringArray(parsed.queries)
      .map((query) => (query.includes("site:pinterest.com") ? query : `site:pinterest.com ${query}`))
      .slice(0, 8);

    return queries.length >= 5 ? queries : input.fallback;
  } catch {
    return input.fallback;
  }
}

function validUrlOrNull(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}

function buildJustification(project: any, selectedIdea: any, query: string) {
  const idea = selectedIdea?.title ? ` l'idee "${selectedIdea.title}"` : " la direction paysagere";
  const style = project.style ? `, le style ${project.style}` : "";
  return `Reference utile pour nourrir${idea}${style}; requete ciblee Pinterest: ${query}.`;
}

function buildTags(project: any, selectedIdea: any) {
  return [
    project.style,
    project.location,
    selectedIdea?.intervention_level,
    ...(selectedIdea?.spaces_concerned || []),
    ...(selectedIdea?.concept_keywords || [])
  ].filter(Boolean);
}
