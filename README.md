"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ActionButton({ label, endpoint, disabled }: { label: string; endpoint: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAction() {
    setLoading(true);
    setError("");
    const response = await fetch(endpoint, { method: "POST" });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(result.error || "Erreur action.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button className="button" onClick={runAction} disabled={disabled || loading}>
        {loading ? "Traitement..." : label}
      </button>
      {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
    </div>
  );
}
