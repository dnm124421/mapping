import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  CalendarDays,
  Download,
  MoreVertical,
  BookOpen,
  Sparkles,
  Copy,
} from "lucide-react";

export default function RoadmapDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-mute">
            <Link href="/roadmaps" className="hover:text-ink flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Roadmaps
            </Link>
            <span>/</span>
            <span>DSA in C++</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              DSA in C++
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
              Beginner
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/plans/new?roadmap=sample-1"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Create 30-Day Plan</span>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Layout: Accordion (8 cols) + Dossier (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stages Accordion */}
        <div className="lg:col-span-8 space-y-4">
          {/* Stage 1: Active/In Progress */}
          <div className="rounded-lg bg-surface border border-line overflow-hidden shadow-card">
            <div className="p-4 bg-primary-tint/30 dark:bg-primary-tint/10 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Stage 1: C++ Foundations
                  </h3>
                  <p className="text-xs text-ink2">
                    Goal: Write small C++ programs confidently • Est. 3 weeks
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-primary">
                0 / 3 Done
              </span>
            </div>

            {/* Topic Rows */}
            <div className="divide-y divide-line p-2">
              <div className="p-3 flex items-center justify-between rounded-md hover:bg-bg transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-medium text-ink block">
                      1.1 Variables, data types and I/O
                    </span>
                    <span className="text-[11px] text-mute">
                      subtopics: int, float, char, bool • cin and cout
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Easy
                </span>
              </div>

              <div className="p-3 flex items-center justify-between rounded-md hover:bg-bg transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-medium text-ink block">
                      1.2 Control flow and functions
                    </span>
                    <span className="text-[11px] text-mute">
                      subtopics: if/else, loops, functions and scope
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Easy
                </span>
              </div>

              <div className="p-3 flex items-center justify-between rounded-md hover:bg-bg transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-medium text-ink block">
                      1.3 Pointers and references
                    </span>
                    <span className="text-[11px] text-mute">
                      subtopics: pointer basics, dynamic memory
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Medium
                </span>
              </div>
            </div>
          </div>

          {/* Stage 2: Locked visually */}
          <div className="rounded-lg bg-surface border border-line p-4 shadow-card opacity-75 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-line text-mute flex items-center justify-center font-bold text-xs">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Stage 2: Core Data Structures
                </h3>
                <p className="text-xs text-mute">
                  Goal: Arrays, lists, stacks and queues • Est. 4 weeks
                </p>
              </div>
            </div>
            <span className="text-xs text-mute">Locked</span>
          </div>

          {/* Stage 3: Locked */}
          <div className="rounded-lg bg-surface border border-line p-4 shadow-card opacity-75 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-line text-mute flex items-center justify-center font-bold text-xs">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Stage 3: Trees and Graphs
                </h3>
                <p className="text-xs text-mute">
                  Goal: Binary trees, BST, BFS, DFS • Est. 4 weeks
                </p>
              </div>
            </div>
            <span className="text-xs text-mute">Locked</span>
          </div>
        </div>

        {/* Right Column: Study Dossier (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4 sticky top-20">
            <div className="flex items-center gap-2 border-b border-line pb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-ink">Study Dossier</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-mute block text-[11px]">Selected Topic</span>
                <span className="font-semibold text-ink">1.1 Variables, data types and I/O</span>
              </div>

              <div>
                <span className="text-mute block text-[11px] mb-1">Personal Notes</span>
                <textarea
                  placeholder="Add notes for this topic (autosaved)..."
                  className="w-full h-24 p-2.5 rounded-md bg-bg border border-line text-xs text-ink focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* AI Doubt Assistant */}
              <div className="rounded-md bg-bg border border-line p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-primary font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Doubt Prompt</span>
                  </div>
                  <button
                    type="button"
                    className="text-[11px] text-mute hover:text-ink flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <p className="text-[11px] text-mute font-mono bg-surface p-2 rounded border border-line">
                  "Explain Variables & Data Types in C++ using a simple real-life analogy..."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
