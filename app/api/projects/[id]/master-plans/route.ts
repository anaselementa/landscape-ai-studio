import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const MASTER_PLANS_BUCKET = "master-plans";
const MAX_PLAN_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_PLAN_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") || "Plan masse").trim();

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Fichier plan manquant." }, { status: 400 });
    }

    const mimeType = normalizeMimeType(file);
    if (!ALLOWED_PLAN_TYPES.has(mimeType)) {
      return NextResponse.json({
        error: "Format de plan non supporte.",
        details: `Type recu: ${file.type || "inconnu"}. Formats acceptes: PNG, JPG, WEBP, PDF.`
      }, { status: 400 });
    }

    if (file.size > MAX_PLAN_SIZE_BYTES) {
      return NextResponse.json({
        error: "Fichier plan trop lourd.",
        details: "La limite actuelle est de 25 Mo."
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({
        error: "Projet introuvable.",
        details: formatSupabaseError(projectError)
      }, { status: 404 });
    }

    const bucketReady = await ensureMasterPlansBucket(supabase);
    if (!bucketReady.ok) {
      return NextResponse.json({
        error: `Bucket Supabase "${MASTER_PLANS_BUCKET}" indisponible.`,
        details: bucketReady.details
      }, { status: 500 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "-") || "master-plan.png";
    const path = `${projectId}/${crypto.randomUUID()}-${safeName}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage.from(MASTER_PLANS_BUCKET).upload(path, bytes, {
      contentType: mimeType,
      upsert: false
    });
    if (uploadError) {
      return NextResponse.json({
        error: "Upload du plan impossible dans Supabase Storage.",
        details: formatSupabaseError(uploadError),
        bucket: MASTER_PLANS_BUCKET,
        storage_path: path
      }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from(MASTER_PLANS_BUCKET).getPublicUrl(path);
    if (!publicData.publicUrl) {
      return NextResponse.json({
        error: "URL publique du plan introuvable apres upload.",
        details: `Bucket: ${MASTER_PLANS_BUCKET}, chemin: ${path}`
      }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("master_plans")
      .insert({
        project_id: projectId,
        title,
        file_url: publicData.publicUrl,
        storage_path: path,
        width: null,
        height: null,
        mime_type: mimeType
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({
        error: "Plan uploade, mais insertion master_plans impossible.",
        details: formatSupabaseError(error),
        bucket: MASTER_PLANS_BUCKET,
        storage_path: path,
        public_url: publicData.publicUrl
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      master_plan: data,
      bucket: MASTER_PLANS_BUCKET,
      public_url: publicData.publicUrl
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur upload plan.";
    return NextResponse.json({ error: "Erreur upload plan.", details: message }, { status: 500 });
  }
}

async function ensureMasterPlansBucket(supabase: any): Promise<{ ok: true } | { ok: false; details: string }> {
  const { error: getError } = await supabase.storage.getBucket(MASTER_PLANS_BUCKET);
  if (!getError) {
    const { error: updateError } = await supabase.storage.updateBucket(MASTER_PLANS_BUCKET, {
      public: true,
      fileSizeLimit: String(MAX_PLAN_SIZE_BYTES),
      allowedMimeTypes: Array.from(ALLOWED_PLAN_TYPES)
    });

    if (!updateError) {
      return { ok: true };
    }

    return {
      ok: false,
      details: `Bucket trouve mais mise a jour public/limites impossible: ${formatSupabaseError(updateError)}`
    };
  }

  const { error: createError } = await supabase.storage.createBucket(MASTER_PLANS_BUCKET, {
    public: true,
    fileSizeLimit: String(MAX_PLAN_SIZE_BYTES),
    allowedMimeTypes: Array.from(ALLOWED_PLAN_TYPES)
  });

  if (!createError || String(createError.message || "").toLowerCase().includes("already exists")) {
    return { ok: true };
  }

  return {
    ok: false,
    details: `Lecture bucket: ${formatSupabaseError(getError)} | Creation bucket: ${formatSupabaseError(createError)}`
  };
}

function normalizeMimeType(file: File) {
  if (file.type) return file.type;
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
  if (lowerName.endsWith(".webp")) return "image/webp";
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function formatSupabaseError(error: unknown) {
  if (!error) return "Aucun detail fourni.";
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
