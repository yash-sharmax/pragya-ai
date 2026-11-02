import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "File path is required" }, { status: 400 });
  }

  // Enforce user ownership: path must start with user.id/
  if (!filePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
  }

  const { data, error } = await supabase.storage
    .from("user-uploads")
    .download(filePath);

  if (error || !data) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = filePath.split(".").pop()?.toLowerCase();
  const inferredMime =
    data.type && data.type !== "application/octet-stream"
      ? data.type
      : ext === "pdf"
      ? "application/pdf"
      : ext === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : ext === "txt"
      ? "text/plain; charset=utf-8"
      : ext === "png"
      ? "image/png"
      : ext === "webp"
      ? "image/webp"
      : "image/jpeg";

  const arrayBuffer = await data.arrayBuffer();
  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": inferredMime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
