import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  MoreVertical,
  Plus,
} from "lucide-react";

export default function TodaysToDoPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-mute mb-1">
            <Link href="/plans" className="hover:text-ink flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Daily Plans
            </Link>
            <span>/</span>
            <span>DSA in C++</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              Today's Focus (Day 1 of 30)
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Chunk 1 • Sprint ends in 30 days
            </span>
          </div>
        </div>

        <Link
          href="/plans/sample-1/chunk-end"
          className="text-xs text-mute hover:text-ink border border-line px-3 py-1.5 rounded-md"
        >
          Preview Chunk End Ritual
        </Link>
      </div>

      {/* Date Strip Component */}
      <div className="rounded-lg bg-surface border border-line p-3 shadow-card overflow-x-auto flex items-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <button
            key={d}
            type="button"
            className={`flex flex-col items-center justify-center min-w-[54px] py-2 px-1 rounded-md text-xs font-mono transition-all ${
              d === 1
                ? "bg-primary text-white font-bold shadow-sm"
                : "hover:bg-bg text-ink2 border border-line"
            }`}
          >
            <span className="text-[10px] uppercase opacity-80">Day</span>
            <span className="text-sm font-semibold">{d}</span>
            <span className="text-[10px] opacity-80">
              {d === 1 ? "Today" : `${d} Nov`}
            </span>
          </button>
        ))}
      </div>

      {/* Gentle Catch-Up Banner (Empty for Day 1) */}
      <div className="rounded-lg bg-surface border border-line p-4 shadow-card flex items-center justify-between text-xs text-mute">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-mute" />
          <span>No missed tasks to catch up on. You're fully on track!</span>
        </div>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">All caught up</span>
      </div>

      {/* 2-Column: Task Cards (8 cols) + Scratchpad & Milestone (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Task Cards */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Scheduled for Today (2 tasks)</h3>
            <button
              type="button"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add custom task
            </button>
          </div>

          {/* Task 1 */}
          <div className="rounded-lg bg-surface border border-line p-4 shadow-card flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-primary accent-primary mt-1 cursor-pointer"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                    Learn
                  </span>
                  <span className="text-xs text-mute font-mono">40 mins</span>
                  <span className="text-xs text-mute">• Ref 1.1</span>
                </div>
                <h4 className="text-sm font-medium text-ink">
                  Watch: C++ data types and variables
                </h4>
                <p className="text-xs text-mute">
                  Understand int, float, char, bool and type casting.
                </p>
              </div>
            </div>

            <Link
              href="/focus/task-1"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors shrink-0"
            >
              <Play className="w-3 h-3 fill-primary" />
              <span>Start Focus</span>
            </Link>
          </div>

          {/* Task 2 */}
          <div className="rounded-lg bg-surface border border-line p-4 shadow-card flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-primary accent-primary mt-1 cursor-pointer"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Practice
                  </span>
                  <span className="text-xs text-mute font-mono">50 mins</span>
                  <span className="text-xs text-mute">• Ref 1.1</span>
                </div>
                <h4 className="text-sm font-medium text-ink">
                  Write 5 small input/output programs
                </h4>
                <div className="pt-1 space-y-1 text-xs text-ink2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-line" />
                    <span>Read two numbers and print the sum</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-line" />
                    <span>Swap two variables without temp</span>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/focus/task-2"
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors shrink-0"
            >
              <Play className="w-3 h-3 fill-primary" />
              <span>Start Focus</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Scratchpad & Time Split */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <h3 className="text-sm font-semibold text-ink">Session Scratchpad</h3>
            <textarea
              placeholder="Quick thoughts, doubts or bookmarks for today..."
              className="w-full h-32 p-2.5 rounded-md bg-bg border border-line text-xs text-ink focus:outline-none focus:border-primary resize-none"
            />
            <span className="text-[11px] text-mute block text-right">Autosaved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
