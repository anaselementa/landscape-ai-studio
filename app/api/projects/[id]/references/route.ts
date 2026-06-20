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
      spaces: selectedIdea?.spaces_concerned || extractSpacesFromAnalysis(analysis?.analysis_json)
    };

    const queries = await getPinterestQueries({
      project,
      analysis,
      swot,
      selectedIdea,
      fallback: defaultPinterestQueries(querySeed)
    });

    const search = await searchBenchmarkImages(queries, 4);
    const externalConfigured = search.configuredProviders.length > 0;
    const externalResults = search.results.slice(0, 8);

    if (externalConfigured && !externalResults.length) {
      await supabase.from("benchmark_queries").insert(
        queries.map((query) => ({
          project_id: projectId,
          idea_id: selectedIdea?.id || null,
          query,
          platform: search.attemptedProviders[search.attemptedProviders.length - 1] || search.configuredProviders[0],
          status: `external_failed: ${search.errors.join(" | ").slice(0, 900)}`
        }))
      );

      return NextResponse.json({
        error: "Benchmark externe configure mais aucun resultat exploitable n'a ete retourne.",
        details: search.errors.join(" | ") || "Provider configure sans resultat.",
        configuredProviders: search.configuredProviders,
        attemptedProviders: search.attemptedProviders
      }, { status: 502 });
    }

    const fallbackBenchmark = demoBenchmark(project, selectedIdea);
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
          justification: buildJustification(project, selectedIdea, analysis?.analysis_json, result.image_query, result.title),
          relevance_score: Math.max(65, Math.min(98, 96 - index * 3)),
          tags: buildTags(project, selectedIdea, analysis?.analysis_json),
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
          tags: buildTags(project, selectedIdea, analysis?.analysis_json),
          is_external: false
        }));

    await supabase.from("benchmark_queries").insert(
      queries.map((query) => ({
        project_id: projectId,
        idea_id: selectedIdea?.id || null,
        query,
        platform: externalResults.length ? search.platform : "fallback",
        status: externalResults.length ? "results_found" : "fallback_no_provider_configured"
      }))
    );

    const { data, error } = await supabase.from("benchmark_results").insert(rows).select("*");
    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      platform: externalResults.length ? search.platform : "fallback",
      configuredProviders: search.configuredProviders,
      attemptedProviders: search.attemptedProviders,
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
    const prompt = `Genere 6 a 8 requetes de recherche image pour un benchmark Pinterest d'architecture paysagere.
Chaque requete doit commencer par site:pinterest.com et cibler une intention visuelle differente.

Contexte projet: ${JSON.stringify(input.project)}
Analyse photo par photo: ${JSON.stringify(input.analysis?.analysis_json || {})}
SWOT: ${JSON.stringify(input.swot || {})}
Idee selectionnee: ${JSON.stringify(input.selectedIdea || {})}

Exigences:
- adapte les requetes aux espaces detectes: entree, terrasse, jardin piscine, sortie/passage, masses vegetales;
- integre le niveau d'intervention de l'idee selectionnee;
- vise des references realistes de villa mediterraneenne, pas des images decoratives generales;
- ajoute des mots de materiaux, vegetation, mobilier et lumiere quand c'est pertinent;
- evite les requetes trop larges comme "garden design".

Retourne uniquement JSON {"queries":["site:pinterest.com ..."]}.`;

    const response = await getOpenAI().responses.create({
      model: OPENAI_TEXT_MODEL,
      input: prompt,
      text: { format: { type: "json_object" } }
    } as any);
    const parsed = parseJsonResponse<QueryPayload>(response.output_text);
    const queries = asStringArray(parsed.queries)
      .map((query) => (query.toLowerCase().includes("site:pinterest.com") ? query : `site:pinterest.com ${query}`))
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

function buildJustification(project: any, selectedIdea: any, analysis: any, query: string, title: string) {
  const idea = selectedIdea?.title ? `l'idee "${selectedIdea.title}"` : "la direction paysagere";
  const level = selectedIdea?.intervention_level ? `niveau ${selectedIdea.intervention_level}` : "niveau a preciser";
  const spaces = (selectedIdea?.spaces_concerned || extractSpacesFromAnalysis(analysis)).slice(0, 4).join(", ");
  const style = project.style ? `Style vise: ${project.style}. ` : "";
  return `${style}Reference "${title}" retenue pour nourrir ${idea} (${level}) sur ${spaces || "les espaces principaux"}; requete ciblee: ${query}.`;
}

function buildTags(project: any, selectedIdea: any, analysis: any) {
  return [
    project.style,
    project.location,
    selectedIdea?.intervention_level,
    ...(selectedIdea?.spaces_concerned || extractSpacesFromAnalysis(analysis)),
    ...(selectedIdea?.concept_keywords || [])
  ].filter(Boolean);
}

function extractSpacesFromAnalysis(analysis: any): string[] {
  const photoSpaces = Array.isArray(analysis?.photo_analyses)
    ? analysis.photo_analyses.map((photo: any) => photo.probable_space).filter(Boolean)
    : [];
  const existing = Array.isArray(analysis?.existing_elements) ? analysis.existing_elements : [];
  return Array.from(new Set([...photoSpaces, ...existing])).slice(0, 8);
}
