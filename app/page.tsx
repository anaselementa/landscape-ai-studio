import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let projects: Project[] = [];
  let setupError = "";

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,project_type,location,style,constraints,status,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      setupError = error.message;
    } else {
      projects = (data || []) as Project[];
    }
  } catch (error) {
    setupError = error instanceof Error ? error.message : "Configuration Supabase incomplete.";
  }

  return (
    <div className="space-y-8">
      <header className="grid gap-6 border-b border-[#ded8cc] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#315f43]">V0.1</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Landscape AI Studio</h1>
          <p className="mt-4 text-base leading-7 text-[#5f675f]">
            Creer des projets paysagers, importer les photos du site, puis produire une analyse,
            un SWOT et trois pistes d'amenagement avec l'IA.
          </p>
        </div>
        <Link className="btn-primary w-full sm:w-auto" href="/projects/new">
          Nouveau projet
        </Link>
      </header>

      {setupError ? (
        <section className="card border-[#c26d54] bg-[#fff7f3] p-5 text-[#7d2d1f]">
          <h2 className="font-semibold">Connexion a verifier</h2>
          <p className="mt-2 text-sm leading-6">
            {setupError} Verifie les variables d'environnement et le script SQL Supabase.
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.length ? (
          projects.map((project) => (
            <Link
              href={`/projects/${project.id}`}
              key={project.id}
              className="card group flex min-h-52 flex-col justify-between p-5 transition hover:border-[#315f43]"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#cfc7ba] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#315f43]">
                    {project.status || "draft"}
                  </span>
                  <span className="text-xs text-[#6b7280]">
                    {new Date(project.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <h2 className="mt-5 text-2xl font-semibold group-hover:text-[#315f43]">{project.name}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5f675f]">
                  {[project.project_type, project.location].filter(Boolean).join(" - ") || "Projet paysager"}
                </p>
              </div>
              <p className="mt-6 text-sm font-medium text-[#315f43]">
                {project.style ? `Style : ${project.style}` : "Style a definir"}
              </p>
            </Link>
          ))
        ) : (
          <div className="card p-6 sm:col-span-2 xl:col-span-3">
            <h2 className="text-xl font-semibold">Aucun projet pour le moment</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f675f]">
              Lance le premier projet pour tester le flux complet : fiche projet, photos,
              analyse IA, SWOT et idees d'amenagement.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
