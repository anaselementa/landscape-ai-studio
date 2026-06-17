"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IdeaRecord, SiteImage } from "@/lib/types";

export function AddPlanZoneForm({
  projectId,
  masterPlanId,
  images,
  ideas,
  disabled
}: {
  projectId: string;
  masterPlanId: string;
  images: SiteImage[];
  ideas: IdeaRecord[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch(`/api/projects/${projectId}/plan-zones`, {
      method: "POST",
      body: JSON.stringify({ ...payload, master_plan_id: masterPlanId }),
      headers: { "Content-Type": "application/json" }
    });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(result.error || "Erreur zone plan.");
      return;
    }
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid">
      {error ? <div className="error">{error}</div> : null}
      <label className="label">Nom de la zone
        <input className="input" name="name" placeholder="Zone piscine" required disabled={disabled} />
      </label>
      <label className="label">Description / position sur plan
        <textarea className="textarea" name="description" placeholder="Zone a gauche du plan, autour de la piscine..." disabled={disabled} />
      </label>
      <div className="grid grid-2">
        <label className="label">Photo associee
          <select className="select" name="site_image_id" disabled={disabled}>
            <option value="">Choisir</option>
            {images.map((image) => <option key={image.id} value={image.id}>{image.space_name || image.title || image.id}</option>)}
          </select>
        </label>
        <label className="label">Idee associee
          <select className="select" name="idea_id" disabled={disabled}>
            <option value="">Choisir</option>
            {ideas.map((idea) => <option key={idea.id} value={idea.id}>{idea.title}</option>)}
          </select>
        </label>
      </div>
      <button className="button-secondary" disabled={disabled || loading}>{loading ? "Ajout..." : "Ajouter zone"}</button>
      {disabled ? <span className="help">Importe un plan et genere/selectionne les idees avant de creer des zones.</span> : null}
    </form>
  );
}
