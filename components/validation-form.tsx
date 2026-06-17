"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ValidationForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(status: "approved" | "revision_requested", notes: string) {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/projects/${projectId}/validate`, {
      method: "POST",
      body: JSON.stringify({ status, notes }),
      headers: { "Content-Type": "application/json" }
    });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(result.error || "Erreur validation.");
      return;
    }
    router.refresh();
  }

  return (
    <form className="grid" onSubmit={(event) => event.preventDefault()}>
      {error ? <div className="error">{error}</div> : null}
      <label className="label">Notes de validation ou modifications demandees
        <textarea className="textarea" name="notes" id="validation-notes" placeholder="Ex : garder plus de pelouse, reduire le cout, plus mediterraneen sec..." />
      </label>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="button" disabled={loading} onClick={() => submit("approved", (document.getElementById("validation-notes") as HTMLTextAreaElement | null)?.value || "")}>Valider</button>
        <button type="button" className="button-secondary" disabled={loading} onClick={() => submit("revision_requested", (document.getElementById("validation-notes") as HTMLTextAreaElement | null)?.value || "")}>Demander modifications</button>
      </div>
    </form>
  );
}
