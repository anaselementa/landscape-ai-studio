import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") || "Plan masse").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier plan manquant." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "-") || "master-plan.png";
    const path = `${projectId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage.from("master-plans").upload(path, file, {
      contentType: file.type,
      upsert: false
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from("master-plans").getPublicUrl(path);
    const { data, error } = await supabase
      .from("master_plans")
      .insert({
        project_id: projectId,
        title,
        file_url: publicData.publicUrl,
        storage_path: path,
        width: null,
        height: null,
        mime_type: file.type
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, master_plan: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur upload plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
