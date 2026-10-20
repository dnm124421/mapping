"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  CheckCircle2,
  Copy,
} from "lucide-react";

export default function FocusModePage({
  params,
}: {
  params: { taskId: string };
}) {
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <Link
          href="/plans/sample-1"
          className="flex items-center gap-1.5 text-xs text-mute hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Today's Tasks
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            Active Focus Session
          </span>
        </div>
      </div>

      {/* Main Focus Area: Timer Ring & Objective */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Timer Card (7 cols) */}
        <div className="md:col-span-7 rounded-lg bg-surface border border-line p-8 shadow-card flex flex-col items-center justify-center text-center space-y-6">
          <span className="text-xs uppercase tracking-wider text-mute font-semibold">
            Deep Study Sprint
          </span>

          {/* Timer Display */}
          <div className="relative w-56 h-56 rounded-full border-4 border-line flex flex-col items-center justify-center bg-bg shadow-inner">
            <span className="text-5xl font-mono font-bold text-ink">25:00</span>
            <span className="text-xs text-mute mt-1">Planned: 25 mins</span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {isRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isRunning ? "Pause" : "Start Session"}</span>
            </button>
            <button
              type="button"
              className="px-4 py-2.5 rounded-md border border-line bg-surface hover:bg-bg text-ink text-sm font-medium transition-colors"
            >
              +5m
            </button>
          </div>
        </div>

        {/* Priority Objective & Queue (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-mute">
              Priority Objective
            </span>
            <h3 className="text-base font-semibold text-ink">
              Watch: C++ data types and variables
            </h3>
            <p className="text-xs text-ink2">
              Understand primitives, sizes in memory, and type casting rules.
            </p>

            <div className="pt-2 border-t border-line space-y-1.5 text-xs text-ink">
              <span className="text-mute font-medium text-[11px] block">Acceptance Criteria:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded text-primary" />
                <span>Understand int vs long differences</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded text-primary" />
                <span>Try 3 examples with cin/cout</span>
              </label>
            </div>
          </div>

          {/* Streak Shield */}
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Streak Shield</span>
            </div>
            <p className="text-[11px] opacity-90">
              Logging at least 10 minutes of focused work today locks in your streak!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
