"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Copy,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Code2,
  AlertCircle,
  Clock,
  Sliders,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchSkillsWithRoadmaps, SkillWithRoadmap } from "@/lib/data/roadmaps";
import { createPlanWithChunk } from "@/lib/data/plans";
import { buildPromptB } from "@/lib/prompts";
import { validatePlanJson } from "@/lib/json-extract";
import { sampleSeedData } from "@/lib/data/sample-seed";

export default function NewPlanWizardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [skills, setSkills] = useState<SkillWithRoadmap[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [loadingSkills, setLoadingSkills] = useState(true);

  // Form parameters
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [horizonMonths, setHorizonMonths] = useState(12);
  const [dailyHours, setDailyHours] = useState(2);
  const [restDay, setRestDay] = useState("Sunday");
  const [tone, setTone] = useState<"english" | "hinglish">("english");
  const [customInstructions, setCustomInstructions] = useState("");

  // Paste & validation
  const [planJson, setPlanJson] = useState("");
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadRoadmaps() {
      setLoadingSkills(true);
      const supabase = isSupabaseConfigured() ? createClient() : null;
      const data = await fetchSkillsWithRoadmaps(supabase, user?.id);
      setSkills(data);
      if (data.length > 0) {
        setSelectedSkillId(data[0].id);
      }
      setLoadingSkills(false);
    }
    loadRoadmaps();
  }, [user]);

  const selectedSkill = useMemo(() => {
    return skills.find((s) => s.id === selectedSkillId) || skills[0] || null;
  }, [skills, selectedSkillId]);

  const calculatedDeadline = useMemo(() => {
    try {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + horizonMonths);
      return d.toISOString().split("T")[0];
    } catch {
      return todayStr;
    }
  }, [startDate, horizonMonths]);

  // Dynamically compile Prompt B
  const compiledPromptB = useMemo(() => {
    const roadmapData = selectedSkill?.roadmap?.data || sampleSeedData.roadmap;
    return buildPromptB({
      roadmapJson: roadmapData,
      startDate,
      deadline: calculatedDeadline,
      hoursPerDay: dailyHours,
      restDays: restDay,
      tone,
      customInstructions,
    });
  }, [selectedSkill, startDate, calculatedDeadline, dailyHours, restDay, tone, customInstructions]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(compiledPromptB);
      setCopied(true);
      toast.success("Prompt B copied! Paste it into your AI (ChatGPT, Claude, Gemini).");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

  // Live validation
  const validationResult = useMemo(() => {
    if (!planJson.trim()) return null;
    return validatePlanJson(planJson, selectedSkill?.roadmap?.data);
  }, [planJson, selectedSkill]);

  const handleLoadSample = () => {
    setPlanJson(JSON.stringify(sampleSeedData.plan, null, 2));
    toast.info("Loaded sample 30-day DSA plan JSON.");
  };

  const handleCreatePlan = async () => {
    if (!validationResult || !validationResult.ok || !validationResult.data) {
      toast.error("Please paste and validate a valid 30-day Plan JSON first.");
      return;
    }

    if (!selectedSkill) {
      toast.error("Please select a roadmap first.");
      return;
    }

    setCreating(true);
    try {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      const restDayIndex = restDay === "Sunday" ? [0] : restDay === "Saturday" ? [6] : [0];

      const newPlanId = await createPlanWithChunk({
        planPayload: validationResult.data,
        skillId: selectedSkill.id,
        roadmapId: selectedSkill.roadmap?.id || "sample-1",
        dailyMinutes: Math.round(dailyHours * 60),
        restDays: restDayIndex,
        supabase,
        userId: user?.id,
      });

      toast.success("30-Day Sprint Plan created successfully!");
      router.push(`/plans/${newPlanId}`);
    } catch (err: any) {
      toast.error(`Failed to create plan: ${err.message || "Unknown error"}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-mute mb-1">
            <Link href="/plans" className="hover:text-ink flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Daily Plans
            </Link>
            <span>/</span>
            <span>New Sprint</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-ink">
            Create 30-Day Sprint Plan
          </h2>
          <p className="text-xs text-ink2 mt-0.5">
            Phase 1 of Section 10: Compile Prompt B → Paste AI Output → Launch Chunk 1
          </p>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config & Prompt B */}
        <div className="lg:col-span-7 space-y-5">
          {/* Plan Parameters */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-ink">1. Configure Sprint Parameters</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Select Roadmap */}
              <div>
                <label className="block text-ink font-medium mb-1">Select Learning Roadmap</label>
                {loadingSkills ? (
                  <div className="h-10 rounded-md bg-bg border border-line animate-pulse" />
                ) : (
                  <select
                    value={selectedSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {skills.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.level} • {s.roadmap?.data?.stages?.length || 4} Stages)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Start Date & Horizon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink font-medium mb-1">Sprint Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-ink font-medium mb-1">Target Horizon</label>
                  <select
                    value={horizonMonths}
                    onChange={(e) => setHorizonMonths(parseInt(e.target.value))}
                    className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value={1}>1 Month (Sprint focus)</option>
                    <option value={3}>3 Months (Fast track)</option>
                    <option value={6}>6 Months (Standard)</option>
                    <option value={12}>1 Year (Deep Mastery)</option>
                  </select>
                </div>
              </div>

              {/* Daily Hours Slider & Rest Day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-ink font-medium">Daily Study Time</label>
                    <span className="font-mono text-primary font-bold">{dailyHours.toFixed(1)} hrs/day</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="0.5"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-lg bg-bg border border-line accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-mute font-mono mt-1">
                    <span>1.0h</span>
                    <span>3.0h</span>
                    <span>6.0h</span>
                  </div>
                </div>

                <div>
                  <label className="block text-ink font-medium mb-1">Rest Day (Gentle Review)</label>
                  <select
                    value={restDay}
                    onChange={(e) => setRestDay(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Sunday">Sunday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Friday">Friday</option>
                    <option value="None">No rest days</option>
                  </select>
                </div>
              </div>

              {/* Tone Toggle */}
              <div>
                <label className="block text-ink font-medium mb-1">Prompt Language Tone</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTone("english")}
                    className={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
                      tone === "english"
                        ? "bg-primary text-white border-primary"
                        : "bg-bg text-ink border-line hover:border-primary/50"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setTone("hinglish")}
                    className={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
                      tone === "hinglish"
                        ? "bg-primary text-white border-primary"
                        : "bg-bg text-ink border-line hover:border-primary/50"
                    }`}
                  >
                    Hinglish (Hindi in Roman script)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Compiled Prompt B Box */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink">2. Copy Prompt B</h3>
              </div>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Prompt B"}</span>
              </button>
            </div>

            <div className="rounded-md bg-[#0F172A] p-4 text-slate-200 text-xs font-mono max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
              {compiledPromptB}
            </div>
            <p className="text-[11px] text-mute">
              Paste this prompt into ChatGPT, Claude, or Gemini. The prompt requests only the first 30 days formatted in strict JSON.
            </p>
          </div>
        </div>

        {/* Right Column: Paste & Validate */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink">3. Paste AI Plan JSON</h3>
              </div>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-primary hover:underline font-medium"
              >
                Load Sample Plan
              </button>
            </div>

            <textarea
              value={planJson}
              onChange={(e) => setPlanJson(e.target.value)}
              placeholder="Paste the raw JSON returned from your AI here (with or without ```json code fences)..."
              className="w-full h-56 p-3 rounded-md bg-bg border border-line text-ink font-mono text-xs focus:outline-none focus:border-primary resize-none leading-relaxed"
            />

            {/* Live Diagnostic Feedback */}
            {validationResult && (
              <div
                className={`p-3.5 rounded-md border text-xs space-y-2 ${
                  validationResult.ok
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  {validationResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span>
                    {validationResult.ok
                      ? `Valid 30-Day Plan (${validationResult.stats.dayCount} days, ${validationResult.stats.taskCount} tasks, ~${Math.round(
                          (validationResult.stats.totalMinutes || 0) / 60
                        )} total hours)`
                      : "Validation Errors Detected"}
                  </span>
                </div>

                {validationResult.errors.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90 pl-1">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}

                {validationResult.warnings.length > 0 && (
                  <div className="pt-1 text-[11px] text-amber-700 dark:text-amber-400 space-y-1">
                    <span className="font-semibold">Notes:</span>
                    <ul className="list-disc list-inside pl-1">
                      {validationResult.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Create Action */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-line">
              <Link
                href="/plans"
                className="px-3.5 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleCreatePlan}
                disabled={!validationResult?.ok || creating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
              >
                {creating ? "Creating..." : "Create 30-Day Plan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
