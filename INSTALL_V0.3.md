import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const ProjectSchema = z.object({
  name: z.string().min(2),
  project_type: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  style: z.string().optional().nullable(),
  constraints: z.string().optional().nullable()
});

export async function POST(request: Request) {
  try {
    const body = ProjectSchema.parse(await request.json());
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("projects")
      .insert({ ...body, status: "draft" })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ project: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur creation projet.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
