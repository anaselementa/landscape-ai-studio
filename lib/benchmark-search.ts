import { searchPinterestOfficial, type ExternalBenchmarkImage } from "@/lib/pinterest-client";
import type { BenchmarkPlatform } from "@/lib/types";

type SearchOutcome = {
  platform: BenchmarkPlatform;
  results: ExternalBenchmarkImage[];
  errors: string[];
};

export async function searchBenchmarkImages(queries: string[], limitPerQuery = 3): Promise<SearchOutcome> {
  const errors: string[] = [];

  try {
    const results = await searchMany(queries, (query) => searchPinterestOfficial(query, limitPerQuery));
    if (results.length) {
      return { platform: "pinterest", results: dedupeResults(results), errors };
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Pinterest search failed.");
  }

  try {
    const results = await searchMany(queries, (query) => searchSerpApiPinterest(query, limitPerQuery));
    if (results.length) {
      return { platform: "serpapi_pinterest", results: dedupeResults(results), errors };
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "SerpApi search failed.");
  }

  try {
    const results = await searchMany(queries, (query) => searchBingPinterest(query, limitPerQuery));
    if (results.length) {
      return { platform: "bing_pinterest", results: dedupeResults(results), errors };
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Bing search failed.");
  }

  return { platform: "fallback", results: [], errors };
}

export function defaultPinterestQueries(seed: {
  style?: string | null;
  location?: string | null;
  ideaTitle?: string | null;
  interventionLevel?: string | null;
  spaces?: string[];
}) {
  const style = seed.style || "mediterranean contemporary";
  const idea = seed.ideaTitle || "villa garden";
  const spaces = seed.spaces?.length ? seed.spaces.join(" ") : "pool terrace entrance garden";

  return [
    `site:pinterest.com mediterranean villa garden pool terrace ${idea}`,
    `site:pinterest.com jardin mediterraneen contemporain piscine villa ${style}`,
    `site:pinterest.com mediterranean courtyard garden pergola ${spaces}`,
    `site:pinterest.com modern mediterranean landscape architecture villa ${seed.interventionLevel || ""}`,
    `site:pinterest.com villa entrance landscape mediterranean planting`,
    `site:pinterest.com dry garden olive lavender gravel villa`
  ];
}

async function searchMany(
  queries: string[],
  searcher: (query: string) => Promise<ExternalBenchmarkImage[]>
) {
  const batches = await Promise.allSettled(queries.map((query) => searcher(query)));
  return batches.flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []));
}

async function searchSerpApiPinterest(query: string, limit: number): Promise<ExternalBenchmarkImage[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_API_KEY is not configured.");
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_images");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`SerpApi search failed: ${response.status}`);
  }

  const payload = await response.json();
  const images = Array.isArray(payload.images_results) ? payload.images_results : [];

  return images.slice(0, limit).map((item: any, index: number) => ({
    title: item.title || `Pinterest image result ${index + 1}`,
    source_platform: "serpapi_pinterest",
    image_url: item.original || item.thumbnail || null,
    thumbnail_url: item.thumbnail || item.original || null,
    source_url: item.link || item.source || null,
    image_query: query,
    position: item.position || index + 1
  }));
}

async function searchBingPinterest(query: string, limit: number): Promise<ExternalBenchmarkImage[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("BING_SEARCH_API_KEY is not configured.");
  }

  const url = new URL("https://api.bing.microsoft.com/v7.0/images/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(limit));
  url.searchParams.set("safeSearch", "Moderate");

  const response = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": apiKey },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Bing image search failed: ${response.status}`);
  }

  const payload = await response.json();
  const images = Array.isArray(payload.value) ? payload.value : [];

  return images.slice(0, limit).map((item: any, index: number) => ({
    title: item.name || `Bing Pinterest result ${index + 1}`,
    source_platform: "bing_pinterest",
    image_url: item.contentUrl || null,
    thumbnail_url: item.thumbnailUrl || item.contentUrl || null,
    source_url: item.hostPageUrl || item.webSearchUrl || null,
    image_query: query,
    position: index + 1
  }));
}

function dedupeResults(results: ExternalBenchmarkImage[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = result.source_url || result.image_url || result.thumbnail_url || `${result.title}-${result.position}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
