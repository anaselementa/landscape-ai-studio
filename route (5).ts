import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type Params = { id: string };

export async function POST(request: Request, { params }: { params: Promise<Params> }) {
  try {
    const { id: projectId } = await params;
    const formData = await request.formData();
    const files = formData.getAll("files").filter((item): item is File => item instanceof File);
    const spaceName = String(formData.get("space_name") || "Espace non nomme").trim();

    if (!files.length) return NextResponse.json({ error: "Aucun fichier recu." }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const uploaded = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "-");
      const path = `${projectId}/photos/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage.from("site-images").upload(path, file, {
        contentType: file.type,
        upsert: false
      });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("site-images").getPublicUrl(path);
      const { data, error: insertError } = await supabase
        .from("site_images")
        .insert({
          project_id: projectId,
          title: file.name,
          space_name: spaceName || "Espace non nomme",
          storage_path: path,
          public_url: publicData.publicUrl,
          image_url: publicData.publicUrl,
          mime_type: file.type,
          file_size: file.size,
          size_bytes: file.size
        })
        .select("*")
        .single();
      if (insertError) throw insertError;
      uploaded.push(data);
    }

    await supabase.from("projects").update({ status: "photos_uploaded", updated_at: new Date().toISOString() }).eq("id", projectId);
    return NextResponse.json({ ok: true, uploaded });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur upload.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
