import Link from "next/link";
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Calendar,
  Route,
  ArrowRight,
  Clock,
  Play,
  Copy,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="rounded-lg bg-surface border border-line p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-tint dark:bg-primary-tint/20 text-primary border border-primary/20">
              Today • 24 Oct
            </span>
            <span className="text-xs text-mute">Phase 0 Preview</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Chalo, shuru karte hain!
          </h2>
          <p className="text-sm text-ink2">
            Welcome to Roadmap Planner. Master any skill without overwhelm in structured 30-day chunks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 px-3.5 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-mute" />
            <span>Copy Study Routine</span>
          </button>
          <Link
            href="/focus/demo-task"
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Start Focus Block</span>
          </Link>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Skills */}
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs text-mute">
            <span>Active Skills</span>
            <Route className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-ink">1</span>
            <span className="text-xs text-ink2">Curriculum in progress</span>
          </div>
          <div className="pt-2">
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
              DSA in C++
            </span>
          </div>
        </div>

        {/* Today's Target */}
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs text-mute">
            <span>Today's Target</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-ink">0 / 3</span>
            <span className="text-xs text-ink2">Tasks completed</span>
          </div>
          <div className="w-full bg-line rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-success h-full rounded-full w-0 transition-all" />
          </div>
        </div>

        {/* Streak */}
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs text-mute">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-warning fill-warning" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-ink">0</span>
            <span className="text-xs text-ink2">Days streak (Next: 7 days)</span>
          </div>
          <div className="pt-2 text-xs text-mute flex items-center gap-1.5">
            <span>Streak safe • Rest days never break it</span>
          </div>
        </div>
      </div>

      {/* Signature 3-Step Ritual Callout */}
      <div className="rounded-lg bg-gradient-to-r from-primary-tint/50 via-surface to-surface border border-primary/20 p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                The Core Loop: Prompt → JSON → App
              </span>
            </div>
            <h3 className="text-lg font-semibold text-ink">
              Create your first learning roadmap in 2 minutes
            </h3>
            <p className="text-xs text-ink2 max-w-xl">
              1. Copy ready-made Prompt A • 2. Run in your favourite AI (ChatGPT / Claude / Gemini) • 3. Paste the strict JSON back into the app.
            </p>
          </div>
          <Link
            href="/roadmaps/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-all shadow-sm shrink-0"
          >
            <span>Launch Roadmap Wizard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick Navigation to Other Screens */}
      <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Phase 0 Shell Navigation Preview</h3>
          <span className="text-xs text-mute">Explore all attached screens</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          <Link href="/roadmaps" className="p-3 rounded-md bg-bg border border-line hover:border-primary/50 transition-colors flex flex-col gap-1">
            <span className="font-medium text-ink">/roadmaps</span>
            <span className="text-[11px] text-mute">Skill Roadmaps List</span>
          </Link>
          <Link href="/roadmaps/new" className="p-3 rounded-md bg-bg border border-line hover:border-primary/50 transition-colors flex flex-col gap-1">
            <span className="font-medium text-ink">/roadmaps/new</span>
            <span className="text-[11px] text-mute">3-Step AI Import Wizard</span>
          </Link>
          <Link href="/roadmaps/sample-1" className="p-3 rounded-md bg-bg border border-line hover:border-primary/50 transition-colors flex flex-col gap-1">
            <span className="font-medium text-ink">/roadmaps/[id]</span>
            <span className="text-[11px] text-mute">Roadmap Detail (DSA)</span>
          </Link>
          <Link href="/plans" className="p-3 rounded-md bg-bg border border-line hover:border-primary/50 transition-colors flex flex-col gap-1">
            <span className="font-medium text-ink">/plans</span>
            <span className="text-[11px] text-mute">Daily Sprint Plans</span>
          </Link>
          <Link href="/plans/new" className="p-3 rounded-md bg-bg border border-line hover:border-primary/50 transition-colors flex flex-col gap-1">
            <span className="font-medium text-ink">/plans/new</span>
            <span className="text-[11px] text-mute">New 30-Day Plan Wizard</span>
          </Link>
          <Link href="/plans/sample-1" className="p-3 rounded-md bg-bg border border-line hover:border-primary/50 transition-colors flex flex-col gap-1">
            <span className="font-medium text-ink">/plans/[id]</span>
            <span className="text-[11px] text-mute">Today's To-Do List</span>
          </Link>
          <Link href="/plans/sample-1/chunk-end" className="p-3 rounded-md bg-bg border border-line hover:border-primary/50 transition-colors flex flex-col gap-1">
            <span className="font-medium text-ink">.../chunk-end</span>
            <span className="text-[11px] text-mute">30-Day End Ritual</span>
          </Link>
          <Link href="/focus/sample-task" className="p-3 rounded-md bg-bg border border-line hover:border-primary/50 transition-colors flex flex-col gap-1">
            <span className="font-medium text-ink">/focus/[taskId]</span>
            <span className="text-[11px] text-mute">Active Focus Mode</span>
          </Link>
          <Link href="/history" className="p-3 rounded-md bg-bg border border-line hover:border-primary/50 transition-colors flex flex-col gap-1">
            <span className="font-medium text-ink">/history</span>
            <span className="text-[11px] text-mute">Analytics & Heatmap</span>
          </Link>
          <Link href="/settings" className="p-3 rounded-md bg-bg border border-line hover:border-primary/50 transition-colors flex flex-col gap-1">
            <span className="font-medium text-ink">/settings</span>
            <span className="text-[11px] text-mute">Settings & Data Vault</span>
          </Link>
          <Link href="/login" className="p-3 rounded-md bg-bg border border-line hover:border-primary/50 transition-colors flex flex-col gap-1">
            <span className="font-medium text-ink">/login</span>
            <span className="text-[11px] text-mute">Google Sign-in</span>
          </Link>
          <Link href="/onboarding" className="p-3 rounded-md bg-bg border border-line hover:border-primary/50 transition-colors flex flex-col gap-1">
            <span className="font-medium text-ink">/onboarding</span>
            <span className="text-[11px] text-mute">First-run Onboarding</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
