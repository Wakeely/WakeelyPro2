import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, can } from "@/lib/auth/permissions";

// This REPLACES the old prototype's fake upload (which only stored a
// filename + a randomly generated fileSize string). This route receives the
// actual file bytes, streams them into Supabase Storage under the bucket
// created in supabase/migrations/0002_storage.sql, and only then writes the
// metadata row. If the matter isn't accessible to this user, both the
// storage write AND the table insert are rejected by RLS even if this route
// had a bug — that's the point of layering RLS under the app code.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!can.uploadDocument(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const matterId = formData.get("matterId") as string | null;
  const category = (formData.get("category") as string | null) ?? "General";
  const visibleToClient = formData.get("visibleToClient") === "true";

  if (!file || !matterId) {
    return NextResponse.json({ error: "file and matterId are required" }, { status: 400 });
  }

  // Basic guardrails — extend as needed (virus scanning, stricter MIME allow-list, etc.)
  const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 25MB limit" }, { status: 413 });
  }

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${matterId}/${crypto.randomUUID()}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      matter_id: matterId,
      name: file.name,
      category,
      storage_path: storagePath,
      file_size_bytes: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
      visible_to_client: visibleToClient,
    })
    .select()
    .single();

  if (insertError) {
    // Roll back the orphaned storage object if the metadata insert failed.
    await supabase.storage.from("documents").remove([storagePath]);
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json(doc, { status: 201 });
}

// Generates a short-lived signed URL for downloading/previewing a document.
// The client never gets a permanent public link — only a URL that expires.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const documentId = req.nextUrl.searchParams.get("documentId");
  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from("documents")
    .select("storage_path, visible_to_client, matter_id")
    .eq("id", documentId)
    .single();

  // RLS already prevents fetching a document the user can't see; `error`
  // covers both "not found" and "not permitted" without distinguishing them
  // to the caller — that's intentional, don't leak existence of matters.
  if (error || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 60 * 5); // 5 minutes

  if (signError || !signed) {
    return NextResponse.json({ error: "Could not generate download link" }, { status: 500 });
  }

  void user; // reserved for audit_log write — see migration plan step 8
  return NextResponse.json({ url: signed.signedUrl });
}
