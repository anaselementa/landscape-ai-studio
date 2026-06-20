import { searchPinterestOfficial, type ExternalBenchmarkImage } from "@/lib/pinterest-client";
import type { BenchmarkPlatform } from "@/lib/types";

type ExternalProvider = Exclude<BenchmarkPlatform, "fallback">;

type SearchOutcome = {
  platform: BenchmarkPlatform;
  results: ExternalBenchmarkImage[];
  errors: string[];
  configuredProviders: ExternalProvider[];
  attemptedProviders: ExternalProvider[];
};

type ProviderConfig = {
  platform: ExternalProvider;
  configured: boolean;
  search: (query: string, limit: number) => Promise<ExternalBenchmarkImage[]>;
};

export async function searchBenchmarkImages(queries: string[], limitPerQuery = 3): Promise<SearchOutcome> {
  const errors: string[] = [];
  const attemptedProviders: ExternalProvider[] = [];
  const providers = getProviderConfigs();
  const configuredProviders = providers.filter((provider) => provider.configured).map((provider) => provider.platform);

  if (!configuredProviders.length) {
    return { platform: "fallback", results: [], errors: ["Aucun provider benchmark externe configure."], configuredProviders, attemptedProviders };
  }

  for (const provider of providers) {
    if (!provider.configured) continue;

    attemptedProviders.push(provider.platform);
    const outcome = await searchMany(queries, (query) => provider.search(query, limitPerQuery), provider.platform);
    errors.push(...outcome.errors);

    const results = dedupeResults(outcome.results).filter(hasRequiredBenchmarkFields);
    if (results.length) {
      return {
        platform: provider.platform,
        results,
        errors,
        configuredProviders,
        attemptedProviders
      };
    }

    errors.push(`${provider.platform}: aucun resultat exploitable avec image, miniature et source.`);
  }

  return { platform: "fallback", results: [], errors, configuredProviders, attemptedProviders };
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
    `site:pinterest.com villa entrance landscape mediterranean planting ${seed.location || ""}`,
    `site:pinterest.com dry garden olive lavender gravel villa ${idea}`
  ];
}

function getProviderConfigs(): ProviderConfig[] {
  return [
    {
      platform: "pinterest",
      configured: Boolean(process.env.PINTEREST_ACCESS_TOKEN),
      search: (query, limit) => searchPinterestOfficial(stripPinterestSiteOperator(query), limit)
    },
    {
      platform: "serpapi_pinterest",
      configured: Boolean(process.env.SERPAPI_API_KEY),
      search: (query, limit) => searchSerpApiPinterest(ensurePinterestSiteQuery(query), limit)
    },
    {
      platform: "bing_pinterest",
      configured: Boolean(process.env.BING_SEARCH_API_KEY),
      search: (query, limit) => searchBingPinterest(ensurePinterestSiteQuery(query), limit)
    }
  ];
}

async function searchMany(
  queries: string[],
  searcher: (query: string) => Promise<ExternalBenchmarkImage[]>,
  platform: ExternalProvider
) {
  const batches = await Promise.allSettled(queries.map((query) => searcher(query)));
  const errors: string[] = [];
  const results = batches.flatMap((batch, index) => {
    if (batch.status === "fulfilled") {
      return batch.value;
    }
    errors.push(`${platform} / requete ${index + 1}: ${batch.reason instanceof Error ? batch.reason.message : String(batch.reason)}`);
    return [];
  });

  return { results, errors };
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
    throw new Error(`SerpApi search failed: ${response.status} ${await safeResponseText(response)}`);
  }

  const payload = await response.json();
  const images = Array.isArray(payload.images_results) ? payload.images_results : [];

  return images.slice(0, limit * 2).map((item: any, index: number) => {
    const imageUrl = item.original || item.thumbnail || null;
    const thumbnailUrl = item.thumbnail || item.original || null;
    return {
      title: item.title || `Pinterest image result ${index + 1}`,
      source_platform: "serpapi_pinterest",
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl,
      source_url: item.link || null,
      image_query: query,
      position: item.position || index + 1
    };
  });
}

async function searchBingPinterest(query: string, limit: number): Promise<ExternalBenchmarkImage[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("BING_SEARCH_API_KEY is not configured.");
  }

  const url = new URL("https://api.bing.microsoft.com/v7.0/images/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.max(limit * 2, 6)));
  url.searchParams.set("safeSearch", "Moderate");

  const response = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": apiKey },
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Bing image search failed: ${response.status} ${await safeResponseText(response)}`);
  }

  const payload = await response.json();
  const images = Array.isArray(payload.value) ? payload.value : [];

  return images.slice(0, limit * 2).map((item: any, index: number) => ({
    title: item.name || `Bing Pinterest result ${index + 1}`,
    source_platform: "bing_pinterest",
    image_url: item.contentUrl || item.thumbnailUrl || null,
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

function hasRequiredBenchmarkFields(result: ExternalBenchmarkImage) {
  return Boolean(result.title && result.image_url && result.thumbnail_url && result.source_url && result.image_query);
}

function stripPinterestSiteOperator(query: string) {
  return query.replace(/site:pinterest\.com/gi, "").replace(/\s+/g, " ").trim();
}

function ensurePinterestSiteQuery(query: string) {
  return query.toLowerCase().includes("site:pinterest.com") ? query : `site:pinterest.com ${query}`;
}

async function safeResponseText(response: Response) {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "";
  }
}
