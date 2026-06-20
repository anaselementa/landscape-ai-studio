import Link from "next/link";
import { notFound } from "next/navigation";
import { BenchmarkCard } from "@/components/benchmark-card";
import { PrintButton } from "@/components/print-button";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { AnalysisRecord, BenchmarkResultRecord, IdeaRecord, MasterPlanRecord, PlanRecord, PlanZoneRecord, Project, SiteImage, SwotRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error || !project) notFound();

  const [{ data: images }, { data: analyses }, { data: swots }, { data: ideas }, { data: benchmarks }, { data: plans }, { data: masterPlans }, { data: zones }] = await Promise.all([
    supabase.from("site_images").select("*").eq("project_id", id).order("created_at", { ascending: true }),
    supabase.from("analyses").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("swots").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("ideas").select("*").eq("project_id", id).order("created_at", { ascending: true }),
    supabase.from("benchmark_results").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(8),
    supabase.from("plans").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("master_plans").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("plan_zones").select("*").eq("project_id", id).order("created_at", { ascending: true })
  ]);

  const currentProject = project as Project;
  const latestAnalysis = (analyses?.[0] || null) as AnalysisRecord | null;
  const latestSwot = (swots?.[0] || null) as SwotRecord | null;
  const projectImages = (images || []) as SiteImage[];
  const projectIdeas = (ideas || []) as IdeaRecord[];
  const benchmarkItems = (benchmarks || []) as BenchmarkResultRecord[];
  const latestPlan = (plans?.[0] || null) as PlanRecord | null;
  const latestMasterPlan = (masterPlans?.[0] || null) as MasterPlanRecord | null;
  const planZones = (zones || []) as PlanZoneRecord[];
  const selectedIdea = projectIdeas.find((idea) => idea.selected || idea.id === currentProject.selected_idea_id);

  return (
    <div className="space-y-8 print:bg-white">
      <header className="flex flex-col gap-4 border-b border-[#ded8cc] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="btn-quiet -ml-3 print:hidden" href={`/projects/${id}`}>Retour projet</Link>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#315f43]">Rapport V0.4</p>
          <h1 className="mt-2 text-4xl font-semibold">{currentProject.name}</h1>
          <p className="mt-2 text-sm text-[#5f675f]">{[currentProject.project_type, currentProject.location, currentProject.style].filter(Boolean).join(" - ")}</p>
        </div>
        <div className="print:hidden"><PrintButton /></div>
      </header>

      <ReportSection title="Fiche projet">
        <p><strong>Contraintes:</strong> {currentProject.constraints || "Non renseignees"}</p>
        <p><strong>Idee selectionnee:</strong> {selectedIdea?.title || "Aucune"}</p>
      </ReportSection>

      <ReportSection title="Photos">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectImages.map((image) => (
            <figure className="card overflow-hidden" key={image.id}>
              <img alt={image.title || "Photo"} className="h-48 w-full object-cover" src={image.public_url} />
              <figcaption className="p-3 text-sm">{image.space_name || image.title}</figcaption>
            </figure>
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Analyse">
        <p>{latestAnalysis?.summary || "Aucune analyse."}</p>
        <List title="Direction" items={latestAnalysis ? [latestAnalysis.analysis_json.design_direction] : []} />
        <List title="Analyse par photo" items={(latestAnalysis?.analysis_json.photo_analyses || []).map((photo) => `${photo.probable_space}: ${photo.problems.join(", ")}`)} />
      </ReportSection>

      <ReportSection title="SWOT">
        <List title="Forces" items={latestSwot?.strengths} />
        <List title="Faiblesses" items={latestSwot?.weaknesses} />
        <List title="Opportunites" items={latestSwot?.opportunities} />
        <List title="Menaces" items={latestSwot?.threats} />
      </ReportSection>

      <ReportSection title="Benchmark Pinterest">
        <div className="grid gap-4">
          {benchmarkItems.map((item) => <BenchmarkCard key={item.id} reference={item} />)}
        </div>
      </ReportSection>

      <ReportSection title="Idees">
        <div className="grid gap-4 lg:grid-cols-3">
          {projectIdeas.map((idea) => (
            <article className="card p-4" key={idea.id}>
              <p className="text-xs font-bold uppercase text-[#315f43]">{idea.intervention_level}</p>
              <h3 className="mt-2 font-semibold">{idea.title}</h3>
              <p className="mt-2 text-sm text-[#5f675f]">{idea.description}</p>
            </article>
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Plan importe et zones">
        {latestMasterPlan ? <p><strong>Plan:</strong> {latestMasterPlan.title || latestMasterPlan.file_url}</p> : <p>Aucun plan importe.</p>}
        <List title="Zones" items={planZones.map((zone) => `${zone.name}: ${zone.texture_instruction || zone.zone_type || "sans instruction"}`)} />
      </ReportSection>

      <ReportSection title="Plan texture et prompts">
        {latestPlan ? (
          <div className="space-y-4">
            {latestPlan.concept_svg ? <div className="overflow-hidden rounded-md border border-[#ded8cc] bg-white" dangerouslySetInnerHTML={{ __html: latestPlan.concept_svg }} /> : null}
            <p>{latestPlan.realistic_image_prompt}</p>
            <List title="Prompts par zone" items={(latestPlan.plan_json.zone_proposals || []).map((zone) => `${zone.zone_name}: ${zone.image_prompt}`)} />
          </div>
        ) : <p>Aucun plan texture.</p>}
      </ReportSection>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card break-inside-avoid p-5">
      <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
      <div className="space-y-3 text-sm leading-6 text-[#39423a]">{children}</div>
    </section>
  );
}

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="font-semibold text-[#17211b]">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
