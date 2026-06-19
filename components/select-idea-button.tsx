"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SelectIdeaButton({
  projectId,
  ideaId,
  selected
}: {
  projectId: string;
  ideaId: string;
  selected?: boolean | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function selectIdea() {
    setLoading(true);
    setError("");

    const response = await fetch(`/api/projects/${projectId}/select-idea`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea_id: ideaId })
    });
    const data = await response.json().catch(() => ({}));

    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Selection impossible.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button className={selected ? "btn-primary" : "btn-secondary"} disabled={selected || loading} onClick={selectIdea} type="button">
        {selected ? "Idee selectionnee" : loading ? "Selection..." : "Selectionner"}
      </button>
      {error ? <p className="text-sm font-medium text-[#9b2f22]">{error}</p> : null}
    </div>
  );
}
