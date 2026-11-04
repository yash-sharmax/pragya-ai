"use client";

import React, { useState, useEffect } from "react";
import { PersonaId, PERSONAS } from "@/lib/personas";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { SourcesList } from "./SourcesList";
import { SourceItem } from "@/lib/sources/search";
import {
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  User,
  Clock,
  Globe,
  Search,
  FileText,
  FileCode,
  Download,
  Scroll,
} from "lucide-react";

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "pending" | "completed" | "failed";
  statusText?: string;
  isStreaming?: boolean;
  error_message?: string;
  sources?: SourceItem[];
  response_time_ms?: number;
  attachments?: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
  }>;
}

interface MessageBubbleProps {
  message: MessageItem;
  personaId: PersonaId;
  onRetry?: (messageId: string) => void;
}

export function MessageBubble({ message, personaId, onRetry }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const persona = PERSONAS[personaId] || PERSONAS.veda;
  const isUser = message.role === "user";
  const isPending = message.status === "pending";
  const isFailed = message.status === "failed";
  const isStreaming = Boolean(message.isStreaming);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderAttachment = (att: {
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
  }) => {
    const isImage = att.mime_type.startsWith("image/");
    const ext = att.file_name.split(".").pop()?.toLowerCase() || "";
    const isPdf = att.mime_type.includes("pdf") || ext === "pdf";
    const isDocx = att.mime_type.includes("word") || ext === "docx";
    const isTxt = att.mime_type.includes("text") || ext === "txt";

    if (isImage) {
      return (
        <div
          key={att.id}
          className="rounded-xl overflow-hidden border border-amber-800/30 dark:border-amber-700/40 shadow-sm max-w-xs bg-amber-50/50 dark:bg-stone-900"
        >
          <img
            src={`/api/upload/view?path=${encodeURIComponent(att.file_path)}`}
            alt={att.file_name}
            className="max-h-60 w-auto object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <div className="p-2 bg-amber-100/60 dark:bg-stone-850 text-[11px] text-stone-700 dark:text-stone-300 truncate flex items-center justify-between gap-1">
            <span className="truncate">{att.file_name}</span>
            <a
              href={`/api/upload/view?path=${encodeURIComponent(att.file_path)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 dark:text-amber-400 hover:underline shrink-0"
              title="Open full image"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      );
    }

    // Document Preview Card (PDF, DOCX, TXT)
    return (
      <a
        key={att.id}
        href={`/api/upload/view?path=${encodeURIComponent(att.file_path)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-xl border border-amber-800/30 dark:border-amber-700/40 bg-amber-50/70 dark:bg-[#1a140f] hover:bg-amber-100/70 dark:hover:bg-[#241c15] text-left shadow-sm max-w-sm transition-all group"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-200/60 dark:bg-amber-950/60 border border-amber-300/40 dark:border-amber-800/60">
          {isPdf ? (
            <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          ) : isDocx ? (
            <FileText className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          ) : isTxt ? (
            <FileCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-semibold text-xs text-stone-900 dark:text-amber-100 truncate group-hover:text-amber-800 dark:group-hover:text-amber-300">
            {att.file_name}
          </span>
          <span className="text-[10px] text-stone-500 dark:text-stone-400">
            {isPdf ? "PDF Document" : isDocx ? "Word Document" : "Text Document"} •{" "}
            {(att.file_size / 1024).toFixed(0)} KB
          </span>
        </div>
        <Download className="w-4 h-4 text-stone-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 shrink-0" />
      </a>
    );
  };

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"} my-3 sm:my-4`}>
      <div
        className={`flex gap-2.5 sm:gap-3 max-w-3xl w-full ${
          isUser ? "flex-row-reverse justify-start" : "flex-row justify-start"
        }`}
      >
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isUser
              ? "bg-[#2a2119] text-amber-400 dark:bg-amber-700 dark:text-white border border-amber-900/40"
              : `bg-gradient-to-tr ${persona.color.primary} text-white shadow-md shadow-amber-500/10`
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
        </div>

        {/* Message Content Container */}
        <div
          className={`flex flex-col min-w-0 ${
            isUser
              ? "items-end max-w-[85%] sm:max-w-[75%]"
              : "items-start flex-1 max-w-full overflow-hidden"
          }`}
        >
          {/* Header line for Assistant */}
          {!isUser && (
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <span className="font-semibold text-xs text-stone-900 dark:text-amber-100">
                {persona.name}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${persona.color.badge}`}>
                {persona.sanskritName}
              </span>
              {message.response_time_ms && !isPending && (
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 font-normal ml-1">
                  <Clock className="w-3 h-3" />
                  <span>{(message.response_time_ms / 1000).toFixed(1)}s</span>
                </span>
              )}
            </div>
          )}

          {/* User Attachments Preview (Images, PDFs, Word, Text) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={`mb-2.5 flex flex-col gap-2 ${isUser ? "items-end" : "items-start"} w-full`}>
              {message.attachments.map((att) => renderAttachment(att))}
            </div>
          )}

          {/* Text Bubble (Ancient Manuscript for Assistant, Manuscript Bubble for User) */}
          <div
            className={`transition-all break-words ${
              isUser
                ? "p-3.5 sm:p-4 rounded-2xl rounded-tr-none text-sm w-fit max-w-full manuscript-user-bubble text-left selection:bg-amber-500/40"
                : "p-4 sm:p-5 rounded-2xl rounded-tl-none text-sm w-full manuscript-surface min-w-0 text-stone-900 dark:text-[#f3ede2]"
            }`}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
            ) : isPending && !message.content ? (
              <ThinkingIndicator
                personaName={persona.name}
                statusText={message.statusText}
              />
            ) : isFailed ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold text-xs">Response generation failed</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {message.error_message || "The AI provider was unable to generate a response."}
                </p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={() => onRetry(message.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-sm cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Question</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="min-w-0 overflow-hidden relative">
                {/* Ancient Folio Decorative Marginal Accent */}
                <div className="hidden sm:block absolute top-0 right-0 pt-0.5 text-[10px] leading-relaxed text-amber-800/40 dark:text-amber-500/40 font-serif select-none pointer-events-none">
                  ॥ {persona.sanskritName} ॥
                </div>

                <div className="sm:pt-4">
                  <MarkdownRenderer content={message.content} />
                </div>

                {/* Animated Traditional Indian Kalam Writing Instrument */}
                {isStreaming && (
                  <span className="inline-block align-middle ml-1">
                    <TraditionalKalamIcon />
                  </span>
                )}

                <SourcesList sources={message.sources} />
              </div>
            )}
          </div>

          {/* Actions line */}
          {!isUser && !isPending && !isFailed && message.content && (
            <div className="mt-1.5 px-1 flex items-center justify-start gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-amber-200 transition-colors p-1 rounded hover:bg-amber-100/60 dark:hover:bg-stone-800 cursor-pointer"
                title="Copy entire response"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Response</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Traditional Indian Kalam (Reed Stylus / Nib) SVG Writing Instrument
 */
function TraditionalKalamIcon() {
  return (
    <span
      className="inline-flex items-center align-middle ml-1.5 select-none pointer-events-none"
      title="Writing on manuscript..."
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5 text-amber-800 dark:text-amber-400 animate-kalam-write drop-shadow-sm"
        fill="currentColor"
      >
        {/* Reed pen shaft */}
        <path
          d="M19.5 2.5a2.121 2.121 0 0 1 3 3L8.5 19.5l-6 2 2-6L18.5 2.5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Brass ferrule band */}
        <line x1="14.5" y1="6.5" x2="17.5" y2="9.5" stroke="#b45309" strokeWidth="1.5" />
        {/* Ink slit */}
        <path d="M4.5 19.5l3-3" stroke="currentColor" strokeWidth="1.2" />
        {/* Ink tip dot */}
        <circle cx="2.5" cy="21.5" r="1.3" fill="#78350f" className="dark:fill-amber-300 animate-pulse" />
      </svg>
    </span>
  );
}

function ThinkingIndicator({
  personaName,
  statusText,
}: {
  personaName: string;
  statusText?: string;
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setSeconds(elapsed);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return null;
    const lower = status.toLowerCase();
    if (lower.includes("search")) {
      return <Search className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 animate-pulse" />;
    }
    if (lower.includes("reading") || lower.includes("source")) {
      return <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />;
    }
    if (lower.includes("document") || lower.includes("attachment")) {
      return <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-pulse" />;
    }
    return <Scroll className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 animate-pulse" />;
  };

  const currentStatus = statusText || "Thinking...";

  return (
    <div className="flex items-center gap-3 py-1.5">
      {/* Ancient Manuscript Ink Shimmer Pulse */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-2 h-2 rounded-full bg-amber-700 dark:bg-amber-400 animate-ink-shimmer" />
        <span className="w-2 h-2 rounded-full bg-amber-700 dark:bg-amber-400 animate-ink-shimmer delay-150" />
        <span className="w-2 h-2 rounded-full bg-amber-700 dark:bg-amber-400 animate-ink-shimmer delay-300" />
      </div>

      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-800 dark:text-amber-200 transition-all">
        {getStatusIcon(currentStatus)}
        <span>{currentStatus}</span>
        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
          ({formatTimer(seconds)})
        </span>
      </div>

      <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal hidden sm:inline">
        • {personaName}
      </span>
    </div>
  );
}
