"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PlanTextureButton({ projectId, disabled }: { projectId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function generate() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/projects/${projectId}/plan-texture`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage([data.error || "Plan texture impossible.", data.details].filter(Boolean).join(" "));
      return;
    }

    setMessage(data.demoMode ? `Plan demo sauvegarde (${data.zones_count || 0} zone(s)).` : `Plan texture sauvegarde (${data.zones_count || 0} zone(s)).`);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button className="btn-primary" disabled={disabled || loading} onClick={generate} type="button">
        {loading ? "Generation..." : "Generer habillage du plan"}
      </button>
      {message ? <p className="text-sm text-[#5f675f]">{message}</p> : null}
    </div>
  );
}
