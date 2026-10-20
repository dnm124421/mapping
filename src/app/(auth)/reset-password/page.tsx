"use client";

import { useState } from "react";
import Link from "next/link";
import { Route, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!isSupabaseConfigured()) {
      toast.error("Supabase credentials not configured in .env.local yet.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Password reset instructions sent to your email!");
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-lg bg-surface border border-line p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-xs text-mute hover:text-ink">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Route className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Reset Password
          </h1>
          <p className="text-xs text-mute">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {sent ? (
          <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-3 text-xs text-emerald-700 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Check your inbox</span>
            </div>
            <p className="text-[11px] opacity-90">
              We've sent password reset instructions to <strong>{email}</strong>.
            </p>
            <Link
              href="/login"
              className="inline-block text-xs font-semibold underline mt-2"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Sending email...</span>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
