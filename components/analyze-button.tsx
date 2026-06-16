"use client";

import { useState } from "react";

export function AnalyzeButton({ imageId }: { imageId: string }) {
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    const response = await fetch(`/api/images/${imageId}/analyze`, { method: "POST" });
    setLoading(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.error || "Erreur analyse IA");
      return;
    }
    window.location.reload();
  }

  return (
    <button className="btn-secondary" onClick={analyze} disabled={loading}>
      {loading ? "Analyse..." : "Analyser + SWOT"}
    </button>
  );
}
