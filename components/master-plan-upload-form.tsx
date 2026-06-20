"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MasterPlanUploadForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = event.currentTarget;
    const response = await fetch(`/api/projects/${projectId}/master-plans`, {
      method: "POST",
      body: new FormData(form)
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(formatApiMessage(data, "Upload du plan impossible."));
      return;
    }

    setMessage(`Plan importe: ${data.master_plan?.title || "plan masse"}.`);
    form.reset();
    router.refresh();
  }

  return (
    <form className="grid gap-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end" onSubmit={onSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Titre</span>
        <input className="input" name="title" placeholder="Plan masse rez-de-jardin" />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Image plan</span>
        <input className="input" name="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required />
      </label>
      <button className="btn-primary" disabled={loading} type="submit">{loading ? "Import..." : "Importer plan"}</button>
      {message ? <p className="text-sm text-[#5f675f] lg:col-span-3">{message}</p> : null}
    </form>
  );
}

function formatApiMessage(data: any, fallback: string) {
  return [data?.error || fallback, data?.details].filter(Boolean).join(" ");
}
