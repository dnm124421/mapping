import Link from "next/link";
import { Plus, Route, Upload, BookOpen, Clock, ArrowRight } from "lucide-react";

export default function RoadmapsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Skill Roadmaps</h2>
          <p className="text-xs text-ink2">
            Organize multi-stage curricula and track topic mastery step-by-step.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/roadmaps/new"
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Skill Roadmap</span>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Active Roadmaps</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">1</p>
        </div>
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">No Plan Yet</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">0</p>
        </div>
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Avg. Chunk Pace</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            100%
          </p>
        </div>
      </div>

      {/* Roadmaps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sample Card */}
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card hover:shadow-card-hover transition-all border-l-4 border-l-primary space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
              Beginner
            </span>
            <span className="text-xs text-mute font-mono">4 Stages • 12 Topics</span>
          </div>

          <div>
            <h3 className="text-base font-semibold text-ink">DSA in C++</h3>
            <p className="text-xs text-ink2 line-clamp-2 mt-1">
              From C++ basics to trees, graphs, and dynamic programming for technical interviews.
            </p>
          </div>

          <div className="pt-2 border-t border-line flex items-center justify-between">
            <span className="text-xs text-mute">0% completed</span>
            <Link
              href="/roadmaps/sample-1"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover"
            >
              <span>Open Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Create new card */}
        <Link
          href="/roadmaps/new"
          className="rounded-lg border-2 border-dashed border-line hover:border-primary/50 p-6 flex flex-col items-center justify-center text-center gap-2 transition-colors group bg-bg/50"
        >
          <div className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-mute group-hover:text-primary group-hover:scale-110 transition-all">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
            Embark on a new mastery journey
          </span>
          <span className="text-xs text-mute max-w-xs">
            Generate with Prompt A, ask your favourite AI, and paste JSON.
          </span>
        </Link>
      </div>
    </div>
  );
}
