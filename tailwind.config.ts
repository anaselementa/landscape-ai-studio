"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UploadPhotosForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/projects/${projectId}/images`, { method: "POST", body: formData });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(result.error || "Erreur upload.");
      return;
    }
    (event.currentTarget.querySelector('input[type="file"]') as HTMLInputElement | null)?.value && event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid">
      {error ? <div className="error">{error}</div> : null}
      <label className="label">Espace
        <input className="input" name="space_name" placeholder="Jardin piscine" required />
      </label>
      <label className="label">Photos
        <input className="input" name="files" type="file" accept="image/*" multiple required />
      </label>
      <button className="button" disabled={loading}>{loading ? "Import..." : "Importer"}</button>
    </form>
  );
}
