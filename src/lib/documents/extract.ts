import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export interface DocumentExtractResult {
  text: string;
  isScanned?: boolean;
  pageCount?: number;
  wordCount: number;
}

/**
 * Extracts plain text from an uploaded document buffer (PDF, DOCX, TXT).
 * Gracefully handles corrupted files, scanned documents, and password-protected files.
 */
export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<DocumentExtractResult> {
  const mime = (mimeType || "").toLowerCase();
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  // 1. Plain Text files (.txt, .md, .csv)
  if (mime.includes("text/plain") || ext === "txt" || ext === "md" || ext === "csv") {
    const text = buffer.toString("utf-8");
    return {
      text,
      wordCount: text.trim().split(/\s+/).filter(Boolean).length,
    };
  }

  // 2. Microsoft Word Document (.docx)
  if (
    mime.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
    mime.includes("application/docx") ||
    ext === "docx"
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const rawText = result.value || "";
      const cleanedText = rawText.replace(/\r\n/g, "\n").trim();
      return {
        text: cleanedText,
        wordCount: cleanedText.split(/\s+/).filter(Boolean).length,
      };
    } catch (err: any) {
      console.warn(`DOCX extraction failed for ${fileName}:`, err.message);
      throw new Error(`Failed to read Word document (.docx): ${err.message || "File might be corrupted."}`);
    }
  }

  // 3. Adobe PDF Document (.pdf)
  if (mime.includes("application/pdf") || ext === "pdf") {
    try {
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const textResult = await parser.getText();
      await parser.destroy().catch(() => {});

      let extracted = "";
      if (typeof textResult === "string") {
        extracted = textResult;
      } else if (textResult && typeof textResult.text === "string") {
        extracted = textResult.text;
      }

      const cleanedText = extracted.replace(/\r\n/g, "\n").trim();
      const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

      // Scanned PDF detection: if document has negligible text (< 20 characters), it's likely scanned/image-only
      const isScanned = cleanedText.length < 20;

      return {
        text: isScanned
          ? "[Notice: This PDF appears to be a scanned document or contains only images without an embedded text layer. Pragya AI can only analyze textual content from this file.]"
          : cleanedText,
        isScanned,
        wordCount,
      };
    } catch (err: any) {
      console.warn(`PDF extraction failed for ${fileName}:`, err.message);
      if (err.message && (err.message.includes("Password") || err.name === "PasswordException")) {
        throw new Error("Password-protected PDFs cannot be opened. Please provide an unencrypted document.");
      }
      throw new Error(`Failed to parse PDF document: ${err.message || "File might be corrupted or malformed."}`);
    }
  }

  // Unsupported document type fallback
  return {
    text: "",
    wordCount: 0,
  };
}
