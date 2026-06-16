import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { UploadPhotosForm } from "@/components/upload-photos-form";
import { AnalyzeButton } from "@/components/analyze-button";
import { GenerateIdeasButton } from "@/components/generate-ideas-button";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const { data: images } = await supabaseAdmin
    .from("site_images")
    .select("*, image_analyses(*), design_ideas(*)")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-olive">← Retour</Link>
          <h1 className="mt-2 text-4xl font-semibold">{project.name}</h1>
          <p className="mt-2 text-stone-600">{project.project_type} · {project.location}</p>
          <p className="mt-1 text-stone-600">Style : {project.style}</p>
          <p className="mt-1 text-stone-600">Contraintes : {project.constraints}</p>
        </div>
      </header>

      <section className="card">
        <h2 className="text-2xl font-semibold">1. Importer les photos du site</h2>
        <p className="mt-2 text-stone-600">Ajoute les photos de Villa M ou d’un autre projet test.</p>
        <UploadPhotosForm projectId={id} />
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. Photos, analyses SWOT et idées</h2>
        {images?.length ? (
          <div className="grid gap-5">
            {images.map((image: any) => {
              const analysis = image.image_analyses?.[0];
              const ideas = image.design_ideas || [];
              return (
                <article key={image.id} className="card grid gap-5 md:grid-cols-[280px_1fr]">
                  <img src={image.public_url} alt={image.title || "Photo du site"} className="h-72 w-full rounded-xl object-cover" />
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">{image.title || "Photo sans titre"}</h3>
                      <p className="text-sm text-stone-500">{image.space_name || "Espace non nommé"}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <AnalyzeButton imageId={image.id} />
                      <GenerateIdeasButton imageId={image.id} disabled={!analysis} />
                    </div>

                    {analysis ? (
                      <div className="rounded-xl bg-stone-50 p-4">
                        <h4 className="font-semibold">Analyse IA</h4>
                        <p className="mt-2 text-sm text-stone-700">{analysis.summary}</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <SwotBox title="Strengths" items={analysis.analysis_json?.swot?.strengths} />
                          <SwotBox title="Weaknesses" items={analysis.analysis_json?.swot?.weaknesses} />
                          <SwotBox title="Opportunities" items={analysis.analysis_json?.swot?.opportunities} />
                          <SwotBox title="Threats" items={analysis.analysis_json?.swot?.threats} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-stone-500">Lance l’analyse IA pour obtenir le SWOT.</p>
                    )}

                    {ideas.length ? (
                      <div className="rounded-xl bg-amber-50 p-4">
                        <h4 className="font-semibold">Idées proposées</h4>
                        <div className="mt-3 grid gap-3">
                          {ideas.map((idea: any) => (
                            <div key={idea.id} className="rounded-xl bg-white p-3">
                              <h5 className="font-semibold">{idea.title}</h5>
                              <p className="mt-1 text-sm text-stone-700">{idea.description}</p>
                              <p className="mt-2 text-xs text-stone-500">Coût : {idea.cost_level || "à préciser"} · Entretien : {idea.maintenance_level || "à préciser"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="card">
            <p className="text-stone-600">Aucune photo importée.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function SwotBox({ title, items }: { title: string; items?: string[] }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <h5 className="font-medium">{title}</h5>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
        {(items || []).map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
}
