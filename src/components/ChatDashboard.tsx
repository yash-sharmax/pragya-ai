"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PersonaId } from "@/lib/personas";
import { Sidebar, ConversationItem } from "@/components/Sidebar";
import { ChatWorkspace } from "@/components/ChatWorkspace";
import { MessageItem } from "@/components/MessageBubble";
import { AttachmentData } from "@/components/ImageAttachment";
import { SettingsModal } from "@/components/SettingsModal";
import { SearchModal } from "@/components/SearchModal";
import { ShareModal } from "@/components/ShareModal";
import { isOnline, safeParseResponse, formatNetworkError } from "@/lib/network";

interface ChatDashboardProps {
  initialConversationId?: string;
}

export function ChatDashboard({ initialConversationId }: ChatDashboardProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; display_name?: string; avatar_url?: string } | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
  const [conversationLoading, setConversationLoading] = useState(Boolean(initialConversationId));
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(initialConversationId || null);
  const [activePersona, setActivePersona] = useState<PersonaId>("veda");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [settings, setSettings] = useState({
    preferred_language: "en",
    theme: "system",
    default_persona: "veda" as PersonaId,
    save_chat_history: true,
  });

  // Track active conversation ID with a ref to prevent race conditions and stale async overwrites
  const activeConversationIdRef = useRef<string | null>(initialConversationId || null);
  // AbortController ref to cancel in-flight stream on switch or new chat
  const abortControllerRef = useRef<AbortController | null>(null);

  const supabase = createClient();

  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await fetch("/api/conversations");
      const parsed = await safeParseResponse(res);
      if (parsed.ok && parsed.data) {
        setConversations(parsed.data.conversations || []);
      }
    } catch (err) {
      console.error("Load conversations error:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load a single conversation by ID with race condition protection
  const loadConversation = useCallback(
    async (id: string, updateUrl = true): Promise<boolean> => {
      if (!id) return false;
      setLoadingConversationId(id);
      setConversationLoading(true);

      try {
        const res = await fetch(`/api/conversations/${id}`);
        const parsed = await safeParseResponse(res);

        // If user navigated away while this fetch was in flight, discard result
        if (activeConversationIdRef.current !== id) {
          return false;
        }

        if (!parsed.ok) {
          console.warn(`Conversation ${id} not found or unauthorized:`, parsed.error);
          activeConversationIdRef.current = null;
          setCurrentConversationId(null);
          setMessages([]);
          if (updateUrl || window.location.pathname !== "/") {
            window.history.pushState(null, "", "/");
          }
          return false;
        }

        const data = parsed.data;
        if (data.conversation) {
          activeConversationIdRef.current = data.conversation.id;
          setCurrentConversationId(data.conversation.id);
          setActivePersona(data.conversation.persona);
        }
        setMessages(data.messages || []);

        if (updateUrl && window.location.pathname !== `/c/${id}`) {
          window.history.pushState(null, "", `/c/${id}`);
        }
        return true;
      } catch (err) {
        console.error("Load conversation error:", err);
        if (activeConversationIdRef.current === id) {
          activeConversationIdRef.current = null;
          setCurrentConversationId(null);
          setMessages([]);
          if (updateUrl || window.location.pathname !== "/") {
            window.history.pushState(null, "", "/");
          }
        }
        return false;
      } finally {
        if (activeConversationIdRef.current === id) {
          setLoadingConversationId(null);
          setConversationLoading(false);
        }
      }
    },
    []
  );

  // 1. Initial Load: Auth check, load settings, conversations, and initial conversation concurrently
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        window.location.href = "/login";
        return;
      }

      if (!isMounted) return;
      setUser({
        email: authUser.email,
        display_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0],
        avatar_url: authUser.user_metadata?.avatar_url,
      });

      // Fetch settings and conversations in parallel
      const settingsPromise = fetch("/api/settings").then(safeParseResponse);
      const convsPromise = fetch("/api/conversations").then(safeParseResponse);

      // If initial conversation ID was specified via URL, load it immediately
      if (initialConversationId) {
        activeConversationIdRef.current = initialConversationId;
        loadConversation(initialConversationId, false);
      }

      const [parsedSet, parsedConvs] = await Promise.all([settingsPromise, convsPromise]);
      if (!isMounted) return;

      if (parsedSet.ok && parsedSet.data?.settings) {
        setSettings(parsedSet.data.settings);
        if (!initialConversationId && parsedSet.data.settings.default_persona) {
          setActivePersona(parsedSet.data.settings.default_persona);
        }
        applyTheme(parsedSet.data.settings.theme);
      }

      if (parsedConvs.ok && parsedConvs.data?.conversations) {
        setConversations(parsedConvs.data.conversations || []);
      }
      setLoadingConversations(false);
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [initialConversationId, loadConversation]);

  // Listen to popstate (browser back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/c\/([0-9a-fA-F-]+)$/);

      // Cancel any ongoing streaming AI request on navigation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setLoading(false);

      if (match) {
        const id = match[1];
        if (id !== activeConversationIdRef.current) {
          activeConversationIdRef.current = id;
          setCurrentConversationId(id);
          loadConversation(id, false);
        }
      } else if (path === "/" || path === "") {
        if (activeConversationIdRef.current !== null) {
          activeConversationIdRef.current = null;
          setCurrentConversationId(null);
          setMessages([]);
          setConversationLoading(false);
          setActivePersona(settings.default_persona || "veda");
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [loadConversation, settings.default_persona]);

  // Select conversation from history sidebar or search modal
  const handleSelectConversation = async (id: string) => {
    if (id === currentConversationId && !conversationLoading) return;

    // 1. Cancel in-flight AI stream if running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);

    // 2. Update active reference and state immediately
    activeConversationIdRef.current = id;
    setCurrentConversationId(id);

    // 3. Update URL
    if (window.location.pathname !== `/c/${id}`) {
      window.history.pushState(null, "", `/c/${id}`);
    }

    // 4. Load the conversation
    await loadConversation(id, false);
  };

  // Start New Chat (Task 1: Complete Reset)
  const handleNewChat = () => {
    // 1. Cancel any active AI stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);

    // 2. Completely reset state
    activeConversationIdRef.current = null;
    setCurrentConversationId(null);
    setMessages([]);
    setConversationLoading(false);
    setLoadingConversationId(null);
    setActivePersona(settings.default_persona || "veda");

    // 3. Update URL to root
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  };

  // Send Message Handler (with SSE streaming, truthful status indicators & non-duplicating retry)
  const handleSendMessage = async (
    content: string,
    attachment: AttachmentData | null,
    options?: { isRetry?: boolean; existingUserMsgId?: string; assistantMsgIdToUpdate?: string }
  ) => {
    const isRetry = options?.isRetry ?? false;
    const tempUserMsgId = options?.existingUserMsgId || `user-${Date.now()}`;
    const targetAssistantMsgId = options?.assistantMsgIdToUpdate || `asst-${Date.now()}`;

    // Handle Offline State (Task 5: Preserves User Message on screen)
    if (!isOnline()) {
      if (isRetry && options?.assistantMsgIdToUpdate) {
        // Retrying while offline: mark assistant message as failed with clear message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === options.assistantMsgIdToUpdate
              ? { ...m, status: "failed", error_message: "Network offline. Please check your internet connection." }
              : m
          )
        );
      } else {
        // New message while offline: preserve the user message on screen alongside failed assistant bubble!
        const optimisticUserMessage: MessageItem = {
          id: tempUserMsgId,
          role: "user",
          content,
          status: "completed",
          attachments: attachment
            ? [
                {
                  id: "temp-att",
                  file_name: attachment.fileName,
                  file_path: attachment.filePath,
                  file_size: attachment.fileSize,
                  mime_type: attachment.mimeType,
                },
              ]
            : undefined,
        };

        const failedAssistantMessage: MessageItem = {
          id: targetAssistantMsgId,
          role: "assistant",
          content: "",
          status: "failed",
          error_message: "Network offline. Please check your internet connection.",
        };

        setMessages((prev) => [...prev, optimisticUserMessage, failedAssistantMessage]);
      }
      return;
    }

    // Online execution: Setup pending assistant message
    if (isRetry && options?.assistantMsgIdToUpdate) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === options.assistantMsgIdToUpdate
            ? { ...m, status: "pending", statusText: "Thinking...", error_message: undefined }
            : m
        )
      );
    } else {
      const optimisticUserMessage: MessageItem = {
        id: tempUserMsgId,
        role: "user",
        content,
        status: "completed",
        attachments: attachment
          ? [
              {
                id: "temp-att",
                file_name: attachment.fileName,
                file_path: attachment.filePath,
                file_size: attachment.fileSize,
                mime_type: attachment.mimeType,
              },
            ]
          : undefined,
      };

      const optimisticAssistantMessage: MessageItem = {
        id: targetAssistantMsgId,
        role: "assistant",
        content: "",
        status: "pending",
        statusText: "Thinking...",
      };

      setMessages((prev) => [...prev, optimisticUserMessage, optimisticAssistantMessage]);
    }

    setLoading(true);

    // Setup AbortController for cancelable streaming
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestConversationId = activeConversationIdRef.current;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        signal: controller.signal,
        body: JSON.stringify({
          content,
          personaId: activePersona,
          conversationId: requestConversationId,
          attachment: attachment
            ? {
                fileName: attachment.fileName,
                filePath: attachment.filePath,
                fileSize: attachment.fileSize,
                mimeType: attachment.mimeType,
                base64: attachment.base64,
                extractedText: attachment.extractedText,
                isScanned: attachment.isScanned,
              }
            : undefined,
          isRetry,
          existingUserMessageId: isRetry ? options?.existingUserMsgId : undefined,
          stream: true,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() || "";

          for (const block of blocks) {
            if (!block.trim()) continue;

            let eventType = "message";
            let dataStr = "";

            for (const line of block.split("\n")) {
              if (line.startsWith("event:")) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataStr = line.slice(5).trim();
              }
            }

            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              // Discard stream chunks if user navigated to a different conversation
              if (activeConversationIdRef.current !== requestConversationId && requestConversationId !== null) {
                return;
              }

              if (eventType === "status") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === targetAssistantMsgId
                      ? { ...msg, statusText: data.status }
                      : msg
                  )
                );
              } else if (eventType === "chunk") {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === targetAssistantMsgId
                      ? {
                          ...msg,
                          content: (msg.content || "") + (data.delta || ""),
                          status: "pending",
                          isStreaming: true,
                        }
                      : msg
                  )
                );
              } else if (eventType === "done") {
                if (data.conversationId && data.conversationId !== activeConversationIdRef.current) {
                  const newId = data.conversationId;
                  activeConversationIdRef.current = newId;
                  setCurrentConversationId(newId);
                  window.history.replaceState(null, "", `/c/${newId}`);

                  const newTitle = data.conversationTitle || content.slice(0, 30);
                  setConversations((prev) => [
                    {
                      id: newId,
                      title: newTitle,
                      persona: activePersona,
                      updated_at: new Date().toISOString(),
                    },
                    ...prev.filter((c) => c.id !== newId),
                  ]);
                } else if (data.conversationTitle && activeConversationIdRef.current) {
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === activeConversationIdRef.current
                        ? { ...c, title: data.conversationTitle }
                        : c
                    )
                  );
                }

                setMessages((prev) =>
                  prev.map((msg) => {
                    if (msg.id === targetAssistantMsgId) {
                      return {
                        id: data.assistantMessageId || targetAssistantMsgId,
                        role: "assistant",
                        content: data.content,
                        status: "completed",
                        sources: data.sources || [],
                        response_time_ms: data.responseTimeMs,
                      };
                    }
                    return msg;
                  })
                );
              } else if (eventType === "error") {
                throw new Error(data.error || "Generation error.");
              }
            } catch (jsonErr: any) {
              console.warn("SSE event parse error:", jsonErr);
            }
          }
        }
      } else {
        // Non-streaming response or fallback
        const parsed = await safeParseResponse(res);
        if (!parsed.ok) {
          throw new Error(parsed.error || "Failed to generate AI response.");
        }

        // Discard if user switched conversations
        if (activeConversationIdRef.current !== requestConversationId && requestConversationId !== null) {
          return;
        }

        const data = parsed.data;
        if (data.conversationId && data.conversationId !== activeConversationIdRef.current) {
          const newId = data.conversationId;
          activeConversationIdRef.current = newId;
          setCurrentConversationId(newId);
          window.history.replaceState(null, "", `/c/${newId}`);

          const newTitle = data.conversationTitle || content.slice(0, 30);
          setConversations((prev) => [
            {
              id: newId,
              title: newTitle,
              persona: activePersona,
              updated_at: new Date().toISOString(),
            },
            ...prev.filter((c) => c.id !== newId),
          ]);
        } else if (data.conversationTitle && activeConversationIdRef.current) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversationIdRef.current
                ? { ...c, title: data.conversationTitle }
                : c
            )
          );
        }

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === targetAssistantMsgId) {
              return {
                id: data.assistantMessageId || targetAssistantMsgId,
                role: "assistant",
                content: data.content,
                status: "completed",
                sources: data.sources || [],
                response_time_ms: data.responseTimeMs,
              };
            }
            return msg;
          })
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // Request was intentionally canceled due to conversation switch or new chat
        return;
      }
      console.error("Chat error:", err);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === targetAssistantMsgId) {
            return {
              ...msg,
              status: "failed",
              error_message: formatNetworkError(err),
            };
          }
          return msg;
        })
      );
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Retry Message Handler (Task 5: Preserves exact user prompt without duplicate messages)
  const handleRetryMessage = (failedAssistantMsgId?: string) => {
    if (messages.length === 0) return;

    let targetAssistantIdx = -1;
    if (failedAssistantMsgId) {
      targetAssistantIdx = messages.findIndex((m) => m.id === failedAssistantMsgId);
    } else {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "assistant" && messages[i].status === "failed") {
          targetAssistantIdx = i;
          break;
        }
      }
    }

    if (targetAssistantIdx === -1) return;
    const failedAssistantMsg = messages[targetAssistantIdx];

    // Find the corresponding user message preceding the failed assistant bubble
    let userMsg: MessageItem | undefined;
    for (let j = targetAssistantIdx - 1; j >= 0; j--) {
      if (messages[j].role === "user") {
        userMsg = messages[j];
        break;
      }
    }

    if (!userMsg) return;

    handleSendMessage(userMsg.content, null, {
      isRetry: true,
      existingUserMsgId: userMsg.id,
      assistantMsgIdToUpdate: failedAssistantMsg.id,
    });
  };

  // Rename Conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      const parsed = await safeParseResponse(res);
      if (parsed.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
        );
      }
    } catch (err) {
      console.error("Rename conversation error:", err);
    }
  };

  // Delete Conversation (Task 3: Backend deletion, clean sidebar update & new chat reset)
  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      const parsed = await safeParseResponse(res);
      if (parsed.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        // If the active conversation was deleted, reset to new chat cleanly
        if (activeConversationIdRef.current === id || currentConversationId === id) {
          handleNewChat();
        }
      } else {
        alert(parsed.error || "Failed to delete conversation.");
      }
    } catch (err: any) {
      console.error("Delete conversation error:", err);
      alert(err?.message || "Failed to delete conversation.");
    }
  };

  // Save Settings
  const handleSaveSettings = async (newSettings: typeof settings) => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
    const parsed = await safeParseResponse(res);
    if (parsed.ok && parsed.data?.settings) {
      setSettings(parsed.data.settings);
      applyTheme(parsed.data.settings.theme);
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        user={user}
        onSignOut={handleSignOut}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        loadingConversations={loadingConversations}
        loadingConversationId={loadingConversationId}
      />

      {/* Main Workspace */}
      <ChatWorkspace
        messages={messages}
        activePersona={activePersona}
        onSelectPersona={setActivePersona}
        onSendMessage={(content, att) => handleSendMessage(content, att)}
        loading={loading}
        conversationLoading={conversationLoading}
        conversationId={currentConversationId}
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onRetryMessage={handleRetryMessage}
        onOpenShare={() => setShareModalOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Search Modal */}
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectConversation={handleSelectConversation}
      />

      {/* Public Share Modal */}
      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        conversationId={currentConversationId}
        conversationTitle={
          conversations.find((c) => c.id === currentConversationId)?.title
        }
      />
    </div>
  );
}
