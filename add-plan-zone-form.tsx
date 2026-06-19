import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { buildConceptPlanSvg, generateJsonWithOpenAI } from "@/lib/ai";

export const runtime = "nodejs";

type Params = { id: string };

function fallbackRender(projectName: string, selectedIdea?: any, zones?: any[]) {
  const materials = selectedIdea?.materials || ["pierre claire", "gravier stabilisé", "bois naturel", "paillage minéral"];
  const plants = selectedIdea?.plants || ["olivier", "romarin", "lavande", "stipa", "myrte"];
  const zoneNames = zones?.length ? zones.map((z: any) => z.name) : selectedIdea?.target_spaces || ["Terrasse principale ombragée", "Cheminement minéral", "Massifs méditerranéens", "Piscine / détente", "Entrée valorisée"];
  const svg = buildConceptPlanSvg({ projectName, selectedIdeaTitle: selectedIdea?.title, zoneNames, palette: { materials, plants } });
  return {
    title: `Plan texturé conceptuel - ${projectName}`,
    summary: selectedIdea
      ? `Traduction visuelle simple de l'idée sélectionnée : ${selectedIdea.title}.`
      : "Traduction visuelle simple des idées générées en trame de plan masse.",
    zones: zoneNames.map((name: string, index: number) => ({
      name,
      textures: index % 2 === 0 ? ["pierre claire", "gravier stabilisé"] : ["pelouse conservée", "paillage minéral"],
      vegetation: plants.slice(0, 4),
      hardscape: materials.slice(0, 3),
      furniture: selectedIdea?.furniture || ["assises ponctuelles"],
      lighting: selectedIdea?.lighting || ["balises basses", "spots chauds"],
      notes: "Zone à adapter précisément sur le plan masse existant."
    })),
    top_view_rules: [
      "conserver les masses existantes lisibles",
      "placer les matériaux clairs sur les circulations et terrasses",
      "regrouper les plantations méditerranéennes en masses plutôt qu'en sujets isolés",
      "hiérarchiser entrée, terrasse, piscine et passages"
    ],
    materials,
    plants,
    realistic_plan_prompt: `Créer un plan masse paysager réaliste en vue de dessus pour ${projectName}, style méditerranéen contemporain à Casablanca, en appliquant l'idée ${selectedIdea?.title || "retenue"}. Montrer des dalles claires, graviers stabilisés, massifs de lavande/romarin/stipa, oliviers, pelouse conservée, zone terrasse ombragée, circulation lisible, éclairage chaud et rendu professionnel de concours.` ,
    image_generation_prompt: `Photorealistic top-down landscape masterplan, Mediterranean contemporary villa garden in Casablanca, selected concept: ${selectedIdea?.title || "Mediterranean contemporary renovation"}, beige stone paving, warm gravel, olive trees, lavender, rosemary, ornamental grasses, preserved lawn, pool terrace, clean architectural layout, professional landscape architecture presentation.`,
    svg_markup: svg
  };
}

export async function POST(_request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project }, { data: plans }, { data: zones }, { data: ideas }, { data: images }, { data: refs }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("master_plans").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("plan_zones").select("*").eq("project_id", id).order("created_at", { ascending: true }),
      supabase.from("ideas").select("*").eq("project_id", id).order("selected", { ascending: false }),
      supabase.from("site_images").select("*").eq("project_id", id),
      supabase.from("project_references").select("*").eq("project_id", id)
    ]);
    if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    const selectedIdea = (ideas || []).find((idea: any) => idea.selected || idea.status === "selected") || ideas?.[0] || null;
    if (!selectedIdea && !zones?.length) return NextResponse.json({ error: "Génère et sélectionne au moins une idée avant le plan texturé." }, { status: 400 });

    const fallback = fallbackRender(project.name, selectedIdea, zones || []);
    const { data, usedDemo, error } = await generateJsonWithOpenAI({
      system: "Tu es un architecte de paysage et graphiste de plans masse. Tu traduis une idée sélectionnée en règles de texturage 2D, zones et prompt de rendu réaliste. JSON strict uniquement.",
      user: `
Projet : ${project.name}
Localisation : ${project.location}
Style : ${project.style}
Contraintes : ${project.constraints}
Plan importé : ${JSON.stringify(plans?.[0] || {})}
Zones saisies par l'utilisateur : ${JSON.stringify(zones || [])}
Idée sélectionnée : ${JSON.stringify(selectedIdea || {})}
Toutes les idées : ${JSON.stringify(ideas || [])}
Références : ${JSON.stringify(refs || [])}
Images : ${JSON.stringify(images?.map((img: any) => ({ id: img.id, space_name: img.space_name, title: img.title })))}

Retourne uniquement :
{
  "title": "titre du plan",
  "summary": "stratégie de composition en 4-6 lignes",
  "zones": [{"name":"nom", "textures":[], "vegetation":[], "hardscape":[], "furniture":[], "lighting":[], "notes":""}],
  "top_view_rules": ["règles de plan vu de dessus"],
  "materials": ["matériaux principaux"],
  "plants": ["végétaux principaux"],
  "realistic_plan_prompt": "prompt français prêt à envoyer à un générateur d'image",
  "image_generation_prompt": "prompt anglais photoréaliste top-view prêt pour génération d'image"
}

Contraintes :
- Le plan doit s'adapter à l'idée sélectionnée, pas mélanger toutes les idées.
- Si aucune zone n'est dessinée, propose des zones conceptuelles d'après les photos et espaces nommés.
- Ne prétends pas produire un plan CAD exact. C'est un plan conceptuel texturé.
`,
      fallback
    });

    const render: any = data;
    const materials = render.materials || selectedIdea?.materials || fallback.materials;
    const plants = render.plants || selectedIdea?.plants || fallback.plants;
    const zoneNames = (render.zones || fallback.zones || []).map((zone: any) => zone.name).filter(Boolean);
    const svg = buildConceptPlanSvg({ projectName: project.name, selectedIdeaTitle: selectedIdea?.title, zoneNames, palette: { materials, plants } });
    const finalRender = { ...fallback, ...render, materials, plants, svg_markup: svg, used_demo: usedDemo, openai_error: error || null, selected_idea_id: selectedIdea?.id || null };

    await supabase.from("plan_renders").delete().eq("project_id", id);
    const { data: inserted, error: insertError } = await supabase
      .from("plan_renders")
      .insert({
        project_id: id,
        master_plan_id: plans?.[0]?.id || null,
        selected_idea_id: selectedIdea?.id || null,
        render_type: "visual_2d_texture_and_realistic_prompt",
        title: finalRender.title,
        summary: finalRender.summary,
        render_json: finalRender,
        svg_markup: svg,
        status: "ready"
      })
      .select("*")
      .single();
    if (insertError) throw insertError;

    await supabase.from("projects").update({ status: "plan_render_ready", updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ render: inserted, usedDemo, openaiError: error || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur plan texture.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
