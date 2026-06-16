"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadPhotosForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = event.currentTarget;
    const response = await fetch(`/api/projects/${projectId}/images`, {
      method: "POST",
      body: new FormData(form)
    });

    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error || "Upload impossible.");
      return;
    }

    setMessage(`${data.uploaded?.length || 0} photo(s) importee(s).`);
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Espace</span>
        <input className="input" name="space_name" placeholder="Terrasse, entree, piscine..." />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Photos</span>
        <input className="input" name="files" type="file" accept="image/png,image/jpeg,image/webp" multiple required />
      </label>

      <button className="btn-primary" disabled={loading} type="submit">
        {loading ? "Import..." : "Importer"}
      </button>

      {message ? <p className="text-sm text-[#5f675f] lg:col-span-3">{message}</p> : null}
    </form>
  );
}
