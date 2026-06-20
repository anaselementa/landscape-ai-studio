"use client";

import { useMemo, useState } from "react";
import type { BenchmarkReference, BenchmarkResultRecord } from "@/lib/types";

type BenchmarkDisplay = BenchmarkReference | BenchmarkResultRecord;

export function BenchmarkCard({ reference }: { reference: BenchmarkDisplay }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = useMemo(() => getValidImageUrl(getThumbnail(reference) || getImage(reference)), [reference]);
  const showImage = Boolean(imageUrl && !failed);
  const platform = getPlatform(reference);
  const sourceUrl = getSourceUrl(reference);

  return (
    <article className="grid gap-4 rounded-md border border-[#ded8cc] bg-[#fffefa] p-3 sm:grid-cols-[170px_1fr]">
      {showImage && imageUrl ? (
        <img
          alt={reference.title}
          className="h-40 w-full rounded-md object-cover"
          onError={() => setFailed(true)}
          src={imageUrl}
        />
      ) : (
        <MoodboardPlaceholder title={reference.title} platform={platform} />
      )}

      <div className="flex flex-col justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">{platformLabel(platform)}</p>
              <h3 className="mt-1 font-semibold">{reference.title}</h3>
            </div>
            <span className="rounded-full bg-[#315f43] px-2 py-1 text-xs font-bold text-white">{getScore(reference)}/100</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#5f675f]">{reference.justification}</p>
          <p className="mt-3 rounded-md border border-[#ded8cc] bg-white px-3 py-2 text-xs font-semibold text-[#6b7280]">
            Requete image: {reference.image_query}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {sourceUrl ? (
            <a className="btn-secondary min-h-9 px-3 py-2 text-xs" href={sourceUrl} rel="noreferrer" target="_blank">
              Ouvrir la source
            </a>
          ) : null}
          <button className="btn-secondary min-h-9 px-3 py-2 text-xs" disabled type="button">
            Sauvegarder comme reference
          </button>
        </div>
      </div>
    </article>
  );
}

function MoodboardPlaceholder({ title, platform }: { title: string; platform?: string | null }) {
  return (
    <div className="relative h-40 overflow-hidden rounded-md border border-[#ded8cc] bg-[#f2eadc]">
      <div className="absolute left-4 top-4 h-16 w-20 rounded-md bg-[#d8c7ad]" />
      <div className="absolute bottom-5 right-4 h-20 w-24 rounded-full bg-[#7f9a64]" />
      <div className="absolute left-14 top-16 h-12 w-28 rounded-full bg-[#b9a7cf]/70" />
      <div className="absolute right-8 top-8 h-8 w-8 rounded-full bg-[#315f43]/70" />
      <div className="absolute inset-x-0 bottom-0 bg-white/85 p-2 text-xs font-bold uppercase tracking-wide text-[#315f43]">
        Moodboard {platformLabel(platform)}
      </div>
      <span className="sr-only">{title}</span>
    </div>
  );
}

function getValidImageUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}

function getImage(reference: BenchmarkDisplay) {
  return "image_url" in reference ? reference.image_url : null;
}

function getThumbnail(reference: BenchmarkDisplay) {
  return "thumbnail_url" in reference ? reference.thumbnail_url : null;
}

function getSourceUrl(reference: BenchmarkDisplay) {
  return "source_url" in reference ? reference.source_url : null;
}

function getPlatform(reference: BenchmarkDisplay) {
  return "source_platform" in reference ? reference.source_platform : null;
}

function getScore(reference: BenchmarkDisplay) {
  return "relevance_score" in reference ? reference.relevance_score : reference.score;
}

function platformLabel(platform?: string | null) {
  switch (platform) {
    case "pinterest":
      return "Pinterest";
    case "serpapi_pinterest":
      return "Google Images Pinterest";
    case "bing_pinterest":
      return "Bing Pinterest";
    default:
      return "Moodboard";
  }
}
