"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Copy,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Code2,
} from "lucide-react";
import { toast } from "sonner";

export default function NewPlanWizardPage() {
  const [copied, setCopied] = useState(false);
  const [deadline, setDeadline] = useState("1-year");
  const [dailyHours, setDailyHours] = useState(2);
  const [planJson, setPlanJson] = useState("");

  const handleCopyPrompt = () => {
    setCopied(true);
    toast.success("Prompt B copied! Paste it into your AI.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-mute mb-1">
            <Link href="/plans" className="hover:text-ink flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Plans
            </Link>
            <span>/</span>
            <span>New</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ink">
            Create 30-Day Sprint Plan
          </h2>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config & Prompt B */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-ink">Plan Parameters</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-ink font-medium mb-1">Select Roadmap</label>
                <select className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary">
                  <option>DSA in C++ (Beginner • 4 Stages)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink font-medium mb-1">Target Horizon</label>
                  <select
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="30-days">30 Days (Sprint)</option>
                    <option value="3-months">3 Months</option>
                    <option value="6-months">6 Months</option>
                    <option value="1-year">1 Year (Mastery)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ink font-medium mb-1">Daily Study Time: {dailyHours}h</label>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="0.5"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Prompt B Box */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink">Prompt B: First 30 Days</h3>
              </div>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? "Copied!" : "Copy Ready Prompt"}</span>
              </button>
            </div>

            <div className="rounded-md bg-[#0F172A] p-4 text-slate-200 text-xs font-mono overflow-x-auto space-y-1">
              <p>You are a study planner. Below is my learning roadmap (JSON) and my deadline.</p>
              <p>Start date: 2026-11-02 • Daily study time: {dailyHours} hours</p>
              <p className="text-slate-400 pt-2">// Create ONLY the FIRST 30 DAYS in detail (days 1 to 30).</p>
            </div>
          </div>
        </div>

        {/* Right Column: Paste & Create */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Paste 30-Day Plan JSON</h3>
              <button
                type="button"
                onClick={() =>
                  setPlanJson(
                    '{\n  "skill": "DSA in C++",\n  "start_date": "2026-11-02",\n  "deadline": "2027-11-02",\n  "chunk": { "number": 1, "from_day": 1, "to_day": 30 },\n  "days": [\n    {\n      "day": 1,\n      "date": "2026-11-02",\n      "focus": "Variables and I/O",\n      "tasks": [\n        { "title": "Watch: C++ data types", "est_minutes": 40, "roadmap_ref": "1.1", "kind": "learn" }\n      ]\n    }\n  ]\n}'
                  )
                }
                className="text-xs text-primary hover:underline font-medium"
              >
                Load Sample Plan
              </button>
            </div>

            <textarea
              value={planJson}
              onChange={(e) => setPlanJson(e.target.value)}
              placeholder="Paste the raw Plan JSON returned from your AI here..."
              className="w-full h-48 p-3 rounded-md bg-bg border border-line text-ink font-mono text-xs focus:outline-none focus:border-primary resize-none"
            />

            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                href="/plans"
                className="px-3.5 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={() => toast.success("Plan validated and created! (Phase 4 will connect to Supabase)")}
                className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
              >
                Create 30-Day Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
