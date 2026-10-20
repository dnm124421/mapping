import {
  TrendingUp,
  Clock,
  Flame,
  Calendar,
  Download,
  Filter,
} from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">
            History & Progress
          </h2>
          <p className="text-xs text-ink2">
            Long-term consistency telemetry, activity heatmap, and archived chunks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select className="h-9 px-3 rounded-md bg-surface border border-line text-xs text-ink focus:outline-none focus:border-primary">
            <option>Last 90 Days</option>
            <option>Last 30 Days</option>
            <option>All Time</option>
          </select>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-mute" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Total Study Time</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">48.5h</p>
          <span className="text-[11px] text-mute">Across all skills</span>
        </div>
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Longest Streak</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">14 days</p>
          <span className="text-[11px] text-mute">Personal best</span>
        </div>
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">On-time Velocity</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            94%
          </p>
          <span className="text-[11px] text-mute">Tasks on scheduled day</span>
        </div>
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Best Study Window</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">Morning</p>
          <span className="text-[11px] text-mute">8:00 AM - 10:30 AM</span>
        </div>
      </div>

      {/* 90-Day Activity Matrix (Heatmap preview) */}
      <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">90-Day Consistency Matrix</h3>
          <div className="flex items-center gap-1.5 text-[10px] text-mute">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-line" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary/30" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
            <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto py-2">
          {Array.from({ length: 91 }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-sm transition-colors ${
                i % 4 === 0
                  ? "bg-primary"
                  : i % 3 === 0
                  ? "bg-primary/50"
                  : i % 2 === 0
                  ? "bg-primary/20"
                  : "bg-line/50"
              }`}
              title={`Day ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
