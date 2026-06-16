import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectAiActions } from "@/components/project-ai-actions";
import { UploadPhotosForm } from "@/components/upload-photos-form";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { AnalysisRecord, IdeaRecord, Project, SiteImage, SwotRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,name,project_type,location,style,constraints,status,created_at,updated_at")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  const [{ data: images }, { data: analyses }, { data: swots }, { data: ideas }] = await Promise.all([
    supabase.from("site_images").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("analyses").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("swots").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("ideas").select("*").eq("project_id", id).order("created_at", { ascending: false })
  ]);

  const currentProject = project as Project;
  const latestAnalysis = (analyses?.[0] || null) as AnalysisRecord | null;
  const latestSwot = (swots?.[0] || null) as SwotRecord | null;
  const projectIdeas = (ideas || []) as IdeaRecord[];
  const projectImages = (images || []) as SiteImage[];

  return (
    <div className="space-y-8">
      <header className="grid gap-6 border-b border-[#ded8cc] pb-8 lg:grid-cols-[1fr_auto]">
        <div>
          <Link className="btn-quiet -ml-3" href="/">
            Retour
          </Link>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#315f43]">
            {currentProject.project_type || "Projet paysager"}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{currentProject.name}</h1>
          <div className="mt-4 grid gap-2 text-sm leading-6 text-[#5f675f] sm:grid-cols-2">
            <p>
              <span className="font-semibold text-[#17211b]">Localisation :</span>{" "}
              {currentProject.location || "A preciser"}
            </p>
            <p>
              <span className="font-semibold text-[#17211b]">Style :</span> {currentProject.style || "A definir"}
            </p>
            <p className="sm:col-span-2">
              <span className="font-semibold text-[#17211b]">Contraintes :</span>{" "}
              {currentProject.constraints || "Aucune contrainte renseignee"}
            </p>
          </div>
        </div>

        <div className="card h-fit p-5">
          <p className="mb-3 text-sm font-semibold">Actions IA</p>
          <ProjectAiActions projectId={id} hasAnalysis={Boolean(latestAnalysis)} />
        </div>
      </header>

      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Photos du site</h2>
            <p className="mt-1 text-sm text-[#5f675f]">Les images sont stockees dans le bucket Supabase `site-images`.</p>
          </div>
          <span className="text-sm font-semibold text-[#315f43]">{projectImages.length} photo(s)</span>
        </div>
        <UploadPhotosForm projectId={id} />
      </section>

      {projectImages.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projectImages.map((image) => (
            <article className="card overflow-hidden" key={image.id}>
              <div className="aspect-[4/3] bg-[#ded8cc]">
                <img
                  alt={image.title || "Photo du site"}
                  className="h-full w-full object-cover"
                  src={image.public_url}
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{image.space_name || "Espace non nomme"}</h3>
                <p className="mt-1 truncate text-sm text-[#6b7280]">{image.title || image.storage_path}</p>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="card p-6">
          <h2 className="text-xl font-semibold">Galerie vide</h2>
          <p className="mt-2 text-sm leading-6 text-[#5f675f]">
            Importe quelques photos avant de lancer l'analyse afin que l'IA puisse tenir compte de l'etat existant.
          </p>
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="card p-5">
          <h2 className="text-2xl font-semibold">Analyse paysagere</h2>
          {latestAnalysis ? (
            <div className="mt-4 space-y-5">
              <p className="rounded-md border border-[#ded8cc] bg-[#fffefa] p-4 text-sm leading-6 text-[#39423a]">
                {latestAnalysis.summary}
              </p>
              <DetailList title="Elements existants" items={latestAnalysis.analysis_json.existing_elements} />
              <DetailList title="A conserver" items={latestAnalysis.analysis_json.elements_to_keep} />
              <DetailList title="A ameliorer" items={latestAnalysis.analysis_json.elements_to_improve} />
              <div>
                <h3 className="font-semibold">Direction de design</h3>
                <p className="mt-2 text-sm leading-6 text-[#5f675f]">{latestAnalysis.analysis_json.design_direction}</p>
              </div>
            </div>
          ) : (
            <EmptyState text="Clique sur Analyser pour produire le premier diagnostic structure." />
          )}
        </article>

        <article className="card p-5">
          <h2 className="text-2xl font-semibold">SWOT</h2>
          {latestSwot ? (
            <div className="mt-4 grid gap-3">
              <SwotBox title="Forces" items={latestSwot.strengths} />
              <SwotBox title="Faiblesses" items={latestSwot.weaknesses} />
              <SwotBox title="Opportunites" items={latestSwot.opportunities} />
              <SwotBox title="Menaces" items={latestSwot.threats} />
            </div>
          ) : (
            <EmptyState text="Genere le SWOT apres l'analyse paysagere." />
          )}
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Idees d'amenagement</h2>
            <p className="mt-1 text-sm text-[#5f675f]">Trois pistes concretes, sauvegardees dans la table `ideas`.</p>
          </div>
        </div>

        {projectIdeas.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {projectIdeas.slice(0, 3).map((idea) => (
              <article className="card p-5" key={idea.id}>
                <span className="rounded-full border border-[#cfc7ba] px-3 py-1 text-xs font-bold uppercase text-[#315f43]">
                  {idea.intervention_level}
                </span>
                <h3 className="mt-4 text-xl font-semibold">{idea.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5f675f]">{idea.description}</p>
                <div className="mt-5 space-y-3 text-sm">
                  <DetailLine label="Materiaux" values={idea.materials} />
                  <DetailLine label="Vegetal" values={idea.plants} />
                  <DetailLine label="Mobilier" values={idea.furniture} />
                  <DetailLine label="Lumiere" values={idea.lighting} />
                </div>
                <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Cout : {idea.cost_level || "a preciser"} - Entretien : {idea.maintenance_level || "a preciser"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="card p-6">
            <EmptyState text="Genere 3 idees apres l'analyse pour alimenter cette section." />
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="mt-4 rounded-md border border-dashed border-[#cfc7ba] p-4 text-sm text-[#6b7280]">{text}</p>;
}

function DetailList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 grid gap-2 text-sm text-[#5f675f]">
        {items.map((item) => (
          <li className="rounded-md bg-[#fffefa] px-3 py-2" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SwotBox({ title, items }: { title: string; items?: string[] }) {
  return (
    <div className="rounded-md border border-[#ded8cc] bg-[#fffefa] p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-[#5f675f]">
        {(items || []).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function DetailLine({ label, values }: { label: string; values?: string[] }) {
  if (!values?.length) {
    return null;
  }

  return (
    <p>
      <span className="font-semibold text-[#17211b]">{label} :</span> {values.join(", ")}
    </p>
  );
}
