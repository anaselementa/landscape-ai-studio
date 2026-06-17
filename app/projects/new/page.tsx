import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

async function createProject(formData: FormData) {
  "use server";

  const payload = {
    name: String(formData.get("name") || "").trim(),
    project_type: String(formData.get("project_type") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    style: String(formData.get("style") || "").trim(),
    constraints: String(formData.get("constraints") || "").trim(),
    status: "draft"
  };

  if (!payload.name) {
    throw new Error("Le nom du projet est obligatoire.");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("projects").insert(payload).select("id").single();

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/projects/${data.id}`);
}

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link className="btn-quiet -ml-3" href="/">
        Retour au dashboard
      </Link>

      <header>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#315f43]">Nouveau projet</p>
        <h1 className="mt-3 text-4xl font-semibold">Fiche paysagere</h1>
        <p className="mt-3 text-sm leading-6 text-[#5f675f]">
          Ces informations guident l'analyse IA et les propositions d'amenagement.
        </p>
      </header>

      <form action={createProject} className="card grid gap-5 p-6">
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Nom</span>
          <input className="input" name="name" placeholder="Villa M" required />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Type</span>
            <input className="input" name="project_type" placeholder="Jardin de villa" />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Localisation</span>
            <input className="input" name="location" placeholder="Casablanca" />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Style souhaite</span>
          <input className="input" name="style" placeholder="Mediterraneen contemporain" />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Contraintes</span>
          <textarea
            className="input min-h-32 resize-y"
            name="constraints"
            placeholder="Conserver les sujets existants, limiter les travaux lourds, tenir compte de l'ombre..."
          />
        </label>

        <div className="flex justify-end">
          <button className="btn-primary w-full sm:w-auto" type="submit">
            Creer le projet
          </button>
        </div>
      </form>
    </div>
  );
}
