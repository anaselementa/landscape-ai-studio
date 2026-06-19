"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SelectIdeaButton({ projectId, ideaId, disabled }: { projectId: string; ideaId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function selectIdea() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/projects/${projectId}/select-idea`, {
      method: "POST",
      body: JSON.stringify({ idea_id: ideaId }),
      headers: { "Content-Type": "application/json" }
    });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(result.error || "Erreur selection.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button className="button-secondary" onClick={selectIdea} disabled={disabled || loading}>
        {disabled ? "Deja selectionnee" : loading ? "Selection..." : "Selectionner cette idee"}
      </button>
      {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
    </div>
  );
}
