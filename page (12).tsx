import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type Params = { id: string };
const BodySchema = z.object({ idea_id: z.string().uuid() });

export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = BodySchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    await supabase.from("ideas").update({ selected: false, status: "suggested" }).eq("project_id", id);
    const { data, error } = await supabase
      .from("ideas")
      .update({ selected: true, status: "selected", updated_at: new Date().toISOString() })
      .eq("id", body.idea_id)
      .eq("project_id", id)
      .select("*")
      .single();
    if (error) throw error;

    await supabase
      .from("projects")
      .update({ selected_idea_id: body.idea_id, status: "idea_selected", updated_at: new Date().toISOString() })
      .eq("id", id);

    // Le plan et les benchmarks anciens deviennent moins pertinents après une nouvelle sélection.
    await supabase.from("plan_renders").delete().eq("project_id", id);

    return NextResponse.json({ idea: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur selection idee.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
