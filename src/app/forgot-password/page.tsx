"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Direct reset link to the auth callback with a destination of /reset-password
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo,
      });

      if (error) {
        // If rate limited or error occurs, display sanitized message
        console.warn("Password reset error:", error.message);
        if (error.message?.toLowerCase().includes("rate")) {
          setErrorMessage("Too many reset attempts. Please wait a few minutes before trying again.");
          return;
        }
      }

      // Generic success message to protect account privacy (does not leak email existence)
      setSubmitted(true);
    } catch (err: any) {
      console.error("Forgot password handler error:", err);
      setErrorMessage("Unable to process request right now. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf6ee] dark:bg-[#0c0907] text-stone-900 dark:text-stone-100 font-sans p-4 sm:p-6 antialiased selection:bg-amber-200 selection:text-amber-900">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-orange-700/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <BrandLogo size="md" />
          </Link>
          <h1 className="mt-4 text-xl sm:text-2xl font-serif font-bold tracking-tight text-stone-900 dark:text-amber-100">
            Recover Your Account
          </h1>
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
            Enter your email address to receive a secure password reset link.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/80 dark:bg-[#16100c]/90 backdrop-blur-md border border-amber-800/20 dark:border-amber-900/40 rounded-2xl p-6 sm:p-8 shadow-xl">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl text-xs border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {submitted ? (
            <div className="text-center space-y-4 py-2 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300/50 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-base font-serif font-bold text-stone-900 dark:text-amber-100">
                Check Your Inbox
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                We&apos;ve sent a password reset link to your email address, if an account exists.
                Please check your inbox (and spam folder) and follow the instructions to create a new password.
              </p>
              <div className="pt-4 border-t border-stone-200 dark:border-amber-950/70">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="scholar@university.edu"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-amber-900/50 bg-white dark:bg-[#1a130e] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-transparent text-xs transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Recovery Link...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Send Password Reset Link</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </>
                )}
              </button>

              <div className="pt-3 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
