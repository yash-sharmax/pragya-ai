"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Check URL parameters for explicit errors (e.g. from callback)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("error") === "invalid_or_expired") {
      setErrorMessage("Your password reset link is invalid or has expired. Please request a new one.");
      setCheckingSession(false);
      return;
    }

    // Verify recovery session
    const verifyRecoverySession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          if (session) {
            setSessionValid(true);
          } else {
            // Also check hash fragments for implicit recovery tokens (#access_token=...)
            const hash = window.location.hash;
            if (hash && hash.includes("access_token")) {
              setSessionValid(true);
            } else {
              setErrorMessage("No active recovery session found. Your password reset link may have expired or already been used.");
            }
          }
        }
      } catch (err: any) {
        if (mounted) {
          console.error("Session verification error:", err);
          setErrorMessage("Failed to verify recovery session. Please request a new reset link.");
        }
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    verifyRecoverySession();

    // Listen for auth state changes (e.g. PASSWORD_RECOVERY event)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        if (mounted) {
          setSessionValid(true);
          setCheckingSession(false);
          setErrorMessage(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!password || !confirmPassword) {
      setErrorMessage("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify that both entries are identical.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      // Clean up the recovery session so they can authenticate cleanly with their new password
      await supabase.auth.signOut().catch(() => {});

      // Automatically redirect after 3 seconds
      setTimeout(() => {
        router.push("/login?message=password_updated");
      }, 3000);
    } catch (err: any) {
      console.error("Password update error:", err);
      setErrorMessage(err.message || "Failed to update password. Your reset session may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf6ee] dark:bg-[#0c0907] text-stone-900 dark:text-stone-100 p-4">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo size="md" />
          <div className="flex items-center gap-2 text-xs font-serif text-amber-800 dark:text-amber-300 mt-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>Validating recovery security credentials...</span>
          </div>
        </div>
      </div>
    );
  }

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
            Set New Password
          </h1>
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
            Create a secure new password for your Pragya AI account.
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

          {success ? (
            <div className="text-center space-y-4 py-2 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300/50 text-emerald-700 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-base font-serif font-bold text-stone-900 dark:text-amber-100">
                Password Successfully Updated
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Your password has been changed. You will be redirected to the sign-in page in a few moments.
              </p>
              <div className="pt-4 border-t border-stone-200 dark:border-amber-950/70">
                <Link
                  href="/login?message=password_updated"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md transition-all active:scale-[0.98]"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : !sessionValid ? (
            <div className="text-center space-y-4 py-2 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300/50 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-base font-serif font-bold text-stone-900 dark:text-amber-100">
                Recovery Link Expired
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                Password recovery links can only be used once and expire for your security. Please request a fresh reset link.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/forgot-password"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-sm transition-all"
                >
                  <span>Request New Link</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 dark:border-amber-900/50 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#201711] text-xs font-medium transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 dark:border-amber-900/50 bg-white dark:bg-[#1a130e] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-transparent text-xs transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 dark:border-amber-900/50 bg-white dark:bg-[#1a130e] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-transparent text-xs transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Set New Password & Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="pt-3 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel and Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
