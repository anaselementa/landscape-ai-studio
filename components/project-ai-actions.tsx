"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionName = "analyze" | "swot" | "references" | "ideas" | "plan";

const labels: Record<ActionName, { idle: string; loading: string }> = {
  analyze: { idle: "Analyser", loading: "Analyse..." },
  swot: { idle: "Generer SWOT", loading: "SWOT..." },
  references: { idle: "Benchmark", loading: "References..." },
  ideas: { idle: "Generer 3 idees", loading: "Idees..." },
  plan: { idle: "Plan texture", loading: "Plan..." }
};

export function ProjectAiActions({ projectId, hasAnalysis }: { projectId: string; hasAnalysis: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<ActionName | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run(action: ActionName) {
    setLoading(action);
    setError("");
    setMessage("");

    const response = await fetch(`/api/projects/${projectId}/${action}`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setLoading(null);

    if (!response.ok) {
      setError(data.error || "Action impossible.");
      return;
    }

    if (data.demoMode) {
      setMessage("Mode démo IA active : resultat demo sauvegarde.");
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={Boolean(loading)} onClick={() => run("analyze")} type="button">
          {loading === "analyze" ? labels.analyze.loading : labels.analyze.idle}
        </button>
        <button className="btn-secondary" disabled={Boolean(loading) || !hasAnalysis} onClick={() => run("swot")} type="button">
          {loading === "swot" ? labels.swot.loading : labels.swot.idle}
        </button>
        <button className="btn-secondary" disabled={Boolean(loading) || !hasAnalysis} onClick={() => run("references")} type="button">
          {loading === "references" ? labels.references.loading : labels.references.idle}
        </button>
        <button className="btn-secondary" disabled={Boolean(loading) || !hasAnalysis} onClick={() => run("ideas")} type="button">
          {loading === "ideas" ? labels.ideas.loading : labels.ideas.idle}
        </button>
        <button className="btn-secondary" disabled={Boolean(loading) || !hasAnalysis} onClick={() => run("plan")} type="button">
          {loading === "plan" ? labels.plan.loading : labels.plan.idle}
        </button>
      </div>
      {message ? <p className="text-sm font-medium text-[#315f43]">{message}</p> : null}
      {error ? <p className="text-sm font-medium text-[#9b2f22]">{error}</p> : null}
      {!hasAnalysis ? <p className="text-xs text-[#6b7280]">Les autres generations seront disponibles apres l'analyse.</p> : null}
    </div>
  );
}
