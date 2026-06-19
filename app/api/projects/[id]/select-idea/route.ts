import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const BodySchema = z.object({ idea_id: z.string().uuid() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const { idea_id: ideaId } = BodySchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    await supabase.from("ideas").update({ selected: false, status: "suggested" }).eq("project_id", projectId);
    const { data, error } = await supabase
      .from("ideas")
      .update({ selected: true, status: "selected" })
      .eq("id", ideaId)
      .eq("project_id", projectId)
      .select("*")
      .single();
    if (error) throw error;

    await supabase.from("projects").update({ selected_idea_id: ideaId, status: "idea_selected", updated_at: new Date().toISOString() }).eq("id", projectId);

    return NextResponse.json({ ok: true, idea: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur selection idee.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
