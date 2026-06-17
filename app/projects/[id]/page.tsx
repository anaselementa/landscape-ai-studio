import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { AnalysisRecord, IdeaRecord, MasterPlan, PlanRender, PlanZone, Project, ReferenceRecord, SiteImage, SwotRecord, ValidationRecord } from "@/lib/types";
import { safeDate, safeJson } from "@/lib/utils";
import { UploadPhotosForm } from "@/components/upload-photos-form";
import { ActionButton } from "@/components/action-button";
import { SelectIdeaButton } from "@/components/select-idea-button";
import { MasterPlanUploadForm } from "@/components/master-plan-upload-form";
import { AddPlanZoneForm } from "@/components/add-plan-zone-form";
import { ValidationForm } from "@/components/validation-form";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,name,project_type,location,style,constraints,status,created_at,updated_at")
    .eq("id", id)
    .single();

  if (projectError || !project) notFound();

  const [imagesRes, analysesRes, swotsRes, refsRes, ideasRes, plansRes, zonesRes, rendersRes, validationsRes] = await Promise.all([
    supabase.from("site_images").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("analyses").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("swots").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("project_references").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("ideas").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("master_plans").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("plan_zones").select("*").eq("project_id", id).order("created_at", { ascending: true }),
    supabase.from("plan_renders").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("validations").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1)
  ]);

  const currentProject = project as Project;
  const images = (imagesRes.data || []) as SiteImage[];
  const analysis = (analysesRes.data?.[0] || null) as AnalysisRecord | null;
  const swot = (swotsRes.data?.[0] || null) as SwotRecord | null;
  const references = (refsRes.data || []) as ReferenceRecord[];
  const ideas = (ideasRes.data || []) as IdeaRecord[];
  const selectedIdea = ideas.find((idea) => idea.selected || idea.status === "selected") || null;
  const masterPlan = (plansRes.data?.[0] || null) as MasterPlan | null;
  const zones = (zonesRes.data || []) as PlanZone[];
  const render = (rendersRes.data?.[0] || null) as PlanRender | null;
  const validation = (validationsRes.data?.[0] || null) as ValidationRecord | null;

  const steps = [
    ["1", "Upload photos", images.length > 0],
    ["2", "Analyse", Boolean(analysis)],
    ["3", "SWOT", Boolean(swot)],
    ["4", "References", references.length > 0],
    ["5", "Idees", ideas.length > 0],
    ["6", "Selection", Boolean(selectedIdea)],
    ["7", "Plan", Boolean(masterPlan && zones.length > 0)],
    ["8", "Texturage 2D", Boolean(render)],
    ["9", "Plan realiste", Boolean(render?.render_json?.realistic_plan_prompt)],
    ["10", "Validation", Boolean(validation)]
  ] as const;

  return (
    <main className="container">
      <div className="topbar">
        <div>
          <Link href="/" className="button-secondary">Retour</Link>
          <div style={{ height: 16 }} />
          <span className="kicker">{currentProject.project_type || "Projet paysager"}</span>
          <h1>{currentProject.name}</h1>
          <p>
            <strong>Localisation :</strong> {currentProject.location || "A preciser"} · <strong>Style :</strong> {currentProject.style || "A definir"}
          </p>
          <p><strong>Contraintes :</strong> {currentProject.constraints || "Aucune contrainte renseignee"}</p>
        </div>
        <span className="badge">{currentProject.status || "draft"}</span>
      </div>

      <section className="card">
        <h2>Progression du prototype</h2>
        <div className="workflow">
          {steps.map(([number, label, done]) => (
            <div key={number} className={`step ${done ? "done" : ""}`}>
              <strong>{number}. {label}</strong>
              {done ? "Pret" : "A faire"}
            </div>
          ))}
        </div>
      </section>

      <div className="columns" style={{ marginTop: 18 }}>
        <div className="grid">
          <section className="card">
            <h2>1. Photos du site</h2>
            <p>Importe les photos par espace : piscine, entree, jardin lateral, passage, facade, etc.</p>
            <UploadPhotosForm projectId={currentProject.id} />
            <div className="divider" />
            <div className="photo-grid">
              {images.map((image) => (
                <div className="photo-card" key={image.id}>
                  {image.public_url || image.image_url ? <img src={image.public_url || image.image_url || ""} alt={image.title || "Photo du site"} /> : null}
                  <div className="body">
                    <strong>{image.space_name || "Espace non nomme"}</strong>
                    <p>{image.title || image.storage_path}</p>
                  </div>
                </div>
              ))}
            </div>
            {!images.length ? <p>Aucune photo importee pour le moment.</p> : null}
          </section>

          <section className="card">
            <h2>2. Analyse du site</h2>
            <p>L'IA lit les photos et le brief pour produire une analyse paysagere globale.</p>
            <ActionButton label="Analyser le site" endpoint={`/api/projects/${id}/analyze`} disabled={!images.length} />
            {analysis ? (
              <div className="success" style={{ marginTop: 16 }}>
                <strong>Analyse du {safeDate(analysis.created_at)}</strong>
                <p>{analysis.summary}</p>
                {analysis.analysis_json?.design_direction ? <p><strong>Direction :</strong> {analysis.analysis_json.design_direction}</p> : null}
              </div>
            ) : null}
          </section>

          <section className="card">
            <h2>3. SWOT</h2>
            <ActionButton label="Generer SWOT" endpoint={`/api/projects/${id}/swot`} disabled={!analysis} />
            {swot ? (
              <div className="grid grid-2" style={{ marginTop: 16 }}>
                <ListBox title="Strengths" items={swot.strengths || []} />
                <ListBox title="Weaknesses" items={swot.weaknesses || []} />
                <ListBox title="Opportunities" items={swot.opportunities || []} />
                <ListBox title="Threats" items={swot.threats || []} />
              </div>
            ) : null}
          </section>

          <section className="card">
            <h2>4. References / benchmark</h2>
            <p>Le prototype genere des pistes de references et des requetes visuelles. Plus tard, on branchera une vraie recherche web ou une bibliotheque interne.</p>
            <ActionButton label="Generer references" endpoint={`/api/projects/${id}/references`} disabled={!analysis} />
            <div className="grid" style={{ marginTop: 16 }}>
              {references.map((ref) => (
                <div className="card" key={ref.id} style={{ boxShadow: "none" }}>
                  <h3>{ref.title}</h3>
                  <p>{ref.description}</p>
                  <p><strong>Recherche image :</strong> {ref.image_query}</p>
                  <p><strong>Pourquoi :</strong> {ref.reason}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>5. Idees par espace</h2>
            <ActionButton label="Generer 3 idees" endpoint={`/api/projects/${id}/ideas`} disabled={!analysis} />
            <div className="grid" style={{ marginTop: 16 }}>
              {ideas.map((idea) => (
                <div className="card" key={idea.id} style={{ boxShadow: "none", borderColor: idea.selected ? "#8fc3a1" : undefined }}>
                  <div className="meta">
                    <span className="badge">{idea.intervention_level || "niveau"}</span>
                    {idea.selected ? <span className="badge">Selectionnee</span> : null}
                  </div>
                  <h3>{idea.title}</h3>
                  <p>{idea.description}</p>
                  <DetailLine label="Materiaux" items={idea.materials || []} />
                  <DetailLine label="Vegetaux" items={idea.plants || []} />
                  <DetailLine label="Mobilier" items={idea.furniture || []} />
                  <DetailLine label="Lumiere" items={idea.lighting || []} />
                  <p><strong>Cout :</strong> {idea.cost_level || "a preciser"} · <strong>Entretien :</strong> {idea.maintenance_level || "a preciser"}</p>
                  <SelectIdeaButton projectId={id} ideaId={idea.id} disabled={Boolean(idea.selected)} />
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>7. Insertion dans le plan</h2>
            <p>Importe un plan masse, puis cree des zones qui associent chaque espace a une photo et a une idee.</p>
            <MasterPlanUploadForm projectId={id} />
            {masterPlan ? (
              <div style={{ marginTop: 16 }}>
                <h3>Plan masse importe</h3>
                {masterPlan.public_url ? <img src={masterPlan.public_url} alt="Plan masse" style={{ width: "100%", borderRadius: 22, border: "1px solid var(--line)" }} /> : null}
              </div>
            ) : null}
            <div className="divider" />
            <AddPlanZoneForm projectId={id} masterPlanId={masterPlan?.id || ""} images={images} ideas={ideas} disabled={!masterPlan || !ideas.length} />
            <div className="grid" style={{ marginTop: 16 }}>
              {zones.map((zone) => (
                <div className="card" key={zone.id} style={{ boxShadow: "none" }}>
                  <h3>{zone.name}</h3>
                  <p>{zone.description}</p>
                  <p><strong>Image liee :</strong> {images.find((img) => img.id === zone.site_image_id)?.space_name || "non definie"}</p>
                  <p><strong>Idee liee :</strong> {ideas.find((idea) => idea.id === zone.idea_id)?.title || "non definie"}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>8-9. Texturage 2D + plan realiste</h2>
            <p>Le prototype genere une strategie de textures, composants et un prompt de plan realiste. La generation visuelle automatique viendra ensuite avec un modele image.</p>
            <ActionButton label="Generer plan texture" endpoint={`/api/projects/${id}/plan-render`} disabled={!zones.length} />
            {render ? (
              <div style={{ marginTop: 16 }}>
                <h3>{render.title}</h3>
                <p>{render.summary}</p>
                <pre className="json">{safeJson(render.render_json)}</pre>
              </div>
            ) : null}
          </section>

          <section className="card">
            <h2>10. Validation finale</h2>
            <p>Valide le prototype ou demande une revision. Cette etape permettra ensuite de declencher PDF, planche et rendus finaux.</p>
            <ValidationForm projectId={id} />
            {validation ? <div className="success" style={{ marginTop: 16 }}>Dernier statut : {validation.status}. Notes : {validation.notes || "Aucune"}</div> : null}
          </section>
        </div>

        <aside className="grid">
          <section className="card">
            <h2>6. Selection</h2>
            {selectedIdea ? (
              <>
                <span className="badge">Idee selectionnee</span>
                <h3 style={{ marginTop: 12 }}>{selectedIdea.title}</h3>
                <p>{selectedIdea.description}</p>
              </>
            ) : (
              <p>Choisis une idee apres generation pour poursuivre vers le plan.</p>
            )}
          </section>
          <section className="card">
            <h2>Mode IA</h2>
            <p>Si OPENAI_API_KEY est absente ou sans quota, le prototype utilise des resultats demo. Quand tu mets du budget API, les routes appellent OpenAI automatiquement.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function ListBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="card" style={{ boxShadow: "none" }}>
      <h3>{title}</h3>
      <ul className="clean">{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

function DetailLine({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return <p><strong>{label} :</strong> {items.join(", ")}</p>;
}
