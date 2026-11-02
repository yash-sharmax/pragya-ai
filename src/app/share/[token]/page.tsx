"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SourcesList } from "@/components/SourcesList";
import { PERSONAS, PersonaId } from "@/lib/personas";
import {
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  FileText,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";

interface SharedConversationData {
  conversation: {
    id: string;
    title: string;
    persona: PersonaId;
    created_at: string;
    public_shared_at?: string;
  };
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: any[];
    created_at: string;
    response_time_ms?: number;
  }>;
  attachments: Array<{
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    message_id?: string;
  }>;
}

export default function PublicSharePage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<SharedConversationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    const fetchSharedConversation = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("This shared conversation was not found or is no longer public.");
          }
          throw new Error("Failed to load the shared conversation.");
        }
        const json = await res.json();
        if (mounted) {
          setData(json);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load shared conversation.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSharedConversation();

    return () => {
      mounted = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf6ee] dark:bg-[#0c0907] flex flex-col items-center justify-center p-4 text-stone-700 dark:text-stone-300">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo variant="icon" size="lg" />
          <div className="flex items-center gap-2 text-xs font-serif text-amber-800 dark:text-amber-300">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>Retrieving shared research archive...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#faf6ee] dark:bg-[#0c0907] flex flex-col items-center justify-center p-6 text-stone-800 dark:text-stone-200">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-[#16100c] border border-amber-300/40 dark:border-amber-900/50 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300/50 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
            Conversation Unavailable
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            {error || "This conversation is private or the link has expired."}
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md transition-all active:scale-[0.98]"
            >
              <span>Explore Pragya AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { conversation, messages, attachments } = data;
  const persona = PERSONAS[conversation.persona] || PERSONAS.veda;

  return (
    <div className="min-h-screen bg-[#faf6ee] dark:bg-[#0c0907] text-stone-900 dark:text-stone-100 font-sans flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-16 border-b border-amber-800/20 dark:border-amber-900/40 bg-[#faf6ee]/90 dark:bg-[#0c0907]/90 backdrop-blur-md px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <BrandLogo size="sm" />
          </Link>
          <div className="hidden sm:block h-5 w-[1px] bg-amber-800/20 dark:bg-amber-900/40" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-serif text-stone-700 dark:text-amber-200 truncate max-w-sm">
              {conversation.title}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-800/40 font-medium">
              {persona.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-sm transition-all active:scale-[0.98]"
          >
            <span>Start Your Own Research</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Conversation Viewer */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:px-8 space-y-6">
        {/* Conversation Title & Metadata Card */}
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-[#150f0b] border border-amber-800/20 dark:border-amber-900/40 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-serif">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Shared Archive • {persona.name} ({persona.sanskritName})</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-stone-900 dark:text-amber-50">
            {conversation.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-500 dark:text-stone-400 pt-1">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created {new Date(conversation.created_at).toLocaleDateString()}</span>
            </div>
            {conversation.public_shared_at && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Shared {new Date(conversation.public_shared_at).toLocaleDateString()}</span>
              </div>
            )}
            <div className="text-amber-700 dark:text-amber-400">
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="space-y-6">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            const msgAttachments = attachments.filter((a) => a.message_id === msg.id);

            return (
              <div
                key={msg.id}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex flex-col gap-1.5 ${
                    isUser
                      ? "items-end max-w-[85%] sm:max-w-[75%]"
                      : "items-start flex-1 max-w-full overflow-hidden"
                  }`}
                >
                  {/* Persona / User Label */}
                  <div className="flex items-center gap-1.5 px-1 text-[11px] text-stone-500 dark:text-stone-400">
                    <span className="font-semibold">
                      {isUser ? "User" : persona.name}
                    </span>
                    {!isUser && (
                      <span className="font-serif text-[10px] text-amber-700 dark:text-amber-400">
                        ({persona.sanskritName})
                      </span>
                    )}
                  </div>

                  {/* Message Bubble Container */}
                  <div
                    className={`rounded-2xl p-4 sm:p-5 text-sm leading-relaxed transition-all ${
                      isUser
                        ? "bg-amber-100 dark:bg-amber-950/70 border border-amber-300/50 dark:border-amber-800/50 text-stone-900 dark:text-amber-100 rounded-tr-none w-fit max-w-full text-left whitespace-pre-wrap"
                        : "manuscript-surface rounded-tl-none w-full border border-amber-800/20 dark:border-amber-900/40 text-stone-900 dark:text-stone-100"
                    }`}
                  >
                    {/* Render Attachments if any */}
                    {msgAttachments.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {msgAttachments.map((att) => (
                          <div
                            key={att.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-[#1a120c] border border-amber-300/40 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="font-medium truncate max-w-xs">{att.file_name}</span>
                            <span className="text-[10px] text-stone-400">
                              ({(att.file_size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Markdown Body */}
                    <div className="min-w-0 break-words leading-relaxed">
                      <MarkdownRenderer content={msg.content} />
                    </div>

                    {/* Verified Live Sources */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-amber-800/15 dark:border-amber-900/40">
                        <SourcesList sources={msg.sources} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Read-Only Footer Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-amber-100/60 dark:bg-[#18110c] border border-amber-300/60 dark:border-amber-900/40 text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo variant="mark" size="sm" />
          </div>
          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-amber-100">
            Synthesize Ancient Indian Wisdom with Modern Computational Science
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">
            Pragya AI enables persistent multilingual research dialogues across Vedic epistemology, Arthashastra statecraft, classical mathematics, and mindfulness psychology.
          </p>
          <div className="pt-1">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md transition-all active:scale-[0.98]"
            >
              <span>Create Your Free Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
