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
      .select("id,name,project_type,location,style,constraints,status,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) setupError = error.message;
    else projects = (data || []) as Project[];
  } catch (error) {
    setupError = error instanceof Error ? error.message : "Configuration Supabase incomplete.";
  }

  return (
    <main className="container">
      <div className="topbar">
        <div className="brand">
          <span className="kicker">V0.2 — Prototype complet</span>
          <h1>Landscape AI Studio</h1>
          <p>
            Prototype d'assistant IA pour passer de photos de site a une analyse, un SWOT, des references,
            des idees, une selection, un plan annote, un texturage 2D conceptuel et une validation finale.
          </p>
        </div>
        <Link className="button" href="/projects/new">Nouveau projet</Link>
      </div>

      {setupError ? (
        <div className="error">
          <strong>Connexion a verifier</strong>
          <p>{setupError}</p>
        </div>
      ) : null}

      <section className="grid grid-3">
        {projects.length ? projects.map((project) => (
          <Link href={`/projects/${project.id}`} key={project.id} className="card project-card">
            <div className="meta">
              <span className="badge">{project.status || "draft"}</span>
              <span className="badge badge-soft">{safeDate(project.created_at)}</span>
            </div>
            <h2>{project.name}</h2>
            <p>{[project.project_type, project.location].filter(Boolean).join(" - ") || "Projet paysager"}</p>
            <p>{project.style ? `Style : ${project.style}` : "Style a definir"}</p>
          </Link>
        )) : (
          <div className="card">
            <h2>Aucun projet pour le moment</h2>
            <p>Commence par creer Villa M ou un autre projet test.</p>
            <Link className="button" href="/projects/new">Creer le premier projet</Link>
          </div>
        )}
      </section>
    </main>
  );
}
