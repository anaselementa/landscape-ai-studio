"use client";

import { useState } from "react";

export function GenerateIdeasButton({ imageId, disabled }: { imageId: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false);

  async function generateIdeas() {
    setLoading(true);
    const response = await fetch(`/api/images/${imageId}/ideas`, { method: "POST" });
    setLoading(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.error || "Erreur génération idées");
      return;
    }
    window.location.reload();
  }

  return (
    <button className="btn-primary" onClick={generateIdeas} disabled={disabled || loading}>
      {loading ? "Idées..." : "Générer 3 idées"}
    </button>
  );
}
