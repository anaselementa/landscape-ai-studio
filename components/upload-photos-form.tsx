"use client";

import { useState } from "react";

export function UploadPhotosForm({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const response = await fetch(`/api/projects/${projectId}/images`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      setMessage(error.error || "Erreur pendant l’upload.");
      setLoading(false);
      return;
    }

    setMessage("Photos importées.");
    form.reset();
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <label className="block">
        <span className="text-sm font-medium">Nom de l’espace</span>
        <input className="input mt-1" name="space_name" placeholder="Terrasse piscine" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Photos</span>
        <input className="input mt-1" name="files" type="file" accept="image/png,image/jpeg,image/webp" multiple required />
      </label>
      <button className="btn-primary" disabled={loading} type="submit">
        {loading ? "Upload..." : "Importer"}
      </button>
      {message ? <p className="text-sm text-stone-600 md:col-span-3">{message}</p> : null}
    </form>
  );
}
