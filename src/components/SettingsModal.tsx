"use client";

import React, { useState, useEffect } from "react";
import { PersonaId, PERSONAS } from "@/lib/personas";
import { X, Moon, Sun, Laptop, Globe, UserX, AlertTriangle, Check, Save, Loader2 } from "lucide-react";
import { safeParseResponse } from "@/lib/network";

interface UserSettings {
  preferred_language: string;
  theme: string;
  default_persona: PersonaId;
  save_chat_history: boolean;
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => Promise<void>;
}

export function SettingsModal({ open, onClose, settings, onSaveSettings }: SettingsModalProps) {
  const [form, setForm] = useState<UserSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sync form state when modal opens or settings update
  useEffect(() => {
    setForm(settings);
    if (open) setSavedSuccess(false);
  }, [settings, open]);

  // Handle Escape key to close
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await onSaveSettings(form);
      // Keep the confirmation visible until the modal is closed,
      // so the user cannot miss that the save went through.
      setSavedSuccess(true);
    } catch (err) {
      console.error("Save settings error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/user/delete", { method: "POST" });
      const parsed = await safeParseResponse(res);
      if (parsed.ok) {
        window.location.href = "/login";
      } else {
        setDeleteError(parsed.error || "Failed to delete account. Please try again.");
      }
    } catch (err: any) {
      console.error("Account delete error:", err);
      setDeleteError(err.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Settings & Preferences</span>
            <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
              (व्यवस्थापनम्)
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          {/* Preferred Language */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Preferred Language
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "en", label: "English" },
                { id: "hi", label: "Hindi (हिन्दी)" },
                { id: "hinglish", label: "Hinglish (Hindi-English)" },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setForm({ ...form, preferred_language: lang.id })}
                  className={`py-2 px-3 rounded-xl border text-center transition-all ${
                    form.preferred_language === lang.id
                      ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 font-semibold shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              AI personas will automatically converse in your chosen language while faithfully preserving original Sanskrit citations in Devanagari script.
            </p>
          </div>

          {/* Theme Preference */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Appearance Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "light", label: "Light", icon: Sun },
                { id: "dark", label: "Dark", icon: Moon },
                { id: "system", label: "System", icon: Laptop },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm({ ...form, theme: t.id })}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      form.theme === t.id
                        ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-700 dark:text-amber-300 font-semibold shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Default Persona */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Default AI Persona
            </label>
            <select
              value={form.default_persona}
              onChange={(e) => setForm({ ...form, default_persona: e.target.value as PersonaId })}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {(Object.keys(PERSONAS) as PersonaId[]).map((id) => (
                <option key={id} value={id}>
                  {PERSONAS[id].name} ({PERSONAS[id].sanskritName}) — {PERSONAS[id].tagline}
                </option>
              ))}
            </select>
          </div>

          {/* Save Chat History Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Save Chat History
                </span>
                <span className="text-[11px] text-slate-500">
                  Securely store your conversations in Supabase PostgreSQL for continuity and search.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, save_chat_history: !form.save_chat_history })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                  form.save_chat_history ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    form.save_chat_history ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
            {!form.save_chat_history && (
              <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                <strong>Notice:</strong> When chat history is turned off, new chats are processed ephemerally in real time without database persistence.
              </p>
            )}
          </div>

          {savedSuccess && (
            <p
              role="status"
              className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2"
            >
              <Check className="w-4 h-4" />
              Preferences saved successfully.
            </p>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60 active:scale-[0.99]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Preferences</span>
                </>
              )}
            </button>

            {/* Account Deletion */}
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 text-[11px] font-medium"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Delete Account & Data</span>
            </button>
          </div>
        </form>

        {/* Account Deletion Confirmation Modal */}
        {confirmDelete && (
          <div className="mt-6 p-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Confirm Permanent Account Deletion</span>
            </div>
            <p>
              This will permanently delete your user profile, settings, chat history, attachments, and private files stored in Supabase Storage. This action cannot be reversed.
            </p>
            {deleteError && (
              <p className="p-2 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200">
                {deleteError}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm disabled:opacity-60 flex items-center gap-1"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleting ? "Deleting Everything..." : "Permanently Delete Everything"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteError(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
