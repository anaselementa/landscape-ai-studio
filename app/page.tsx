import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Project } from "@/lib/types";
import { safeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let projects: Project[] = [];
  let setupError = "";

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,project_type,location,style,constraints,status,selected_idea_id,created_at,updated_at")
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
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#315f43]">V0.3</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Landscape AI Studio</h1>
          <p className="mt-4 text-base leading-7 text-[#5f675f]">
            Analyse de site, SWOT, 3 idees, selection d'une piste, benchmark visuel et plan texture conceptuel.
          </p>
        </div>
        <Link className="btn-primary w-full sm:w-auto" href="/projects/new">Nouveau projet</Link>
      </header>

      {setupError ? (
        <section className="card border-[#c26d54] bg-[#fff7f3] p-5 text-[#7d2d1f]">
          <h2 className="font-semibold">Connexion a verifier</h2>
          <p className="mt-2 text-sm leading-6">{setupError}</p>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.length ? projects.map((project) => (
          <Link className="card p-5 transition hover:border-[#315f43]" href={`/projects/${project.id}`} key={project.id}>
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-[#cfc7ba] px-3 py-1 text-xs font-bold uppercase text-[#315f43]">
                {project.status || "draft"}
              </span>
              <span className="text-xs text-[#6b7280]">{safeDate(project.created_at)}</span>
            </div>
            <h2 className="mt-5 text-2xl font-semibold">{project.name}</h2>
            <p className="mt-2 text-sm leading-6 text-[#5f675f]">
              {[project.project_type, project.location].filter(Boolean).join(" - ") || "Projet paysager"}
            </p>
            <p className="mt-6 text-sm font-medium text-[#315f43]">{project.style || "Style a definir"}</p>
          </Link>
        )) : (
          <div className="card p-6 sm:col-span-2 xl:col-span-3">
            <h2 className="text-xl font-semibold">Aucun projet pour le moment</h2>
            <p className="mt-2 text-sm leading-6 text-[#5f675f]">Cree un projet pour tester le workflow V0.3 complet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
