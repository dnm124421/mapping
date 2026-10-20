"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Route,
  Sparkles,
  CalendarDays,
  Flame,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { APP_NAME } from "@/lib/constants";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const errorParam = searchParams.get("error");

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (errorParam === "auth_failed") {
      toast.error("Authentication failed. Please try signing in again.");
    }
  }, [errorParam]);

  // Google OAuth handler
  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured()) {
      toast.error(
        "Supabase credentials not configured in .env.local yet. See README / setup guide."
      );
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate Google sign in.");
      setLoading(false);
    }
  };

  // Email Sign In / Sign Up
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (!isSupabaseConfigured()) {
      toast.error(
        "Supabase credentials not configured in .env.local yet. Add NEXT_PUBLIC_SUPABASE_URL and KEY."
      );
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (tab === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }

        toast.success("Signed in successfully!");
        // Refresh and navigate
        router.refresh();
        router.push(next);
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              next
            )}`,
          },
        });

        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          toast.success("Account created successfully!");
          router.refresh();
          router.push("/onboarding");
        } else {
          setSignupSuccess(true);
          toast.success("Confirmation email sent! Please check your inbox.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg relative flex flex-col justify-between p-4 sm:p-6 lg:p-12">
      {/* Top Header with Theme Toggle */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
            <Route className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-ink">
            {APP_NAME}
          </span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Main 2-Column Content */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center my-8">
        {/* Left Column: Brand & Value Points */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-tint dark:bg-primary-tint/20 text-primary border border-primary/20">
              Calm Clarity Learning System
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
              Master any skill, one 30-day chunk at a time.
            </h1>
            <p className="text-sm text-ink2 max-w-lg">
              No generic chatbot clutter. Convert your favourite AI's responses into structured, checkable daily learning roadmaps.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-ink block">Copy a prompt, paste your AI's answer</span>
                <span className="text-mute">Works with ChatGPT, Claude, Gemini or any LLM. Zero paid API tokens needed.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-ink block">Lightweight 30-day sprints</span>
                <span className="text-mute">Even for a 1-year goal, only focus on the next 30 days so you never feel overwhelmed.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-warning/10 text-warning flex items-center justify-center shrink-0 mt-0.5">
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-ink block">Gentle forgiveness, zero guilt</span>
                <span className="text-mute">Missed tasks become gentle catch-up, never failure. Rest days never break your streak.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Card */}
        <div className="lg:col-span-5">
          <div className="rounded-lg bg-surface border border-line p-6 sm:p-8 shadow-card space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-medium text-primary">
                Chalo, shuru karte hain!
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ink">
                {tab === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-xs text-mute">
                Your roadmaps and daily progress are strictly private to you.
              </p>
            </div>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full h-11 rounded-md border border-line bg-surface hover:bg-bg disabled:opacity-50 text-ink text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.28C.47 8.24 0 10.06 0 12s.47 3.76 1.28 5.39l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-line w-full" />
              <span className="bg-surface px-3 text-[11px] text-mute uppercase tracking-wider relative">
                or
              </span>
            </div>

            {/* Signup confirmation banner */}
            {signupSuccess && (
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Confirmation link sent to your email! Please check your inbox to activate your account.</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3 text-xs">
              <div>
                <label className="block text-ink font-medium mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-ink font-medium">Password</label>
                  {tab === "signin" && (
                    <Link
                      href="/reset-password"
                      className="text-[11px] text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-3 pr-10 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-sm flex items-center justify-center"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : tab === "signin" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            {/* Tab switch */}
            <div className="text-center text-xs text-mute pt-1">
              {tab === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTab("signup");
                      setSignupSuccess(false);
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTab("signin");
                      setSignupSuccess(false);
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-6xl mx-auto text-center text-xs text-mute">
        <span>Your roadmaps and daily progress are strictly private via Row Level Security (RLS).</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center text-xs text-mute">
          Loading sign-in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
