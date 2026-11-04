"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { safeParseResponse } from "@/lib/network";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: string | null;
  conversationTitle?: string;
}

export function ShareModal({
  open,
  onClose,
  conversationId,
  conversationTitle,
}: ShareModalProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current share status whenever modal opens
  useEffect(() => {
    if (!open || !conversationId) return;

    let mounted = true;
    const fetchStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/conversations/${conversationId}/share`);
        const parsed = await safeParseResponse(res);
        if (mounted) {
          if (parsed.ok && parsed.data) {
            setIsPublic(parsed.data.is_public || false);
            setShareUrl(parsed.data.shareUrl || null);
          } else {
            setError(parsed.error || "Could not retrieve share status.");
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to check sharing status.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStatus();

    return () => {
      mounted = false;
    };
  }, [open, conversationId]);

  // Handle keyboard Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  if (!open || !conversationId) return null;

  const handleToggleShare = async () => {
    setToggling(true);
    setError(null);

    try {
      if (isPublic) {
        // Revoke public sharing
        const res = await fetch(`/api/conversations/${conversationId}/share`, {
          method: "DELETE",
        });
        const parsed = await safeParseResponse(res);
        if (parsed.ok) {
          setIsPublic(false);
          setShareUrl(null);
        } else {
          setError(parsed.error || "Failed to revoke public sharing.");
        }
      } else {
        // Enable public sharing
        const res = await fetch(`/api/conversations/${conversationId}/share`, {
          method: "POST",
        });
        const parsed = await safeParseResponse(res);
        if (parsed.ok && parsed.data) {
          setIsPublic(true);
          setShareUrl(parsed.data.shareUrl);
        } else {
          setError(parsed.error || "Failed to create public share link.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while updating share status.");
    } finally {
      setToggling(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#faf6ee] dark:bg-[#150f0b] border border-amber-300/60 dark:border-amber-900/50 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-100 text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-800/15 dark:border-amber-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300/50 dark:border-amber-700/50 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight font-serif flex items-center gap-1.5">
                <span>Share Conversation</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-normal font-sans bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/30 dark:border-amber-800/30">
                  संभाषण-साझा
                </span>
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-xs">
                {conversationTitle || "Active conversation"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-stone-500 text-xs">
            <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
            <span>Checking share configuration...</span>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Share Status Banner */}
            <div className="p-4 rounded-xl border border-amber-800/20 dark:border-amber-900/40 bg-white/70 dark:bg-[#1e1611] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isPublic
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300/40"
                      : "bg-stone-100 dark:bg-stone-850 text-stone-500 border border-stone-200 dark:border-stone-700"
                  }`}
                >
                  {isPublic ? (
                    <Globe className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span>{isPublic ? "Public Sharing Enabled" : "Private Conversation"}</span>
                    {isPublic && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {isPublic
                      ? "Anyone with the link can view this research session."
                      : "Only you can view this conversation."}
                  </p>
                </div>
              </div>

              {/* Toggle Action */}
              <button
                type="button"
                onClick={handleToggleShare}
                disabled={toggling}
                className={`px-3 py-1.5 rounded-xl font-medium text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-60 ${
                  isPublic
                    ? "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                    : "bg-amber-600 hover:bg-amber-500 text-white"
                }`}
              >
                {toggling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isPublic ? "Revoke Link" : "Create Public Link"}</span>
              </button>
            </div>

            {/* Public Link Display & Copy (when enabled) */}
            {isPublic && shareUrl && (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Public Share Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="w-full px-3 py-2 rounded-xl border border-amber-300/60 dark:border-amber-800/60 bg-white dark:bg-[#1e1611] text-stone-800 dark:text-amber-100 text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-amber-300/60 dark:border-amber-800/60 bg-white dark:bg-[#1e1611] hover:bg-amber-50 dark:hover:bg-amber-950/40 text-stone-600 dark:text-stone-300 transition-colors"
                    title="Open public link in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Explanatory Notice */}
            <div className="p-3.5 rounded-xl bg-amber-100/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed space-y-1">
              <p>
                <strong>Security note:</strong> Public links are unguessable and allow anyone to read this conversation, citations, LaTeX equations, and sources without needing to log in.
              </p>
              {isPublic ? (
                <p>
                  You can revoke access at any time by clicking <em>Revoke Link</em> above, which immediately invalidates the URL.
                </p>
              ) : (
                <p>
                  This conversation is currently <strong>private</strong> — only you can see it. A public link exists only after you click <em>Create Public Link</em>.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
