import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function HomePage() {
  const { data: projects, error } = await supabaseAdmin
    .from("projects")
    .select("id,name,project_type,location,style,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-olive">Prototype V0.1</p>
          <h1 className="text-4xl font-semibold">Landscape AI Studio</h1>
          <p className="mt-2 max-w-2xl text-stone-600">
            Première version : créer un projet, importer des photos, générer une analyse, un SWOT et des idées d’aménagement.
          </p>
        </div>
        <Link className="btn-primary" href="/projects/new">Nouveau projet</Link>
      </header>

      {error ? (
        <div className="card border-red-200 bg-red-50 text-red-700">
          Erreur Supabase : {error.message}. Vérifie ton fichier .env.local et le script SQL.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {projects?.length ? (
          projects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id} className="card hover:border-olive">
              <h2 className="text-2xl font-semibold">{project.name}</h2>
              <p className="mt-2 text-stone-600">{project.project_type} · {project.location}</p>
              <p className="mt-1 text-stone-500">Style : {project.style || "Non indiqué"}</p>
            </Link>
          ))
        ) : (
          <div className="card md:col-span-2">
            <h2 className="text-xl font-semibold">Aucun projet pour l’instant</h2>
            <p className="mt-2 text-stone-600">Crée ton premier projet, par exemple “Villa M”.</p>
          </div>
        )}
      </section>
    </div>
  );
}
