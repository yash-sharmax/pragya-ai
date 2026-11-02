"use client";

import React, { useState, useEffect } from "react";
import { Search, X, MessageSquare, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { safeParseResponse } from "@/lib/network";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
}

export function SearchModal({ open, onClose, onSelectConversation }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setConversations([]);
      setMessages([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const parsed = await safeParseResponse(res);
        if (parsed.ok && parsed.data) {
          setConversations(parsed.data.conversations || []);
          setMessages(parsed.data.messages || []);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-10 animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search previous chats, topics, or Sanskrit keywords..."
            autoFocus
            className="flex-1 bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />
          {loading && <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="mt-3 max-h-80 overflow-y-auto space-y-3">
          {conversations.length === 0 && messages.length === 0 && query.trim() && !loading && (
            <div className="text-center py-8 text-xs text-slate-400">
              No matching conversations or messages found for &ldquo;{query}&rdquo;.
            </div>
          )}

          {!query.trim() && (
            <div className="text-center py-6 text-xs text-slate-400 flex flex-col items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Type a keyword or phrase to search your conversation history.</span>
            </div>
          )}

          {conversations.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Conversations ({conversations.length})
              </span>
              <div className="space-y-1">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectConversation(c.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-left transition-colors text-xs group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-white truncate">
                        {c.title}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                Matching Messages ({messages.length})
              </span>
              <div className="space-y-1">
                {messages.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectConversation(m.conversation_id);
                      onClose();
                    }}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-left transition-colors text-xs group"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-amber-500 shrink-0 mt-0.5 transition-colors" />
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium text-slate-900 dark:text-white truncate">
                        {m.conversations?.title || "Conversation"}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {m.content}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
