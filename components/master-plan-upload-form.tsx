"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MasterPlanUploadForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/projects/${projectId}/master-plan`, { method: "POST", body: formData });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(result.error || "Erreur import plan.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid">
      {error ? <div className="error">{error}</div> : null}
      <label className="label">Titre du plan
        <input className="input" name="title" placeholder="Plan masse existant" />
      </label>
      <label className="label">Plan masse image
        <input className="input" name="file" type="file" accept="image/*,.pdf" required />
      </label>
      <button className="button-secondary" disabled={loading}>{loading ? "Import..." : "Importer plan masse"}</button>
    </form>
  );
}
