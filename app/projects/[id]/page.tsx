import Link from "next/link";
import { notFound } from "next/navigation";
import { BenchmarkCard } from "@/components/benchmark-card";
import { ProjectAiActions } from "@/components/project-ai-actions";
import { SelectIdeaButton } from "@/components/select-idea-button";
import { UploadPhotosForm } from "@/components/upload-photos-form";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { AnalysisRecord, BenchmarkRecord, IdeaRecord, PlanRecord, Project, SiteImage, SwotRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,name,project_type,location,style,constraints,status,selected_idea_id,created_at,updated_at")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  const [{ data: images }, { data: analyses }, { data: swots }, { data: ideas }, { data: benchmarks }, { data: plans }] = await Promise.all([
    supabase.from("site_images").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("analyses").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("swots").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("ideas").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("benchmarks").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("plans").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1)
  ]);

  const currentProject = project as Project;
  const latestAnalysis = (analyses?.[0] || null) as AnalysisRecord | null;
  const latestSwot = (swots?.[0] || null) as SwotRecord | null;
  const projectIdeas = (ideas || []) as IdeaRecord[];
  const latestBenchmark = (benchmarks?.[0] || null) as BenchmarkRecord | null;
  const latestPlan = (plans?.[0] || null) as PlanRecord | null;
  const projectImages = (images || []) as SiteImage[];
  const selectedIdea = projectIdeas.find((idea) => idea.selected || idea.id === currentProject.selected_idea_id) || null;

  return (
    <div className="space-y-8">
      <header className="grid gap-6 border-b border-[#ded8cc] pb-8 lg:grid-cols-[1fr_auto]">
        <div>
          <Link className="btn-quiet -ml-3" href="/">Retour</Link>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#315f43]">{currentProject.project_type || "Projet paysager"}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{currentProject.name}</h1>
          <div className="mt-4 grid gap-2 text-sm leading-6 text-[#5f675f] sm:grid-cols-2">
            <p><span className="font-semibold text-[#17211b]">Localisation :</span> {currentProject.location || "A preciser"}</p>
            <p><span className="font-semibold text-[#17211b]">Style :</span> {currentProject.style || "A definir"}</p>
            <p className="sm:col-span-2"><span className="font-semibold text-[#17211b]">Contraintes :</span> {currentProject.constraints || "Aucune contrainte renseignee"}</p>
          </div>
          {selectedIdea ? (
            <p className="mt-4 inline-flex rounded-full border border-[#315f43] bg-[#eef5ed] px-3 py-1 text-sm font-semibold text-[#315f43]">
              Idee selectionnee: {selectedIdea.title}
            </p>
          ) : null}
        </div>
        <div className="card h-fit p-5">
          <p className="mb-3 text-sm font-semibold">Actions IA V0.3</p>
          <ProjectAiActions projectId={id} hasAnalysis={Boolean(latestAnalysis)} hasSelectedIdea={Boolean(selectedIdea)} />
        </div>
      </header>

      <section className="card p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Photos du site</h2>
            <p className="mt-1 text-sm text-[#5f675f]">Les photos sont stockees dans Supabase Storage `site-images`.</p>
          </div>
          <span className="text-sm font-semibold text-[#315f43]">{projectImages.length} photo(s)</span>
        </div>
        <UploadPhotosForm projectId={id} />
      </section>

      {projectImages.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {projectImages.map((image) => (
            <article className="card overflow-hidden" key={image.id}>
              <div className="aspect-[4/3] bg-[#ded8cc]">
                <img alt={image.title || "Photo du site"} className="h-full w-full object-cover" src={image.public_url} />
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{image.space_name || "Espace non nomme"}</h3>
                <p className="mt-1 truncate text-sm text-[#6b7280]">{image.title || image.storage_path}</p>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="card p-5">
          <SectionTitle title="Analyse paysagere" isDemo={Boolean(latestAnalysis?.is_demo)} />
          {latestAnalysis ? (
            <div className="mt-4 space-y-5">
              <p className="rounded-md border border-[#ded8cc] bg-[#fffefa] p-4 text-sm leading-6 text-[#39423a]">{latestAnalysis.summary}</p>
              <DetailList title="Elements existants" items={latestAnalysis.analysis_json.existing_elements} />
              <DetailList title="Opportunites" items={latestAnalysis.analysis_json.opportunities} />
              <DetailList title="Contraintes a respecter" items={latestAnalysis.analysis_json.constraints_to_respect} />
              <p className="text-sm leading-6 text-[#5f675f]"><span className="font-semibold text-[#17211b]">Direction :</span> {latestAnalysis.analysis_json.design_direction}</p>
              <div>
                <h3 className="font-semibold">Analyse par photo</h3>
                <div className="mt-3 grid gap-3">
                  {(latestAnalysis.analysis_json.photo_analyses || []).map((photo, index) => (
                    <div className="rounded-md border border-[#ded8cc] bg-[#fffefa] p-4" key={`${photo.photo_id || photo.probable_space}-${index}`}>
                      <p className="text-sm font-bold text-[#315f43]">{photo.probable_space}</p>
                      <div className="mt-3 grid gap-3 text-sm leading-6 text-[#5f675f] md:grid-cols-2">
                        <CompactList title="Elements visibles" items={photo.visible_existing_elements} />
                        <CompactList title="Materiaux" items={photo.visible_materials} />
                        <CompactList title="Vegetation" items={photo.visible_vegetation} />
                        <CompactList title="Usages possibles" items={photo.possible_uses} />
                        <CompactList title="Problemes" items={photo.problems} />
                        <CompactList title="Interventions" items={photo.recommended_interventions} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : <EmptyState text="Lance l'analyse pour produire le diagnostic structure." />}
        </article>

        <article className="card p-5">
          <SectionTitle title="SWOT" isDemo={Boolean(latestSwot?.is_demo)} />
          {latestSwot ? (
            <div className="mt-4 grid gap-3">
              <SwotBox title="Forces" items={latestSwot.strengths} />
              <SwotBox title="Faiblesses" items={latestSwot.weaknesses} />
              <SwotBox title="Opportunites" items={latestSwot.opportunities} />
              <SwotBox title="Menaces" items={latestSwot.threats} />
            </div>
          ) : <EmptyState text="Genere le SWOT apres l'analyse." />}
        </article>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Idees d'amenagement" isDemo={projectIdeas.slice(0, 3).some((idea) => idea.is_demo)} />
        {projectIdeas.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {projectIdeas.slice(0, 3).map((idea) => (
              <article className={`card p-5 ${idea.selected ? "border-[#315f43] bg-[#f2f7ef]" : ""}`} key={idea.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#cfc7ba] px-3 py-1 text-xs font-bold uppercase text-[#315f43]">{idea.intervention_level}</span>
                  <SelectIdeaButton projectId={id} ideaId={idea.id} selected={idea.selected} />
                </div>
                <h3 className="mt-4 text-xl font-semibold">{idea.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5f675f]">{idea.description}</p>
                <DetailLine label="Espaces" values={idea.spaces_concerned} />
                <DetailLine label="Gestes spatiaux" values={idea.spatial_moves} />
                <DetailLine label="Mots-cles" values={idea.concept_keywords} />
                <DetailLine label="Materiaux" values={idea.materials} />
                <DetailLine label="Vegetal" values={idea.plants} />
                <DetailLine label="Mobilier" values={idea.furniture} />
                <DetailLine label="Eclairage" values={idea.lighting} />
                <DetailLine label="Conserve" values={idea.preserved_elements} />
                <DetailLine label="Transforme" values={idea.transformed_elements} />
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                  Cout: {idea.cost_level || "a preciser"} - Entretien: {idea.maintenance_level || "a preciser"}
                </p>
              </article>
            ))}
          </div>
        ) : <div className="card p-6"><EmptyState text="Genere 3 idees, puis selectionne celle qui guidera benchmark et plan." /></div>}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <article className="card p-5">
          <SectionTitle title="Benchmark visuel" isDemo={Boolean(latestBenchmark?.is_demo)} />
          {latestBenchmark?.benchmark_json.references?.length ? (
            <div className="mt-4 grid gap-4">
              {latestBenchmark.benchmark_json.references.map((reference) => (
                <BenchmarkCard key={reference.title} reference={reference} />
              ))}
            </div>
          ) : <EmptyState text="Selectionne une idee, puis genere le benchmark visuel." />}
        </article>

        <article className="card p-5">
          <SectionTitle title="Plan texture conceptuel" isDemo={Boolean(latestPlan?.is_demo)} />
          {latestPlan ? (
            <div className="mt-4 space-y-4">
              <p className="rounded-md border border-[#d8a555] bg-[#fff7df] px-4 py-3 text-sm font-bold text-[#8a5a00]">
                {latestPlan.plan_json.non_metric_warning || "Schéma conceptuel, non métrique"}
              </p>
              {latestPlan.concept_svg ? <div className="overflow-hidden rounded-md border border-[#ded8cc] bg-white" dangerouslySetInnerHTML={{ __html: latestPlan.concept_svg }} /> : null}
              <p className="rounded-md border border-[#ded8cc] bg-[#fffefa] p-4 text-sm leading-6 text-[#39423a]">{latestPlan.realistic_image_prompt}</p>
              <DetailList title="Zones" items={latestPlan.plan_json.zones} />
              <DetailList title="Legende materiaux" items={latestPlan.plan_json.material_legend} />
              <DetailList title="Legende vegetation" items={latestPlan.plan_json.planting_legend} />
              <DetailList title="Validation" items={latestPlan.plan_json.validation_notes} />
            </div>
          ) : <EmptyState text="Selectionne une idee, puis genere le plan texture et le prompt realiste." />}
        </article>
      </section>
    </div>
  );
}

function SectionTitle({ title, isDemo }: { title: string; isDemo?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {isDemo ? <span className="rounded-full border border-[#d8a555] bg-[#fff7df] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#8a5a00]">Mode demo IA</span> : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="mt-4 rounded-md border border-dashed border-[#cfc7ba] p-4 text-sm text-[#6b7280]">{text}</p>;
}

function DetailList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 grid gap-2 text-sm text-[#5f675f]">
        {items.map((item) => <li className="rounded-md bg-[#fffefa] px-3 py-2" key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function CompactList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <span className="font-semibold text-[#17211b]">{title}</span>
      <p>{items.join(", ")}</p>
    </div>
  );
}

function SwotBox({ title, items }: { title: string; items?: string[] }) {
  return (
    <div className="rounded-md border border-[#ded8cc] bg-[#fffefa] p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-[#5f675f]">
        {(items || []).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function DetailLine({ label, values }: { label: string; values?: string[] }) {
  if (!values?.length) return null;
  return <p className="mt-3 text-sm text-[#5f675f]"><span className="font-semibold text-[#17211b]">{label} :</span> {values.join(", ")}</p>;
}
