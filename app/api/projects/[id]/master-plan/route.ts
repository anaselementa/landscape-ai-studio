import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type Params = { id: string };

export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") || "Plan masse").trim();
    if (!(file instanceof File)) return NextResponse.json({ error: "Aucun plan recu." }, { status: 400 });

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "-");
    const path = `${id}/master-plans/${crypto.randomUUID()}-${safeName}`;
    const supabase = getSupabaseAdmin();

    const { error: uploadError } = await supabase.storage.from("site-images").upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from("site-images").getPublicUrl(path);
    await supabase.from("master_plans").delete().eq("project_id", id);
    const { data, error } = await supabase
      .from("master_plans")
      .insert({
        project_id: id,
        title,
        file_name: file.name,
        storage_path: path,
        public_url: publicData.publicUrl,
        mime_type: file.type,
        file_size: file.size
      })
      .select("*")
      .single();
    if (error) throw error;

    await supabase.from("projects").update({ status: "master_plan_uploaded", updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ masterPlan: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur import plan.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
