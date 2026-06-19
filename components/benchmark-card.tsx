"use client";

import { useMemo, useState } from "react";
import type { BenchmarkReference } from "@/lib/types";

export function BenchmarkCard({ reference }: { reference: BenchmarkReference }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = useMemo(() => getValidImageUrl(reference.image_url), [reference.image_url]);
  const showImage = Boolean(imageUrl && !failed);

  return (
    <article className="grid gap-4 rounded-md border border-[#ded8cc] bg-[#fffefa] p-3 sm:grid-cols-[160px_1fr]">
      {showImage && imageUrl ? (
        <img
          alt={reference.title}
          className="h-36 w-full rounded-md object-cover"
          onError={() => setFailed(true)}
          src={imageUrl}
        />
      ) : (
        <MoodboardPlaceholder title={reference.title} />
      )}
      <div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">{reference.title}</h3>
          <span className="rounded-full bg-[#315f43] px-2 py-1 text-xs font-bold text-white">{reference.score}/100</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#5f675f]">{reference.justification}</p>
        <p className="mt-3 rounded-md border border-[#ded8cc] bg-white px-3 py-2 text-xs font-semibold text-[#6b7280]">
          Requete image: {reference.image_query}
        </p>
      </div>
    </article>
  );
}

function MoodboardPlaceholder({ title }: { title: string }) {
  return (
    <div className="relative h-36 overflow-hidden rounded-md border border-[#ded8cc] bg-[#f2eadc]">
      <div className="absolute left-4 top-4 h-16 w-20 rounded-md bg-[#d8c7ad]" />
      <div className="absolute bottom-4 right-4 h-20 w-24 rounded-full bg-[#7f9a64]" />
      <div className="absolute left-14 top-16 h-12 w-28 rounded-full bg-[#b9a7cf]/70" />
      <div className="absolute inset-x-0 bottom-0 bg-white/80 p-2 text-xs font-bold uppercase tracking-wide text-[#315f43]">
        Moodboard
      </div>
      <span className="sr-only">{title}</span>
    </div>
  );
}

function getValidImageUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}
