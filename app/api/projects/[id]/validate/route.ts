import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type Params = { id: string };
const BodySchema = z.object({
  status: z.enum(["approved", "revision_requested"]),
  notes: z.string().optional().nullable()
});

export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const body = BodySchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("validations")
      .insert({ project_id: id, status: body.status, notes: body.notes || null })
      .select("*")
      .single();
    if (error) throw error;

    await supabase.from("projects").update({ status: body.status === "approved" ? "validated" : "revision_requested", updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ validation: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur validation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
