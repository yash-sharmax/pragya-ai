"use client";

import React, { useRef } from "react";
import { Paperclip, Image as ImageIcon, FileText, FileCode, X, Loader2, AlertCircle } from "lucide-react";
import { safeParseResponse, formatNetworkError } from "@/lib/network";

export interface AttachmentData {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  base64?: string;
  extractedText?: string;
  isScanned?: boolean;
}

interface ImageAttachmentProps {
  attachment: AttachmentData | null;
  onAttachmentChange: (attachment: AttachmentData | null) => void;
  conversationId?: string;
  uploading: boolean;
  setUploading: (val: boolean) => void;
  onError: (msg: string) => void;
}

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf", ".txt", ".docx"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB limit

export function ImageAttachment({
  attachment,
  onAttachmentChange,
  conversationId,
  uploading,
  setUploading,
  onError,
}: ImageAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
    const isImage = file.type.startsWith("image/");
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(fileExt);

    if (!isImage && !isAllowedExt) {
      onError("Please select a supported file: JPEG, PNG, WEBP, PDF, DOCX, or TXT.");
      return;
    }

    if (file.size > MAX_SIZE) {
      onError("File size exceeds the 10 MB limit.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (conversationId) {
        formData.append("conversationId", conversationId);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const parsed = await safeParseResponse(res);
      if (!parsed.ok) {
        throw new Error(parsed.error || "Failed to upload file.");
      }

      onAttachmentChange(parsed.data);
    } catch (err: any) {
      onError(formatNetworkError(err) || "Failed to upload file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getAttachmentIcon = (mime: string, name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (mime.includes("pdf") || ext === "pdf") {
      return <FileText className="w-5 h-5 text-rose-500 shrink-0" />;
    }
    if (mime.includes("word") || ext === "docx") {
      return <FileText className="w-5 h-5 text-sky-500 shrink-0" />;
    }
    if (mime.includes("text") || ext === "txt") {
      return <FileCode className="w-5 h-5 text-emerald-500 shrink-0" />;
    }
    return <ImageIcon className="w-5 h-5 text-amber-500 shrink-0" />;
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,.pdf,.txt"
        className="hidden"
      />

      {attachment ? (
        <div className="relative inline-flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 text-xs shadow-sm">
          {attachment.mimeType.startsWith("image/") && attachment.base64 ? (
            <img
              src={`data:${attachment.mimeType};base64,${attachment.base64}`}
              alt="Preview"
              className="w-8 h-8 rounded-lg object-cover border border-amber-200 dark:border-amber-900"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-amber-100/80 dark:bg-amber-900/40 flex items-center justify-center">
              {getAttachmentIcon(attachment.mimeType, attachment.fileName)}
            </div>
          )}

          <div className="flex flex-col max-w-[150px] truncate text-left">
            <span className="font-medium text-slate-800 dark:text-amber-100 truncate">
              {attachment.fileName}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-amber-300/70">
              <span>{(attachment.fileSize / 1024).toFixed(0)} KB</span>
              {attachment.isScanned && (
                <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold" title="Scanned PDF (limited text layer)">
                  <AlertCircle className="w-2.5 h-2.5" /> Scanned
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onAttachmentChange(null)}
            type="button"
            className="p-1 rounded-full hover:bg-amber-200/60 dark:hover:bg-amber-800/60 text-slate-500 hover:text-slate-800 dark:text-amber-300 dark:hover:text-white transition-colors cursor-pointer"
            title="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach PDF, Word document (.docx), text file, or image (up to 10MB)"
          className="p-2 rounded-xl text-stone-600 dark:text-amber-200/80 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-950/60 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-amber-600 dark:text-amber-400" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>
      )}
    </div>
  );
}
