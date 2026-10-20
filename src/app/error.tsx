"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
        <AlertCircle className="w-6 h-6" />
      </div>

      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">
        Something went wrong
      </span>

      <h1 className="text-2xl font-bold tracking-tight text-ink mb-2">
        No stress, we can recover from this
      </h1>

      <p className="text-xs text-ink2 max-w-md mb-6 font-mono bg-surface p-3 rounded-md border border-line">
        {error.message || "An unexpected error occurred while rendering this page."}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
