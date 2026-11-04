import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractDocumentText } from "@/lib/documents/extract";
import { checkRateLimit } from "@/lib/rate-limit";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/docx",
];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "pdf", "txt", "docx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: at most 10 uploads per minute per user.
  if (!checkRateLimit(`upload:${user.id}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait a few seconds and try again." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const conversationId = (formData.get("conversationId") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";

    // Validate MIME type and file extension
    const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type);
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(fileExt);

    if (!isAllowedMime && !isAllowedExt) {
      return NextResponse.json(
        {
          error:
            "Unsupported file format. Please upload an image (JPEG, PNG, WEBP), PDF (.pdf), Word document (.docx), or plain text (.txt).",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10 MB maximum size limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    const effectiveMimeType =
      file.type && file.type !== "application/octet-stream"
        ? file.type
        : fileExt === "pdf"
        ? "application/pdf"
        : fileExt === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : fileExt === "txt"
        ? "text/plain"
        : "application/octet-stream";

    let extractedText = "";
    let isScanned = false;

    // If it is a document (PDF, DOCX, TXT), extract textual content on the server
    const isDocument =
      effectiveMimeType.includes("pdf") ||
      effectiveMimeType.includes("word") ||
      effectiveMimeType.includes("document") ||
      effectiveMimeType.includes("text/plain") ||
      ["pdf", "docx", "txt"].includes(fileExt);

    if (isDocument) {
      try {
        const extracted = await extractDocumentText(buffer, effectiveMimeType, file.name);
        extractedText = extracted.text;
        isScanned = Boolean(extracted.isScanned);
      } catch (extractErr: any) {
        console.warn(`Text extraction warning for ${file.name}:`, extractErr.message);
        return NextResponse.json(
          { error: extractErr.message || "Failed to process document content." },
          { status: 400 }
        );
      }
    }

    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${user.id}/${conversationId}/${Date.now()}_${sanitizedFileName}`;

    // Upload to private Supabase Storage bucket 'user-uploads'
    const { error: uploadError } = await supabase.storage
      .from("user-uploads")
      .upload(filePath, buffer, {
        contentType: effectiveMimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      fileName: file.name,
      filePath,
      fileSize: file.size,
      mimeType: effectiveMimeType,
      base64: effectiveMimeType.startsWith("image/") ? base64 : undefined,
      extractedText: extractedText || undefined,
      isScanned,
    });
  } catch (err: any) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process upload." },
      { status: 500 }
    );
  }
}
