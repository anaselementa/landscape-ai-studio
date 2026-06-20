import type { BenchmarkPlatform } from "@/lib/types";

export type ExternalBenchmarkImage = {
  title: string;
  source_platform: BenchmarkPlatform;
  image_url: string | null;
  thumbnail_url: string | null;
  source_url: string | null;
  image_query: string;
  position: number;
};

export async function searchPinterestOfficial(query: string, limit = 6): Promise<ExternalBenchmarkImage[]> {
  const token = process.env.PINTEREST_ACCESS_TOKEN;

  if (!token) {
    throw new Error("PINTEREST_ACCESS_TOKEN is not configured.");
  }

  const url = new URL("https://api.pinterest.com/v5/search/pins");
  url.searchParams.set("query", query);
  url.searchParams.set("page_size", String(Math.min(limit, 25)));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Pinterest search failed: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload.items) ? payload.items : [];

  return items.slice(0, limit).map((item: any, index: number) => {
    const media = item.media?.images || {};
    const image = media["1200x"]?.url || media["600x"]?.url || media.original?.url || null;
    const thumbnail = media["400x300"]?.url || media["150x150"]?.url || image;

    return {
      title: item.title || item.description || `Pinterest reference ${index + 1}`,
      source_platform: "pinterest",
      image_url: image,
      thumbnail_url: thumbnail,
      source_url: item.link || item.url || null,
      image_query: query,
      position: index + 1
    };
  });
}
