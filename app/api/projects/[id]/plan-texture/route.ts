import { NextResponse } from "next/server";
import { asStringArray, parseJsonResponse } from "@/lib/ai-json";
import { buildConceptSvg, demoPlan, getOpenAIDemoReason, insertWithOptionalDemoColumns } from "@/lib/demo-ai";
import { getOpenAI, OPENAI_TEXT_MODEL } from "@/lib/openai-client";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { MasterPlanRecord, PlanPayload, PlanZoneRecord, SiteImage } from "@/lib/types";

export const runtime = "nodejs";

type PlanTexturePayload = Omit<PlanPayload, "concept_svg">;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = getSupabaseAdmin();
    const [
      { data: project, error: projectError },
      { data: analysis },
      { data: selectedIdea },
      { data: masterPlan },
      { data: siteImages },
      { data: generatedImages }
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("analyses").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("ideas").select("*").eq("project_id", projectId).eq("selected", true).maybeSingle(),
      supabase.from("master_plans").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("site_images").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
      supabase.from("generated_space_images").select("*").eq("project_id", projectId).order("created_at", { ascending: false })
    ]);

    if (projectError || !project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    if (!masterPlan) {
      const fallback = demoPlan(project, selectedIdea);
      const { data, error } = await insertWithOptionalDemoColumns(supabase, "plans", {
        project_id: projectId,
        analysis_id: analysis?.id || null,
        selected_idea_id: selectedIdea?.id || null,
        plan_json: fallback,
        concept_svg: fallback.concept_svg,
        realistic_image_prompt: fallback.realistic_image_prompt,
        is_demo: true,
        demo_reason: "Aucun plan importe: fallback schema conceptuel."
      }, "id");
      if (error) throw error;
      return NextResponse.json({ ok: true, plan_id: data.id, plan: fallback, demoMode: true });
    }

    const latestMasterPlan = masterPlan as MasterPlanRecord;
    const { data: rawZones, error: zonesError } = await supabase
      .from("plan_zones")
      .select("*")
      .eq("project_id", projectId)
      .eq("master_plan_id", latestMasterPlan.id)
      .order("created_at", { ascending: true });

    if (zonesError) {
      return NextResponse.json({
        error: "Lecture des zones du dernier plan impossible.",
        details: zonesError.message
      }, { status: 500 });
    }

    const zones = (rawZones || []) as PlanZoneRecord[];
    const zonesForPrompt = enrichZonesForPrompt(zones, (siteImages || []) as SiteImage[], generatedImages || [], selectedIdea);
    let plan: PlanPayload;
    let demoReason: string | null = null;

    try {
      const prompt = `Tu es architecte paysagiste senior specialise en jardins mediterraneens de villa.
Genere un habillage de plan masse importe zone par zone. Le plan importe est le support principal: ne le remplace pas par un schema generique.

Projet: ${JSON.stringify(project)}
Analyse: ${JSON.stringify(analysis?.analysis_json || {})}
Idee selectionnee: ${JSON.stringify(selectedIdea || {})}
Plan importe: ${JSON.stringify(latestMasterPlan)}
Zones du dernier plan, avec liens photo/idee/image/instruction: ${JSON.stringify(zonesForPrompt)}
Images generees/propositions: ${JSON.stringify(generatedImages || [])}

Retourne uniquement JSON:
{"plan_title":"","realistic_image_prompt":"","zones":[""],"zone_proposals":[{"zone_name":"","texture":"","vegetation":"","material":"","furniture":"","lighting":"","intention":"","image_prompt":""}],"materials":[""],"planting":[""],"material_legend":[""],"planting_legend":[""],"validation_notes":[""],"non_metric_warning":"Schema conceptuel, non metrique"}.

Exigences:
- exploite chaque zone fournie, ses coordonnees et ses liens;
- si une zone est liee a une photo, decris comment transformer ce qui est visible dans cette photo;
- indique texture, vegetation, materiau, mobilier, eclairage et intention pour chaque zone;
- le prompt global doit etre en francais, tres concret, exploitable par un generateur d'image realiste;
- ne donne jamais de dimensions metriques: c'est un schema conceptuel non metrique.`;

      const response = await getOpenAI().responses.create({
        model: OPENAI_TEXT_MODEL,
        input: prompt,
        text: { format: { type: "json_object" } }
      } as any);
      const parsed = parseJsonResponse<PlanTexturePayload>(response.output_text);
      plan = normalizePlan(parsed, selectedIdea?.title || "Habillage plan masse", zones, latestMasterPlan);
    } catch (openAiError) {
      demoReason = getOpenAIDemoReason(openAiError);
      if (!demoReason) throw openAiError;
      plan = demoPlan(project, selectedIdea);
      plan.concept_svg = buildZoneOverlaySvg(selectedIdea?.title || plan.plan_title, zones, latestMasterPlan);
      plan.zone_proposals = demoZoneProposals(zones);
      plan.non_metric_warning = "Schema conceptuel, non metrique";
    }

    const { data, error } = await insertWithOptionalDemoColumns(supabase, "plans", {
      project_id: projectId,
      analysis_id: analysis?.id || null,
      selected_idea_id: selectedIdea?.id || null,
      master_plan_id: latestMasterPlan.id,
      plan_json: plan,
      concept_svg: plan.concept_svg,
      realistic_image_prompt: plan.realistic_image_prompt,
      is_demo: Boolean(demoReason),
      demo_reason: demoReason
    }, "id");
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      plan_id: data.id,
      plan,
      master_plan_id: latestMasterPlan.id,
      zones_count: zones.length,
      demoMode: Boolean(demoReason),
      demoReason
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur plan texture.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function normalizePlan(parsed: PlanTexturePayload, title: string, zones: PlanZoneRecord[], masterPlan: MasterPlanRecord): PlanPayload {
  const zoneNames = zones.map((zone) => zone.name).filter(Boolean);
  const parsedZones = asStringArray(parsed.zones);

  return {
    plan_title: parsed.plan_title || title,
    concept_svg: buildZoneOverlaySvg(parsed.plan_title || title, zones, masterPlan),
    realistic_image_prompt: parsed.realistic_image_prompt || "",
    zones: parsedZones.length ? parsedZones : zoneNames,
    zone_proposals: Array.isArray(parsed.zone_proposals) && parsed.zone_proposals.length
      ? parsed.zone_proposals
      : demoZoneProposals(zones),
    materials: asStringArray(parsed.materials),
    planting: asStringArray(parsed.planting),
    material_legend: asStringArray(parsed.material_legend),
    planting_legend: asStringArray(parsed.planting_legend),
    validation_notes: asStringArray(parsed.validation_notes),
    non_metric_warning: parsed.non_metric_warning || "Schema conceptuel, non metrique"
  };
}

function buildZoneOverlaySvg(title: string, zones: PlanZoneRecord[], masterPlan?: MasterPlanRecord) {
  if (masterPlan) {
    return buildImportedPlanSvg(title, masterPlan, zones);
  }

  if (!zones.length) {
    return buildConceptSvg(title);
  }

  const colors = ["#315f43", "#256d85", "#b36b45", "#7f9a64", "#8f6f4d", "#b9a7cf"];
  const zoneRects = zones.map((zone, index) => {
    const color = colors[index % colors.length];
    return `<rect x="${zone.x}" y="${zone.y}" width="${zone.width}" height="${zone.height}" rx="1.2" fill="${color}" opacity="0.28" stroke="${color}" stroke-width="0.8"/><text x="${Number(zone.x) + 1}" y="${Number(zone.y) + 4}" font-size="2.8" fill="#17211b">${escapeXml(zone.name || `Zone ${index + 1}`)}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70" role="img" aria-label="${escapeXml(title)}">
  <rect width="100" height="70" fill="#f5f1e8"/>
  <text x="4" y="6" font-size="4" font-family="Arial" font-weight="700" fill="#214331">${escapeXml(title)}</text>
  <text x="4" y="11" font-size="2.8" font-family="Arial" fill="#8a5a00">Schema conceptuel, non metrique</text>
  <rect x="4" y="14" width="92" height="50" fill="#fffefa" stroke="#ded8cc"/>
  ${zoneRects}
</svg>`;
}

function buildImportedPlanSvg(title: string, masterPlan: MasterPlanRecord, zones: PlanZoneRecord[]) {
  const colors = ["#315f43", "#256d85", "#b36b45", "#7f9a64", "#8f6f4d", "#b9a7cf"];
  const isPdf = isPdfPlan(masterPlan);
  const background = isPdf
    ? `<rect x="4" y="14" width="92" height="50" fill="#fffefa" stroke="#ded8cc"/><text x="9" y="39" font-size="3.2" font-family="Arial" fill="#6d5948">Fond PDF importe: ouvrir le PDF sur la page projet</text>`
    : `<image href="${escapeXml(masterPlan.file_url)}" x="4" y="14" width="92" height="50" preserveAspectRatio="xMidYMid meet"/><rect x="4" y="14" width="92" height="50" fill="none" stroke="#ded8cc"/>`;

  const zoneRects = zones.map((zone, index) => {
    const color = colors[index % colors.length];
    const rect = toSvgPlanRect(zone);
    const x = rect.x;
    const y = rect.y;
    const width = rect.width;
    const height = rect.height;
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="1.2" fill="${color}" opacity="0.26" stroke="${color}" stroke-width="0.9"/><text x="${x + 1}" y="${y + 4}" font-size="2.8" font-family="Arial" font-weight="700" fill="#17211b">${escapeXml(zone.name || `Zone ${index + 1}`)}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70" role="img" aria-label="${escapeXml(title)}">
  <rect width="100" height="70" fill="#f5f1e8"/>
  <text x="4" y="6" font-size="4" font-family="Arial" font-weight="700" fill="#214331">${escapeXml(title)}</text>
  <text x="4" y="11" font-size="2.8" font-family="Arial" fill="#8a5a00">Schema conceptuel, non metrique</text>
  ${background}
  ${zoneRects}
</svg>`;
}

function enrichZonesForPrompt(zones: PlanZoneRecord[], siteImages: SiteImage[], generatedImages: any[], selectedIdea: any) {
  return zones.map((zone) => {
    const linkedPhoto = siteImages.find((image) => image.id === zone.linked_site_image_id) || null;
    const linkedGeneratedImage = generatedImages.find((image) => image.zone_id === zone.id || image.image_url === zone.linked_generated_image_url) || null;
    return {
      ...zone,
      linked_photo: linkedPhoto
        ? {
            id: linkedPhoto.id,
            title: linkedPhoto.title,
            space_name: linkedPhoto.space_name,
            public_url: linkedPhoto.public_url
          }
        : null,
      linked_selected_idea: zone.linked_idea_id || selectedIdea?.id ? selectedIdea : null,
      linked_generated_image: linkedGeneratedImage || zone.linked_generated_image_url || null
    };
  });
}

function demoZoneProposals(zones: PlanZoneRecord[]) {
  const sourceZones = zones.length ? zones : [
    { name: "Entree", texture_instruction: "pierre claire et seuil vegetal" },
    { name: "Terrasse", texture_instruction: "dallage clair, ombre et mobilier repas" },
    { name: "Jardin piscine", texture_instruction: "plage minerale claire et masses aromatiques" },
    { name: "Sortie / passage", texture_instruction: "gravier stabilise et ruban vegetal" }
  ];

  return sourceZones.map((zone) => ({
    zone_name: zone.name || "Zone",
    texture: zone.texture_instruction || "texture minerale claire",
    vegetation: "palette mediterraneenne sobre adaptee a la chaleur",
    material: "pierre claire, gravier stabilise, paillage mineral",
    furniture: "mobilier discret adapte a l'usage de la zone",
    lighting: "balisage chaud et rasant",
    intention: "renforcer la lisibilite, le confort et la coherence avec l'idee selectionnee",
    image_prompt: `Vue realiste de ${zone.name || "zone"} avec ${zone.texture_instruction || "texture mediterraneenne"}, vegetation sobre, materiaux clairs et eclairage chaud`
  }));
}

function escapeXml(value: string) {
  return String(value).replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;", "'": "&apos;" }[char] || char));
}

function isPdfPlan(masterPlan: MasterPlanRecord) {
  return masterPlan.mime_type === "application/pdf" || masterPlan.file_url.toLowerCase().includes(".pdf");
}

function clampPercent(value: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(100, numberValue));
}

function toSvgPlanRect(zone: PlanZoneRecord) {
  const x = 4 + clampPercent(zone.x) * 0.92;
  const y = 14 + clampPercent(zone.y) * 0.5;
  const maxWidth = Math.max(1, 96 - x);
  const maxHeight = Math.max(1, 64 - y);

  return {
    x: roundSvgNumber(x),
    y: roundSvgNumber(y),
    width: roundSvgNumber(Math.min(clampPercent(zone.width) * 0.92, maxWidth)),
    height: roundSvgNumber(Math.min(clampPercent(zone.height) * 0.5, maxHeight))
  };
}

function roundSvgNumber(value: number) {
  return Math.round(value * 100) / 100;
}
