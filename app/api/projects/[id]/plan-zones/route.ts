import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const ZoneSchema = z.object({
  master_plan_id: z.string().uuid(),
  name: z.string().min(1),
  zone_type: z.string().optional().nullable(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  polygon: z.unknown().optional().nullable(),
  linked_site_image_id: z.string().uuid().optional().nullable(),
  linked_idea_id: z.string().uuid().optional().nullable(),
  linked_generated_image_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  texture_instruction: z.string().optional().nullable()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const body = ZoneSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("plan_zones")
      .insert({
        project_id: projectId,
        master_plan_id: body.master_plan_id,
        name: body.name,
        zone_type: body.zone_type || null,
        x: body.x,
        y: body.y,
        width: body.width,
        height: body.height,
        polygon: body.polygon || null,
        linked_site_image_id: body.linked_site_image_id || null,
        linked_idea_id: body.linked_idea_id || null,
        linked_generated_image_url: body.linked_generated_image_url || null,
        notes: body.notes || null,
        texture_instruction: body.texture_instruction || null
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, zone: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur zone.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
