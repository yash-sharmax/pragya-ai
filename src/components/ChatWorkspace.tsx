"use client";

import React, { useState, useRef, useEffect } from "react";
import { PersonaId, PERSONAS } from "@/lib/personas";
import { MessageItem, MessageBubble } from "./MessageBubble";
import { ImageAttachment, AttachmentData } from "./ImageAttachment";
import { PersonaSelector } from "./PersonaSelector";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Send,
  Sparkles,
  PanelLeft,
  Loader2,
  ArrowUpRight,
  Share2,
} from "lucide-react";

interface ChatWorkspaceProps {
  messages: MessageItem[];
  activePersona: PersonaId;
  onSelectPersona: (id: PersonaId) => void;
  onSendMessage: (content: string, attachment: AttachmentData | null) => Promise<void>;
  loading: boolean;
  conversationId: string | null;
  onToggleMobileSidebar: () => void;
  onRetryMessage?: (messageId?: string) => void;
  conversationLoading?: boolean;
  onOpenShare?: () => void;
}

export function ChatWorkspace({
  messages,
  activePersona,
  onSelectPersona,
  onSendMessage,
  loading,
  conversationId,
  onToggleMobileSidebar,
  onRetryMessage,
  conversationLoading = false,
  onOpenShare,
}: ChatWorkspaceProps) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<AttachmentData | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const persona = PERSONAS[activePersona] || PERSONAS.veda;

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Adjust textarea height automatically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if ((!input.trim() && !attachment) || loading || uploadingImage) {
      return;
    }
    const content = input.trim();
    const currentAttachment = attachment;

    setInput("");
    setAttachment(null);
    setErrorMessage(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await onSendMessage(content, currentAttachment);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send message.");
    }
  };

  // Persona starter questions rooted deeply in IKS + Modern Science
  const starterPrompts: Record<PersonaId, string[]> = {
    veda: [
      "How does the Nasadiya Sukta (Rigveda 10.129) describe cosmic origin compared to the modern Big Bang singularity?",
      "Explain the atomic theory (Parmanu) of Kanada in Vaisheshika philosophy versus modern quantum physics.",
      "What did Aryabhata and Surya Siddhanta state regarding the Earth's axial rotation and lunar eclipses?",
    ],
    neeti: [
      "How can Kautilya's Saptanga theory be applied to evaluate startup health, runway, and competitive moat?",
      "Explain the six foreign policy postures (Shadgunya) in Arthashastra and their modern corporate strategy equivalents.",
      "How does Vidura Niti advise resolving ethical dilemmas when short-term profit conflicts with long-term trust?",
    ],
    ganita: [
      "Demonstrate Nikhilam Navatashcaramam Dashatah step-by-step for 98 * 97 with base-100 algebraic proof.",
      "How did Brahmagupta mathematically formulate operations with zero and negative numbers in Brahmasphutasiddhanta?",
      "Compare the algorithmic time complexity of Urdhva Tiryagbhyam with Karatsuba multiplication.",
    ],
    sarathi: [
      "How does the concept of Sthitaprajna in the Bhagavad Gita relate to cognitive emotional regulation in modern CBT?",
      "What do the Patanjali Yoga Sutras teach about Pratipaksha Bhavana for counteracting intrusive negative thoughts?",
      "How can the principles of Abhyasa (practice) and Vairagya (non-attachment) help sustain focus and prevent burnout?",
    ],
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fbf7ee]/60 dark:bg-[#140e0a] overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-amber-900/15 dark:border-amber-800/30 bg-[#fbf7ee]/90 dark:bg-[#1c150f]/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-1.5 rounded-lg text-stone-600 hover:bg-amber-100/60 dark:text-amber-200 dark:hover:bg-amber-950/60 lg:hidden cursor-pointer"
            title="Toggle Menu"
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          {/* Persona Dropdown Selector */}
          <PersonaSelector
            activePersona={activePersona}
            onSelectPersona={onSelectPersona}
          />
        </div>

        {/* Header Right Actions: Domain Tag + Share Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-600 dark:text-amber-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">{persona.domain.split(",")[0]}</span>
          </div>

          {conversationId && onOpenShare && (
            <button
              type="button"
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300/60 dark:border-amber-800/60 bg-amber-50/70 dark:bg-[#1a120c] hover:bg-amber-100/70 dark:hover:bg-[#251b12] text-stone-800 dark:text-amber-200 text-xs font-medium shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              title="Share this conversation"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Share</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-4xl w-full mx-auto">
        {conversationLoading ? (
          /* Loading Conversation Skeleton (prevents flashing welcome screen) */
          <div className="space-y-6 py-4 animate-pulse">
            <div className="flex justify-end">
              <div className="w-2/3 sm:w-1/2 h-14 bg-amber-200/40 dark:bg-amber-950/40 rounded-2xl rounded-tr-none border border-amber-300/30" />
            </div>
            <div className="flex justify-start">
              <div className="w-4/5 sm:w-2/3 h-28 bg-amber-100/50 dark:bg-[#1e1711] rounded-2xl rounded-tl-none border border-amber-800/20" />
            </div>
            <div className="flex justify-end">
              <div className="w-1/2 sm:w-1/3 h-10 bg-amber-200/40 dark:bg-amber-950/40 rounded-2xl rounded-tr-none border border-amber-300/30" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State (New Chat) */
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <div className="mb-4">
              <BrandLogo variant="mark" size="xl" />
            </div>

            <h2 className="text-xl font-bold text-stone-900 dark:text-amber-100 flex items-center justify-center gap-2">
              <span>Welcome to {persona.name}</span>
              <span className="text-sm font-normal text-amber-700 dark:text-amber-400">
                ({persona.sanskritName})
              </span>
            </h2>
            <p className="text-sm text-stone-600 dark:text-amber-200/80 max-w-md mt-1.5 leading-relaxed">
              {persona.domain}
            </p>

            {/* Starter Suggestion Pills */}
            <div className="mt-8 grid grid-cols-1 gap-2.5 max-w-xl w-full text-left">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800/70 dark:text-amber-400/80 text-center block mb-1">
                Ancient Knowledge & Science Inquiries:
              </span>
              {starterPrompts[activePersona].map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="p-3.5 rounded-xl border border-amber-300/60 dark:border-amber-800/50 bg-[#fbf7ee] dark:bg-[#1a130e] hover:bg-amber-100/60 dark:hover:bg-[#231a13] hover:border-amber-400 dark:hover:border-amber-700 text-stone-800 dark:text-[#f0e8dc] text-xs text-left transition-all shadow-sm flex items-center justify-between group active:scale-[0.99] cursor-pointer"
                >
                  <span className="leading-snug">{prompt}</span>
                  <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 shrink-0 ml-2 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message Bubbles */
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                personaId={activePersona}
                onRetry={onRetryMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form Bar (Ancient Manuscript Composer) */}
      <div className="p-4 bg-[#fbf7ee]/90 dark:bg-[#1a130e]/90 backdrop-blur-md border-t border-amber-900/15 dark:border-amber-800/30 shrink-0">
        <div className="max-w-3xl mx-auto">
          {errorMessage && (
            <div className="mb-2.5 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
              {errorMessage}
            </div>
          )}

          <div className="relative rounded-2xl manuscript-composer shadow-sm focus-within:ring-2 focus-within:ring-amber-600/50 focus-within:border-transparent transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${persona.name} in English, Hindi (हिन्दी), or Hinglish (LaTeX supported)...`}
              rows={1}
              className="w-full pt-3.5 pb-12 px-4 bg-transparent text-sm text-stone-900 dark:text-[#f8f3ea] placeholder-stone-400 dark:placeholder-amber-300/40 focus:outline-none resize-none font-sans"
            />

            {/* Input Toolbar */}
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
              {/* Attachment Picker (Images, PDFs, Word documents, Text) */}
              <ImageAttachment
                attachment={attachment}
                onAttachmentChange={setAttachment}
                conversationId={conversationId || undefined}
                uploading={uploadingImage}
                setUploading={setUploadingImage}
                onError={(err) => setErrorMessage(err)}
              />

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={(!input.trim() && !attachment) || loading || uploadingImage}
                className="p-2 rounded-xl bg-amber-800 hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-500 text-white transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 cursor-pointer"
                title="Send Message"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-center text-stone-500 dark:text-amber-200/60 mt-2">
            Pragya AI references authentic Indian Knowledge Systems & verified modern scientific literature.
          </p>
        </div>
      </div>
    </div>
  );
}
