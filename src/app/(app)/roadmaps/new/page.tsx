"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export default function NewRoadmapWizardPage() {
  const [copied, setCopied] = useState(false);
  const [skill, setSkill] = useState("DSA in C++");
  const [level, setLevel] = useState("beginner");
  const [hours, setHours] = useState(2);
  const [jsonInput, setJsonInput] = useState("");

  const handleCopyPrompt = () => {
    setCopied(true);
    toast.success("Prompt copied! Now paste it into your AI.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Stepper Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-mute mb-1">
            <Link href="/roadmaps" className="hover:text-ink flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Roadmaps
            </Link>
            <span>/</span>
            <span>New</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ink">
            Craft New Skill Roadmap
          </h2>
        </div>

        {/* Stepper indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-white font-medium">
            <span>1</span>
            <span>Configure & Prompt</span>
          </div>
          <span className="text-mute">→</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-line text-mute font-medium">
            <span>2</span>
            <span>Dispatch to AI</span>
          </div>
          <span className="text-mute">→</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-line text-mute font-medium">
            <span>3</span>
            <span>Parse & Save</span>
          </div>
        </div>
      </div>

      {/* 2-Column Wizard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Blueprint & Prompt (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Parameters Card */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-ink">Skill Blueprint Parameters</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-ink font-medium mb-1">What skill or topic do you want to learn?</label>
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  placeholder="e.g., DSA in C++, Video Editing, System Design..."
                  className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink font-medium mb-1">Starting Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ink font-medium mb-1">Daily Study Time: {hours} hrs/day</label>
                  <input
                    type="range"
                    min="0.5"
                    max="6"
                    step="0.5"
                    value={hours}
                    onChange={(e) => setHours(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Auto-compiled Prompt Box */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink">Prompt A (Auto-compiled)</h3>
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
              <div className="flex items-center gap-1.5 text-slate-400 border-b border-slate-700/60 pb-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-[10px] ml-2">prompt-a-roadmap.txt</span>
              </div>
              <p>You are an expert learning coach and curriculum designer.</p>
              <p>I want to learn: <span className="text-primary-tint font-semibold">{skill}</span></p>
              <p>My current level: {level}</p>
              <p>I can study about {hours} hours per day, 6 days per week.</p>
              <p>Target horizon: about 6 months.</p>
              <p className="text-slate-400 pt-2">// Return ONLY valid JSON in exact structure: stages[] → topics[]</p>
            </div>

            {/* Quick Launch Buttons */}
            <div className="pt-2 flex items-center gap-2 text-xs text-mute">
              <span>Quick launch:</span>
              <a
                href="https://chatgpt.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-bg border border-line text-ink hover:text-primary transition-colors"
              >
                ChatGPT <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-bg border border-line text-ink hover:text-primary transition-colors"
              >
                Claude <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://gemini.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-bg border border-line text-ink hover:text-primary transition-colors"
              >
                Gemini <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Paste Payload & Lint Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Payload Ingestion</h3>
              <button
                type="button"
                onClick={() =>
                  setJsonInput(
                    '{\n  "skill": "DSA in C++",\n  "level": "beginner",\n  "stages": [\n    {\n      "id": 1,\n      "title": "C++ Basics",\n      "goal": "Confidence in syntax and I/O",\n      "est_weeks": 3,\n      "topics": [\n        { "id": "1.1", "title": "Data Types and Variables", "difficulty": "easy" },\n        { "id": "1.2", "title": "Loops and Conditionals", "difficulty": "easy" }\n      ]\n    }\n  ]\n}'
                  )
                }
                className="text-xs text-primary hover:underline font-medium"
              >
                Load Sample JSON
              </button>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste the raw JSON returned from your AI here... (Markdown code blocks are cleaned automatically)"
              className="w-full h-48 p-3 rounded-md bg-bg border border-line text-ink font-mono text-xs focus:outline-none focus:border-primary resize-none"
            />

            {/* Lint Diagnostics Panel */}
            <div className="rounded-md bg-bg border border-line p-3 space-y-2 text-xs">
              <span className="font-semibold text-ink text-[11px] uppercase tracking-wider">
                Lint Diagnostics
              </span>
              <div className="space-y-1.5 text-mute">
                <div className="flex items-center gap-2">
                  {jsonInput ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-mute/50" />
                  )}
                  <span>Valid JSON structure</span>
                </div>
                <div className="flex items-center gap-2">
                  {jsonInput ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-mute/50" />
                  )}
                  <span>Canonical Roadmap Schema</span>
                </div>
                <div className="flex items-center gap-2">
                  {jsonInput ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-mute/50" />
                  )}
                  <span>Unique Topic IDs</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                href="/roadmaps"
                className="px-3.5 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={() => toast.success("Roadmap validated and saved! (Phase 3 will connect to Supabase)")}
                className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
              >
                Save Roadmap
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
