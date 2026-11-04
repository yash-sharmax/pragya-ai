"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import {
  Compass,
  Briefcase,
  Calculator,
  Heart,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

function LoginContent() {
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Check for query parameters indicating auth results
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");

    if (errorParam === "auth_failed") {
      setMessage({
        text: "Authentication session expired or failed. Please sign in again.",
        type: "error",
      });
    } else if (messageParam === "password_updated") {
      setMessage({
        text: "Your password has been successfully updated! Please sign in with your new credentials.",
        type: "success",
      });
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    if (loading || googleLoading) return;
    try {
      setGoogleLoading(true);
      setMessage(null);
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        setMessage({ text: error.message, type: "error" });
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to initiate Google authentication.", type: "error" });
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setMessage({ text: "Please enter both your email address and password.", type: "error" });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters long.", type: "error" });
      return;
    }

    if (isSignUp) {
      if (!confirmPassword) {
        setMessage({ text: "Please confirm your password.", type: "error" });
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ text: "Passwords do not match. Please ensure both entries are identical.", type: "error" });
        return;
      }
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const displayName = fullName.trim() || trimmedEmail.split("@")[0];
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: displayName,
            },
          },
        });

        if (error) throw error;

        // If email confirmation is enabled on Supabase, session will be null
        if (data.user && !data.session) {
          setMessage({
            text: "Your account has been created! A confirmation email has been sent. Please verify your email before signing in.",
            type: "success",
          });
          setIsSignUp(false);
          setPassword("");
          setConfirmPassword("");
        } else if (data.session) {
          // If email confirmation is disabled, user is immediately logged in
          window.location.href = "/";
        } else {
          setMessage({
            text: "Account registered successfully! Please sign in with your credentials.",
            type: "success",
          });
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          if (error.message?.toLowerCase().includes("invalid login credentials")) {
            throw new Error("Invalid email or password. Please verify your credentials and try again.");
          }
          if (error.message?.toLowerCase().includes("email not confirmed")) {
            throw new Error("Please confirm your email address before signing in. Check your inbox for the verification link.");
          }
          throw error;
        }

        if (data.session) {
          window.location.href = "/";
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Authentication failed. Please check your credentials.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#faf6ee] dark:bg-[#0c0907] text-stone-900 dark:text-stone-100 font-sans antialiased selection:bg-amber-200 selection:text-amber-900">
      {/* Left Column: Heritage & Scientific Synthesis Showcase */}
      <div className="relative lg:w-1/2 bg-[#120d09] text-stone-100 flex flex-col justify-between p-8 sm:p-12 overflow-hidden border-b lg:border-b-0 lg:border-r border-amber-900/30">
        {/* Subtle Sacred Geometry & Celestial Orbital Background SVG */}
        <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
          <svg className="w-[700px] h-[700px]" viewBox="0 0 400 400" fill="none">
            {/* Concentric planetary orbit rings */}
            <circle cx="200" cy="200" r="180" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="4 4" />
            <circle cx="200" cy="200" r="140" stroke="#d97706" strokeWidth="0.8" />
            <circle cx="200" cy="200" r="100" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3 5" />
            <circle cx="200" cy="200" r="60" stroke="#d97706" strokeWidth="0.8" />
            {/* Sulba Sutras Sacred Geometry / Golden Ratio diagonals */}
            <line x1="20" y1="200" x2="380" y2="200" stroke="#d97706" strokeWidth="0.5" strokeDasharray="2 4" />
            <line x1="200" y1="20" x2="200" y2="380" stroke="#d97706" strokeWidth="0.5" strokeDasharray="2 4" />
            <polygon points="200,50 330,275 70,275" stroke="#f59e0b" strokeWidth="1" opacity="0.6" />
            <polygon points="200,350 330,125 70,125" stroke="#f59e0b" strokeWidth="1" opacity="0.6" />
            {/* 8-fold Ray Bindus */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <circle
                key={angle}
                cx={200 + 140 * Math.cos((angle * Math.PI) / 180)}
                cy={200 + 140 * Math.sin((angle * Math.PI) / 180)}
                r="2.5"
                fill="#fde68a"
              />
            ))}
          </svg>
        </div>

        {/* Ambient Warm Golden Glows */}
        <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-amber-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -right-28 w-96 h-96 rounded-full bg-orange-700/15 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <BrandLogo size="lg" />
          </Link>
          <div className="mt-4 flex items-center gap-2 text-xs font-serif text-amber-400/90 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>INDIAN KNOWLEDGE SYSTEM + MODERN COMPUTATIONAL SCIENCE</span>
          </div>
        </div>

        {/* Hero Value Proposition */}
        <div className="relative z-10 my-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-amber-50 tracking-tight leading-tight">
              Ancient Wisdom.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
                Rigorous Computation.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-lg leading-relaxed font-sans font-light">
              Pragya AI synthesizes classical Indian epistemology, Arthashastra governance, Vedic mathematics, and mindfulness psychology with cutting-edge artificial intelligence.
            </p>
          </div>

          {/* Persona Showcase Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-serif font-bold">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Pragya Veda</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-snug">
                Physics, astronomy, natural sciences, and ancient scientific thought.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-serif font-bold">
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span>Pragya Neeti</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-snug">
                Corporate management, entrepreneurship, decision-making & ethics.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-serif font-bold">
                <Calculator className="w-4 h-4 text-amber-400" />
                <span>Pragya Ganita</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-snug">
                Algorithms, Vedic maths, number systems & computational logic.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-serif font-bold">
                <Heart className="w-4 h-4 text-amber-400" />
                <span>Pragya Sarathi</span>
              </div>
              <p className="text-[11px] text-stone-300 leading-snug">
                Mindfulness, emotional balance, CBT concepts & personal growth.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Integrity Badge */}
        <div className="relative z-10 flex items-center gap-2 text-[11px] text-stone-400 pt-4 border-t border-amber-900/40">
          <ShieldCheck className="w-4 h-4 text-amber-400/80" />
          <span>Epistemic integrity: Strict distinction between verified science and philosophical texts.</span>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {isSignUp ? "Begin Your Inquiry" : "Welcome Back"}
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5">
              {isSignUp
                ? "Create your research account to preserve conversations and notes."
                : "Enter your academic credentials or sign in with Google."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex rounded-xl bg-amber-100/70 dark:bg-[#1a130e] p-1 border border-amber-300/40 dark:border-amber-800/40 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isSignUp
                  ? "bg-white dark:bg-[#281c14] text-stone-900 dark:text-amber-200 shadow-sm border border-amber-300/30 dark:border-amber-700/40"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isSignUp
                  ? "bg-white dark:bg-[#281c14] text-stone-900 dark:text-amber-200 shadow-sm border border-amber-300/30 dark:border-amber-700/40"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Status Notification Message */}
          {message && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-xs border flex items-start gap-2.5 animate-in fade-in duration-200 ${
                message.type === "error"
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900/60"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/60"
              }`}
            >
              {message.type === "error" ? (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{message.text}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-stone-300 dark:border-amber-900/50 bg-white dark:bg-[#1a130e] text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-[#241a13] font-medium text-xs shadow-sm transition-all hover:shadow active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200 dark:border-amber-950/70" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-[#faf6ee] dark:bg-[#0c0907] px-3 text-stone-400 font-semibold">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    disabled={loading || googleLoading}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Acharya Yash"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-amber-900/50 bg-white dark:bg-[#1a130e] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-transparent text-xs transition-all disabled:opacity-60"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  disabled={loading || googleLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scholar@university.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-amber-900/50 bg-white dark:bg-[#1a130e] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-transparent text-xs transition-all disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Password
                </label>
                {!isSignUp && (
                  <Link
                    href="/forgot-password"
                    className="text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={loading || googleLoading}
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
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    disabled={loading || googleLoading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 dark:border-amber-900/50 bg-white dark:bg-[#1a130e] text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-transparent text-xs transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isSignUp ? "Creating account..." : "Signing in..."}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Create Research Account" : "Sign In to Workspace"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Terms / Privacy Disclaimer */}
          <p className="mt-8 text-[11px] text-center text-stone-500 dark:text-stone-400 leading-relaxed font-sans">
            By signing in, you agree to access Pragya AI&apos;s conversational platform for academic research, education, and cultural inquiry.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf6ee] dark:bg-[#0c0907] p-4 text-stone-700 dark:text-stone-300">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}
