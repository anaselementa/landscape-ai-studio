"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { IdeaRecord, SiteImage } from "@/lib/types";

export function AddPlanZoneForm({
  projectId,
  masterPlanId,
  images,
  selectedIdea
}: {
  projectId: string;
  masterPlanId: string;
  images: SiteImage[];
  selectedIdea: IdeaRecord | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);

    const response = await fetch(`/api/projects/${projectId}/plan-zones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        master_plan_id: masterPlanId,
        name: String(formData.get("name") || ""),
        zone_type: String(formData.get("zone_type") || ""),
        x: Number(formData.get("x") || 8),
        y: Number(formData.get("y") || 8),
        width: Number(formData.get("width") || 28),
        height: Number(formData.get("height") || 20),
        linked_site_image_id: String(formData.get("linked_site_image_id") || "") || null,
        linked_idea_id: formData.get("link_selected_idea") === "on" ? selectedIdea?.id || null : null,
        linked_generated_image_url: String(formData.get("linked_generated_image_url") || "") || null,
        notes: String(formData.get("notes") || "") || null,
        texture_instruction: String(formData.get("texture_instruction") || "") || null
      })
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setMessage(formatApiMessage(data, "Zone impossible a creer."));
      return;
    }

    setMessage("Zone ajoutee.");
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Nom zone</span>
          <input className="input" name="name" placeholder="Terrasse / jardin piscine" required />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Type</span>
          <input className="input" name="zone_type" placeholder="terrasse, piscine, entree..." />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <NumberField name="x" label="X %" value={8} />
        <NumberField name="y" label="Y %" value={8} />
        <NumberField name="width" label="Largeur %" value={28} />
        <NumberField name="height" label="Hauteur %" value={20} />
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Photo liee</span>
        <select className="input" name="linked_site_image_id">
          <option value="">Aucune</option>
          {images.map((image) => (
            <option key={image.id} value={image.id}>{image.space_name || image.title || image.id}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input name="link_selected_idea" type="checkbox" disabled={!selectedIdea} />
        Lier a l'idee selectionnee
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Image generee/proposition</span>
        <input className="input" name="linked_generated_image_url" placeholder="https://..." />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Instruction texture</span>
        <textarea className="input min-h-24" name="texture_instruction" placeholder="Pierre claire, massif aromatique, ombre legere..." />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Notes</span>
        <textarea className="input min-h-20" name="notes" />
      </label>
      <button className="btn-secondary" disabled={loading} type="submit">{loading ? "Ajout..." : "Ajouter zone"}</button>
      {message ? <p className="text-sm text-[#5f675f]">{message}</p> : null}
    </form>
  );
}

function formatApiMessage(data: any, fallback: string) {
  return [data?.error || fallback, data?.details].filter(Boolean).join(" ");
}

function NumberField({ name, label, value }: { name: string; label: string; value: number }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <input className="input" defaultValue={value} max={100} min={0} name={name} step={1} type="number" />
    </label>
  );
}
