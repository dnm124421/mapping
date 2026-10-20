import Link from "next/link";
import { Plus, CalendarDays, ArrowRight, Clock, Flame, CheckCircle2 } from "lucide-react";

export default function PlansPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Daily Plans</h2>
          <p className="text-xs text-ink2">
            Every skill broken down into focused 30-day sprint chunks.
          </p>
        </div>
        <Link
          href="/plans/new"
          className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New 30-Day Plan</span>
        </Link>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Daily Commitment</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">2.0 hrs/day</p>
        </div>
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Today's Load</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">3 tasks scheduled</p>
        </div>
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Account Sync</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            Synced
          </p>
        </div>
      </div>

      {/* Active Sprint Chunks Grid */}
      <div className="space-y-4">
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card hover:shadow-card-hover transition-all space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                  DSA in C++
                </span>
                <span className="text-xs text-mute font-mono">Day 1 of 365</span>
              </div>
              <h3 className="text-base font-semibold text-ink mt-1">
                Chunk 1 of 12 • Sprint ends in 30 days
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                On Track
              </span>
            </div>
          </div>

          {/* Today's Agenda Preview */}
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-ink text-[11px] uppercase tracking-wider">
              Today's Agenda
            </span>
            <div className="space-y-1.5">
              <div className="p-2.5 rounded-md bg-bg border border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-mute" />
                  <span className="font-medium text-ink">Watch: C++ data types</span>
                </div>
                <span className="text-mute font-mono">40m</span>
              </div>
              <div className="p-2.5 rounded-md bg-bg border border-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-mute" />
                  <span className="font-medium text-ink">Write 5 small input/output programs</span>
                </div>
                <span className="text-mute font-mono">50m</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Link
              href="/roadmaps/sample-1"
              className="text-xs text-mute hover:text-ink transition-colors"
            >
              View Roadmap
            </Link>
            <Link
              href="/plans/sample-1"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
            >
              <span>Go to Today's To-Do</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
