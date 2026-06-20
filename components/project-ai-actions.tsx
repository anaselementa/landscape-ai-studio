"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionName = "analyze" | "swot" | "ideas" | "references" | "plan-texture";

const labels: Record<ActionName, { idle: string; loading: string }> = {
  analyze: { idle: "Analyser", loading: "Analyse..." },
  swot: { idle: "SWOT", loading: "SWOT..." },
  ideas: { idle: "3 idees", loading: "Idees..." },
  references: { idle: "Benchmark", loading: "Benchmark..." },
  "plan-texture": { idle: "Plan texture", loading: "Plan..." }
};

export function ProjectAiActions({
  projectId,
  hasAnalysis,
  hasSelectedIdea
}: {
  projectId: string;
  hasAnalysis: boolean;
  hasSelectedIdea: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<ActionName | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(action: ActionName) {
    setLoading(action);
    setMessage("");
    setError("");

    const response = await fetch(`/api/projects/${projectId}/${action}`, { method: "POST" });
    const data = await response.json().catch(() => ({}));

    setLoading(null);

    if (!response.ok) {
      setError(data.error || "Action impossible.");
      return;
    }

    setMessage(data.demoMode ? "Mode demo IA: resultat demo sauvegarde." : "Resultat sauvegarde.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(labels) as ActionName[]).map((action) => {
          const needsAnalysis = action !== "analyze";
          const needsIdea = action === "references" || action === "plan-texture";
          const disabled = Boolean(loading) || (needsAnalysis && !hasAnalysis) || (needsIdea && !hasSelectedIdea);

          return (
            <button
              className={action === "analyze" ? "btn-primary" : "btn-secondary"}
              disabled={disabled}
              key={action}
              onClick={() => run(action)}
              type="button"
            >
              {loading === action ? labels[action].loading : labels[action].idle}
            </button>
          );
        })}
      </div>
      {!hasAnalysis ? <p className="text-xs text-[#6b7280]">Commence par l'analyse du site.</p> : null}
      {hasAnalysis && !hasSelectedIdea ? <p className="text-xs text-[#6b7280]">Selectionne une idee pour orienter benchmark et plan.</p> : null}
      {message ? <p className="text-sm font-medium text-[#315f43]">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-[#9b2f22]">{error}</p> : null}
    </div>
  );
}
