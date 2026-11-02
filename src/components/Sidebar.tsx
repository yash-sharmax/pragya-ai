"use client";

import React, { useState } from "react";
import { PersonaId, PERSONAS } from "@/lib/personas";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Plus,
  MessageSquare,
  Search,
  Settings,
  LogOut,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  PanelLeftClose,
  Loader2,
} from "lucide-react";

export interface ConversationItem {
  id: string;
  title: string;
  persona: PersonaId;
  updated_at: string;
}

interface SidebarProps {
  conversations: ConversationItem[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  user: { email?: string; display_name?: string; avatar_url?: string } | null;
  onSignOut: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  loadingConversations?: boolean;
  loadingConversationId?: string | null;
}

function groupConversationsByDate(conversations: ConversationItem[]) {
  const groups: { [key: string]: ConversationItem[] } = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const sevenDaysAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  for (const c of conversations) {
    const time = new Date(c.updated_at).getTime();
    if (time >= todayStart) {
      groups["Today"].push(c);
    } else if (time >= yesterdayStart) {
      groups["Yesterday"].push(c);
    } else if (time >= sevenDaysAgoStart) {
      groups["Previous 7 Days"].push(c);
    } else {
      groups["Older"].push(c);
    }
  }

  return groups;
}

export function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onOpenSettings,
  onOpenSearch,
  user,
  onSignOut,
  mobileOpen,
  setMobileOpen,
  loadingConversations = false,
  loadingConversationId = null,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [savingRenameId, setSavingRenameId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  const startRename = (conv: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingId(null);
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      setSavingRenameId(id);
      try {
        await onRenameConversation(id, editTitle.trim());
      } finally {
        setSavingRenameId(null);
      }
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(null);
  };

  const confirmDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDeletingLoading(true);
    try {
      await onDeleteConversation(id);
    } finally {
      setIsDeletingLoading(false);
      setDeletingId(null);
    }
  };

  // Deduplicate conversations by ID
  const uniqueConversations = Array.from(
    new Map(conversations.map((c) => [c.id, c])).values()
  );

  const grouped = groupConversationsByDate(uniqueConversations);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <BrandLogo size="sm" />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 lg:hidden cursor-pointer"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Top Actions: New Chat & Search */}
        <div className="p-3 space-y-2">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              setMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md shadow-amber-500/10 transition-all active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 text-xs transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search past conversations...</span>
          </button>
        </div>

        {/* Conversations History List grouped by Date */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {loadingConversations ? (
            /* Loading Skeleton */
            <div className="space-y-1.5 px-1 py-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60"
                >
                  <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="h-3 rounded bg-slate-200 dark:bg-slate-700 w-3/4" />
                </div>
              ))}
            </div>
          ) : uniqueConversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 px-4">
              No conversations yet. Start a new chat to begin exploring Indian Knowledge Systems!
            </div>
          ) : (
            Object.entries(grouped).map(([groupTitle, items]) => {
              if (items.length === 0) return null;

              return (
                <div key={groupTitle} className="space-y-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5 py-0.5">
                    {groupTitle}
                  </div>
                  {items.map((conv) => {
                    const isActive = conv.id === currentConversationId;
                    const persona = PERSONAS[conv.persona] || PERSONAS.veda;
                    const isEditing = editingId === conv.id;
                    const isDeleting = deletingId === conv.id;
                    const isLoadingThis = loadingConversationId === conv.id;

                    return (
                      <div
                        key={conv.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (isLoadingThis || isEditing || isDeleting) return;
                          onSelectConversation(conv.id);
                          setMobileOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isEditing && !isDeleting) {
                            onSelectConversation(conv.id);
                            setMobileOpen(false);
                          }
                        }}
                        className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all outline-none select-none ${
                          isActive
                            ? "bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 font-medium shadow-sm"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
                          {isLoadingThis ? (
                            <Loader2 className="w-3.5 h-3.5 shrink-0 text-amber-500 animate-spin" />
                          ) : (
                            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${persona.color.accent}`} />
                          )}
                          {isEditing ? (
                            <input
                              type="text"
                              value={editTitle}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === "Enter") saveRename(conv.id, e as any);
                                if (e.key === "Escape") cancelRename(e as any);
                              }}
                              autoFocus
                              className="flex-1 bg-white dark:bg-slate-800 border border-amber-400 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                            />
                          ) : (
                            <span className="truncate">{conv.title}</span>
                          )}
                        </div>

                        {/* Actions: Rename / Delete */}
                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => saveRename(conv.id, e)}
                                disabled={savingRenameId === conv.id}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded cursor-pointer"
                                title="Save title"
                              >
                                {savingRenameId === conv.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={cancelRename}
                                className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : isDeleting ? (
                            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/80 p-1 rounded-lg border border-rose-200 dark:border-rose-900">
                              <button
                                type="button"
                                onClick={(e) => confirmDelete(conv.id, e)}
                                disabled={isDeletingLoading}
                                className="text-[10px] text-rose-600 dark:text-rose-400 font-bold px-1 hover:underline cursor-pointer flex items-center gap-1"
                              >
                                {isDeletingLoading && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                <span>{isDeletingLoading ? "Deleting..." : "Delete"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setDeletingId(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Cancel delete"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => startRename(conv, e)}
                                title="Rename"
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setEditingId(null);
                                  setDeletingId(conv.id);
                                }}
                                title="Delete"
                                className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* User Profile & Settings Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {user?.display_name ? user.display_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="overflow-hidden">
                <span className="font-semibold text-xs text-slate-900 dark:text-white truncate block">
                  {user?.display_name || user?.email?.split("@")[0] || "User"}
                </span>
                <span className="text-[10px] text-slate-400 truncate block">
                  {user?.email || "Account Active"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenSettings}
                title="Settings"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
