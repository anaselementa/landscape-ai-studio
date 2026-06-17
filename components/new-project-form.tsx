"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/projects", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries())),
      headers: { "Content-Type": "application/json" }
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Erreur creation projet.");
      return;
    }

    router.push(`/projects/${result.project.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid">
      {error ? <div className="error">{error}</div> : null}
      <label className="label">Nom du projet
        <input className="input" name="name" required placeholder="Villa M" />
      </label>
      <div className="grid grid-2">
        <label className="label">Type
          <input className="input" name="project_type" placeholder="Reamenagement de jardin ancien de villa" />
        </label>
        <label className="label">Localisation
          <input className="input" name="location" placeholder="Casablanca" />
        </label>
      </div>
      <label className="label">Style souhaite
        <input className="input" name="style" placeholder="Mediterraneen contemporain" />
      </label>
      <label className="label">Contraintes
        <textarea className="textarea" name="constraints" placeholder="Ne pas denaturer l'existant completement" />
      </label>
      <button className="button" disabled={loading}>{loading ? "Creation..." : "Creer le projet"}</button>
    </form>
  );
}
