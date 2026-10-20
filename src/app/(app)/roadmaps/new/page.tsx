"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createNewRoadmap } from "@/lib/data/roadmaps";
import { buildPromptA } from "@/lib/prompts";
import { validateRoadmapJson, ValidationResult } from "@/lib/json-extract";
import { Roadmap } from "@/lib/schemas";
import { sampleSeedData } from "@/lib/data/sample-seed";
import { toast } from "sonner";

export default function NewRoadmapWizardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  // Wizard state
  const [skill, setSkill] = useState("DSA in C++");
  const [level, setLevel] = useState("beginner");
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [daysPerWeek, setDaysPerWeek] = useState(6);
  const [horizonMonths, setHorizonMonths] = useState(6);
  const [balance, setBalance] = useState("theory and interview practice");
  const [customInstructions, setCustomInstructions] = useState("");

  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Live Auto-compiled Prompt A
  const compiledPrompt = useMemo(() => {
    return buildPromptA({
      skill,
      level,
      hoursPerDay,
      daysPerWeek,
      horizonMonths,
      balance,
      customInstructions,
      tone: profile?.settings?.tone || "english",
    });
  }, [skill, level, hoursPerDay, daysPerWeek, horizonMonths, balance, customInstructions, profile]);

  // Real-time validation result
  const validation: ValidationResult<Roadmap> | null = useMemo(() => {
    if (!jsonInput.trim()) return null;
    return validateRoadmapJson(jsonInput);
  }, [jsonInput]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(compiledPrompt);
      setCopied(true);
      toast.success("Prompt copied! Now paste it into your AI.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not access clipboard. Please select and copy manually.");
    }
  };

  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(sampleSeedData.roadmap, null, 2));
    toast.info("Loaded sample roadmap data from Appendix A.");
  };

  const handleSave = async (andCreatePlan = false) => {
    if (!validation || !validation.ok || !validation.data) {
      toast.error("Please paste and validate your roadmap JSON before saving.");
      return;
    }

    setSaving(true);
    try {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      const { roadmapId } = await createNewRoadmap(
        validation.data,
        Math.round(hoursPerDay * 60),
        supabase,
        user?.id
      );

      toast.success("Roadmap saved successfully!");
      if (andCreatePlan) {
        router.push(`/plans/new?roadmap=${roadmapId}`);
      } else {
        router.push(`/roadmaps/${roadmapId}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save roadmap.");
      setSaving(false);
    }
  };

  // Determine current active stepper step
  const currentStep = !copied && !jsonInput ? 1 : !validation?.ok ? 2 : 3;

  return (
    <div className="space-y-6">
      {/* Header & Stepper */}
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

        {/* 3-Step Stepper */}
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-colors ${
              currentStep === 1
                ? "bg-primary text-white shadow-sm"
                : "bg-surface border border-line text-mute"
            }`}
          >
            <span>1</span>
            <span>Configure & Prompt</span>
          </div>
          <span className="text-mute">→</span>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-colors ${
              currentStep === 2
                ? "bg-primary text-white shadow-sm"
                : currentStep > 2
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-surface border border-line text-mute"
            }`}
          >
            <span>2</span>
            <span>Dispatch to AI</span>
          </div>
          <span className="text-mute">→</span>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-colors ${
              currentStep === 3
                ? validation?.ok
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-rose-500 text-white shadow-sm"
                : "bg-surface border border-line text-mute"
            }`}
          >
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
            <div className="flex items-center gap-2 border-b border-line pb-2.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-ink">Skill Blueprint Parameters</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-ink font-medium mb-1">
                  What skill or curriculum do you want to master?
                </label>
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  placeholder="e.g. DSA in C++, Video Editing, System Design..."
                  className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink font-medium mb-1">Starting Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary capitalize"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ink font-medium mb-1">
                    Daily Study Time: <strong>{hoursPerDay} hrs/day</strong>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-primary cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink font-medium mb-1">Days per week</label>
                  <select
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
                    className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                  >
                    <option value={5}>5 days / week</option>
                    <option value={6}>6 days / week (1 rest day)</option>
                    <option value={7}>7 days / week</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ink font-medium mb-1">Target Horizon</label>
                  <select
                    value={horizonMonths}
                    onChange={(e) => setHorizonMonths(parseInt(e.target.value))}
                    className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                  >
                    <option value={1}>1 month (Intensive)</option>
                    <option value={3}>3 months (Quarter)</option>
                    <option value={6}>6 months (Standard)</option>
                    <option value={12}>12 months (Comprehensive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-ink font-medium mb-1">Pedagogical Balance</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    "Practical projects & drills",
                    "Interview prep & problem solving",
                    "Deep conceptual theory",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setBalance(chip)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors ${
                        balance === chip
                          ? "bg-primary text-white border-primary"
                          : "bg-bg text-ink2 border-line hover:border-primary/50"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Auto-compiled Prompt A Box */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink">Prompt A (Live Auto-Compiled)</h3>
              </div>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? "Copied!" : "Copy Ready Prompt"}</span>
              </button>
            </div>

            <div className="rounded-md bg-[#0F172A] p-4 text-slate-200 text-xs font-mono overflow-x-auto space-y-1.5 max-h-64">
              <div className="flex items-center gap-1.5 text-slate-400 border-b border-slate-700/60 pb-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-[10px] ml-2">prompt-a-roadmap.txt</span>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
                {compiledPrompt}
              </pre>
            </div>

            {/* Quick Launch Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-mute">
              <span>Quick launch in your AI:</span>
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

        {/* Right Column: Ingestion, Lint Panel & Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Payload Ingestion</h3>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-primary hover:underline font-medium"
              >
                Test Sample Data
              </button>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste the raw JSON returned from your AI here... (Markdown code blocks are cleaned automatically)"
              className="w-full h-52 p-3 rounded-md bg-bg border border-line text-ink font-mono text-xs focus:outline-none focus:border-primary resize-none"
            />

            {/* Lint Diagnostics Panel */}
            <div className="rounded-md bg-bg border border-line p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink text-[11px] uppercase tracking-wider">
                  Lint Diagnostics
                </span>
                {validation?.ok && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Validated Clean
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                {/* 1. Valid JSON */}
                <div className="flex items-center gap-2">
                  {!validation ? (
                    <div className="w-3.5 h-3.5 rounded-full border border-mute/50" />
                  ) : validation.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                  )}
                  <span className={validation?.ok ? "text-ink font-medium" : "text-mute"}>
                    Valid JSON syntax
                  </span>
                </div>

                {/* 2. Canonical Schema */}
                <div className="flex items-center gap-2">
                  {!validation ? (
                    <div className="w-3.5 h-3.5 rounded-full border border-mute/50" />
                  ) : validation.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                  )}
                  <span className={validation?.ok ? "text-ink font-medium" : "text-mute"}>
                    Canonical Roadmap Schema (2–8 stages)
                  </span>
                </div>

                {/* 3. Stage & Topic counts */}
                {validation?.ok && (
                  <div className="pt-1 text-[11px] text-mute space-y-1 border-t border-line/60">
                    <p>• Stages found: <strong>{validation.stats.stageCount}</strong> (Est. {validation.stats.totalWeeks} weeks total)</p>
                    <p>• Topics found: <strong>{validation.stats.topicCount}</strong> topics</p>
                  </div>
                )}

                {/* Errors display */}
                {validation && !validation.ok && (
                  <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] space-y-1 mt-2">
                    <span className="font-semibold block">Issues to fix:</span>
                    {validation.errors.map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                    <div className="pt-1 text-[10px] text-mute">
                      Tip: Ask your AI: "Return only valid JSON, no extra text."
                    </div>
                  </div>
                )}

                {/* Warnings display */}
                {validation?.ok && validation.warnings.length > 0 && (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] space-y-0.5">
                    {validation.warnings.map((w, i) => (
                      <p key={i}>Notice: {w}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stage 1 Preview Card */}
            {validation?.ok && validation.data && (
              <div className="rounded-md border border-line bg-surface p-3.5 space-y-2 text-xs animate-in fade-in-50">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                  Stage 1 Preview: {validation.data.stages[0]?.title}
                </span>
                <p className="text-[11px] text-ink2">
                  Goal: {validation.data.stages[0]?.goal || "Complete stage topics"}
                </p>
                <div className="space-y-1 pt-1">
                  {validation.data.stages[0]?.topics.slice(0, 3).map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between text-[11px] text-ink py-0.5">
                      <span>• {topic.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-bg border border-line capitalize">
                        {topic.difficulty || "medium"}
                      </span>
                    </div>
                  ))}
                  {validation.data.stages[0]?.topics.length > 3 && (
                    <span className="text-[10px] text-mute">
                      ...and {validation.data.stages[0].topics.length - 3} more topics in Stage 1
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-line flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <Link
                href="/roadmaps"
                className="w-full sm:w-auto text-center px-3.5 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="button"
                disabled={!validation?.ok || saving}
                onClick={() => handleSave(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-md bg-surface border border-line hover:bg-bg disabled:opacity-50 text-ink text-xs font-semibold transition-colors"
              >
                {saving ? "Saving..." : "Save Roadmap"}
              </button>
              <button
                type="button"
                disabled={!validation?.ok || saving}
                onClick={() => handleSave(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Save & Create 30-Day Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
