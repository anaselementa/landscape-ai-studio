import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type Params = { id: string };
const BodySchema = z.object({
  master_plan_id: z.string().optional().nullable(),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  site_image_id: z.string().optional().nullable(),
  idea_id: z.string().optional().nullable()
});

function normalizeUuid(value?: string | null) {
  return value && value.length > 5 ? value : null;
}

export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = BodySchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("plan_zones")
      .insert({
        project_id: id,
        master_plan_id: normalizeUuid(body.master_plan_id),
        name: body.name,
        description: body.description,
        site_image_id: normalizeUuid(body.site_image_id),
        idea_id: normalizeUuid(body.idea_id),
        status: "mapped"
      })
      .select("*")
      .single();
    if (error) throw error;

    await supabase.from("projects").update({ status: "plan_zones_mapped", updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ zone: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur creation zone.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
