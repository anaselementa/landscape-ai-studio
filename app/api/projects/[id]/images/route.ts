import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const spaceName = String(formData.get("space_name") || "Espace non nommé");

    if (!files.length) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    const uploaded = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      const extension = file.name.split(".").pop() || "jpg";
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "-");
      const path = `${projectId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("site-images")
        .upload(path, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabaseAdmin.storage
        .from("site-images")
        .getPublicUrl(path);

      const { data, error: insertError } = await supabaseAdmin
        .from("site_images")
        .insert({
          project_id: projectId,
          title: file.name,
          space_name: spaceName,
          storage_path: path,
          public_url: publicData.publicUrl,
          mime_type: file.type,
          file_size: file.size
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      uploaded.push(data);
    }

    return NextResponse.json({ ok: true, uploaded });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur upload." }, { status: 500 });
  }
}
