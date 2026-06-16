import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function createProject(formData: FormData) {
  "use server";

  const payload = {
    name: String(formData.get("name") || "").trim(),
    project_type: String(formData.get("project_type") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    style: String(formData.get("style") || "").trim(),
    constraints: String(formData.get("constraints") || "").trim(),
    budget_level: String(formData.get("budget_level") || "").trim()
  };

  if (!payload.name) throw new Error("Le nom du projet est obligatoire.");

  const { data, error } = await supabaseAdmin
    .from("projects")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/projects/${data.id}`);
}

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Nouveau projet</h1>
        <p className="mt-2 text-stone-600">Remplis les informations de base du projet paysager.</p>
      </div>

      <form action={createProject} className="card space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Nom du projet</span>
          <input className="input mt-1" name="name" placeholder="Villa M" required />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Type de projet</span>
          <input className="input mt-1" name="project_type" placeholder="Réaménagement de jardin ancien de villa" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Localisation</span>
          <input className="input mt-1" name="location" placeholder="Casablanca" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Style souhaité</span>
          <input className="input mt-1" name="style" placeholder="Méditerranéen contemporain" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Budget</span>
          <input className="input mt-1" name="budget_level" placeholder="Non indiqué / moyen / premium" />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Contraintes</span>
          <textarea className="input mt-1 min-h-28" name="constraints" placeholder="Ne pas dénaturer l'existant complètement." />
        </label>

        <button className="btn-primary" type="submit">Créer le projet</button>
      </form>
    </div>
  );
}
