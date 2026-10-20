import Link from "next/link";
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Copy,
  Code2,
} from "lucide-react";

export default function ChunkEndRitualPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-mute border-b border-line pb-4">
        <Link href="/plans/sample-1" className="hover:text-ink flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Today's Focus
        </Link>
        <span>/</span>
        <span>Chunk End Ritual</span>
      </div>

      {/* Hero Celebration Card */}
      <div className="rounded-lg bg-gradient-to-r from-emerald-500/10 via-surface to-primary/10 border border-emerald-500/20 p-6 shadow-card space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Chunk 1 Complete!</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          30 din pure! Har din thoda thoda, kaam ho gaya.
        </h2>
        <p className="text-xs text-ink2 max-w-xl">
          You finished the first 30-day sprint chunk. That took real consistency. Review your progress below and generate Prompt C for the next chunk.
        </p>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Completion Rate</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">92%</p>
          <span className="text-[11px] text-mute">55 of 60 tasks</span>
        </div>
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Total Focus Time</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">48.5h</p>
          <span className="text-[11px] text-mute">Across 30 days</span>
        </div>
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Topics Mastered</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">4</p>
          <span className="text-[11px] text-mute">Stage 1 finished</span>
        </div>
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Rescheduled & Finished</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">5</p>
          <span className="text-[11px] text-mute">Forgiveness buffer used</span>
        </div>
      </div>

      {/* 2-Column: Reflection & Prompt C */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Proof of Work & Reflection */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <h3 className="text-sm font-semibold text-ink">Sprint Reflection Note</h3>
            <p className="text-xs text-mute">
              What went well? Any topics that need revision or felt tricky?
            </p>
            <textarea
              placeholder="e.g., Pointers were tough, need more practice drills in the next chunk..."
              className="w-full h-32 p-3 rounded-md bg-bg border border-line text-xs text-ink focus:outline-none focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Right: Next Sprint Pipeline (Prompt C) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink">Prompt C: Ready for Chunk 2</h3>
              </div>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Prompt C</span>
              </button>
            </div>

            <div className="rounded-md bg-[#0F172A] p-4 text-slate-200 text-xs font-mono overflow-x-auto space-y-1">
              <p>My previous 30-day chunk is finished. Create the NEXT 30 days of my plan.</p>
              <p>PROGRESS SO FAR: 92% completion • Topics completed: 1.1, 1.2, 1.3</p>
              <p className="text-slate-400 pt-2">// Return ONLY valid JSON for days 31 to 60.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
