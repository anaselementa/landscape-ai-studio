import { NextResponse } from "next/server";
import { asStringArray, parseJsonResponse } from "@/lib/ai-json";
import { buildConceptSvg, demoPlan, getOpenAIDemoReason, insertWithOptionalDemoColumns } from "@/lib/demo-ai";
import { getOpenAI, OPENAI_TEXT_MODEL } from "@/lib/openai-client";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { PlanPayload } from "@/lib/types";

export const runtime = "nodejs";

type PlanTexturePayload = Omit<PlanPayload, "concept_svg">;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project, error: projectError }, { data: analysis }, { data: selectedIdea }, { data: masterPlan }, { data: zones }, { data: generatedImages }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("analyses").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("ideas").select("*").eq("project_id", projectId).eq("selected", true).maybeSingle(),
      supabase.from("master_plans").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("plan_zones").select("*").eq("project_id", projectId).order("created_at", { ascending: true }),
      supabase.from("generated_space_images").select("*").eq("project_id", projectId).order("created_at", { ascending: false })
    ]);

    if (projectError || !project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

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

    let plan: PlanPayload;
    let demoReason: string | null = null;

    try {
      const prompt = `Tu es architecte paysagiste. Genere un habillage de plan masse importe zone par zone.
Projet: ${JSON.stringify(project)}
Analyse: ${JSON.stringify(analysis?.analysis_json || {})}
Idee selectionnee: ${JSON.stringify(selectedIdea || {})}
Plan importe: ${JSON.stringify(masterPlan)}
Zones: ${JSON.stringify(zones || [])}
Images generees/propositions: ${JSON.stringify(generatedImages || [])}

Retourne uniquement JSON:
{"plan_title":"","realistic_image_prompt":"","zones":[""],"zone_proposals":[{"zone_name":"","texture":"","vegetation":"","material":"","furniture":"","lighting":"","intention":"","image_prompt":""}],"materials":[""],"planting":[""],"material_legend":[""],"planting_legend":[""],"validation_notes":[""],"non_metric_warning":"Schéma conceptuel, non métrique"}.

Le prompt global et les prompts par zone doivent etre en francais, concrets, exploitables par un generateur d'image, et respecter les zones importees.`;

      const response = await getOpenAI().responses.create({
        model: OPENAI_TEXT_MODEL,
        input: prompt,
        text: { format: { type: "json_object" } }
      } as any);
      const parsed = parseJsonResponse<PlanTexturePayload>(response.output_text);
      plan = normalizePlan(parsed, selectedIdea?.title || "Habillage plan masse", zones || []);
    } catch (openAiError) {
      demoReason = getOpenAIDemoReason(openAiError);
      if (!demoReason) throw openAiError;
      plan = demoPlan(project, selectedIdea);
      plan.concept_svg = buildZoneOverlaySvg(selectedIdea?.title || plan.plan_title, zones || []);
      plan.zone_proposals = demoZoneProposals(zones || []);
    }

    const { data, error } = await insertWithOptionalDemoColumns(supabase, "plans", {
      project_id: projectId,
      analysis_id: analysis?.id || null,
      selected_idea_id: selectedIdea?.id || null,
      master_plan_id: masterPlan.id,
      plan_json: plan,
      concept_svg: plan.concept_svg,
      realistic_image_prompt: plan.realistic_image_prompt,
      is_demo: Boolean(demoReason),
      demo_reason: demoReason
    }, "id");
    if (error) throw error;
    return NextResponse.json({ ok: true, plan_id: data.id, plan, demoMode: Boolean(demoReason), demoReason });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur plan texture.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function normalizePlan(parsed: PlanTexturePayload, title: string, zones: any[]): PlanPayload {
  return {
    plan_title: parsed.plan_title || title,
    concept_svg: buildZoneOverlaySvg(parsed.plan_title || title, zones),
    realistic_image_prompt: parsed.realistic_image_prompt || "",
    zones: asStringArray(parsed.zones),
    zone_proposals: Array.isArray(parsed.zone_proposals) ? parsed.zone_proposals : [],
    materials: asStringArray(parsed.materials),
    planting: asStringArray(parsed.planting),
    material_legend: asStringArray(parsed.material_legend),
    planting_legend: asStringArray(parsed.planting_legend),
    validation_notes: asStringArray(parsed.validation_notes),
    non_metric_warning: parsed.non_metric_warning || "Schéma conceptuel, non métrique"
  };
}

function buildZoneOverlaySvg(title: string, zones: any[]) {
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
  <text x="4" y="11" font-size="2.8" font-family="Arial" fill="#8a5a00">Schéma conceptuel, non métrique</text>
  <rect x="4" y="14" width="92" height="50" fill="#fffefa" stroke="#ded8cc"/>
  ${zoneRects}
</svg>`;
}

function demoZoneProposals(zones: any[]) {
  return zones.map((zone) => ({
    zone_name: zone.name || "Zone",
    texture: zone.texture_instruction || "texture minerale claire",
    vegetation: "palette mediterraneenne sobre",
    material: "pierre claire, gravier stabilise, paillage mineral",
    furniture: "mobilier discret adapte a l'usage",
    lighting: "balisage chaud et rasant",
    intention: "renforcer la lisibilite et le confort de la zone",
    image_prompt: `Vue realiste de ${zone.name || "zone"} avec ${zone.texture_instruction || "texture mediterraneenne"}`
  }));
}

function escapeXml(value: string) {
  return String(value).replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;", "'": "&apos;" }[char] || char));
}
