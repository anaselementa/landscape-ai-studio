import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { generateJsonWithOpenAI } from "@/lib/ai";

export const runtime = "nodejs";

type Params = { id: string };

function fallbackRender(projectName: string) {
  return {
    title: `Plan texture conceptuel - ${projectName}`,
    summary: "Proposition prototype de texturage 2D et de rendu plan realiste. Les zones doivent etre traduites en textures, masses vegetales et composants paysagers.",
    zones: [
      { name: "Zone piscine", textures: ["dallage beige clair", "pelouse encadree"], vegetation: ["lavandes", "graminees", "olivier"], notes: "Valoriser les abords de piscine sans modifier fortement l'existant." },
      { name: "Jardin lateral", textures: ["pelouse centrale", "massifs lateraux"], vegetation: ["teucrium", "romarin", "stipa"], notes: "Transformer en promenade-jardin." }
    ],
    top_view_rules: [
      "Respecter les limites du plan importe",
      "Conserver les grandes structures existantes",
      "Utiliser des textures claires et sobres",
      "Placer les sujets structurants en points focaux"
    ],
    realistic_plan_prompt: "Plan masse paysager photorealiste vu de haut pour une villa a Casablanca, style mediterraneen contemporain, dalles beige clair, pelouses conservees, massifs de lavandes, romarins, teucriums, graminees, oliviers, eclairage discret, rendu professionnel propre."
  };
}

export async function POST(_request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const [{ data: project }, { data: plans }, { data: zones }, { data: ideas }, { data: images }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("master_plans").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1),
      supabase.from("plan_zones").select("*").eq("project_id", id).order("created_at", { ascending: true }),
      supabase.from("ideas").select("*").eq("project_id", id),
      supabase.from("site_images").select("*").eq("project_id", id)
    ]);
    if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    if (!zones?.length) return NextResponse.json({ error: "Ajoute au moins une zone sur le plan." }, { status: 400 });

    const fallback = fallbackRender(project.name);
    const { data, usedDemo, error } = await generateJsonWithOpenAI({
      system: "Tu es un architecte de paysage et graphiste de plans masse. Tu traduis des idees et photos en regles de texturage 2D et en prompt de plan realiste. Retourne uniquement JSON.",
      user: `Projet: ${project.name}, ${project.location}, style ${project.style}, contraintes: ${project.constraints}. Plan: ${JSON.stringify(plans?.[0] || {})}. Zones: ${JSON.stringify(zones)}. Idees: ${JSON.stringify(ideas)}. Images: ${JSON.stringify(images?.map((img: any) => ({id: img.id, space_name: img.space_name, title: img.title})))}. Retourne JSON {title,summary,zones:[{name,textures[],vegetation[],hardscape[],furniture[],lighting[],notes}],top_view_rules[],realistic_plan_prompt}.`,
      fallback
    });

    const render: any = data;
    await supabase.from("plan_renders").delete().eq("project_id", id);
    const { data: inserted, error: insertError } = await supabase
      .from("plan_renders")
      .insert({
        project_id: id,
        master_plan_id: plans?.[0]?.id || null,
        render_type: "2d_texture_and_realistic_prompt",
        title: render.title || fallback.title,
        summary: render.summary || fallback.summary,
        render_json: { ...render, used_demo: usedDemo, openai_error: error || null },
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
