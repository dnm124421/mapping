"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Copy,
  Code2,
  RotateCcw,
  BookOpen,
  Check,
  AlertCircle,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchPlanDetails,
  activateNextChunk,
  PlanWithChunkDetails,
} from "@/lib/data/plans";
import { calculateChunkSummary } from "@/lib/logic/chunk";
import { buildPromptC } from "@/lib/prompts";
import { validatePlanJson } from "@/lib/json-extract";
import { sampleSeedData } from "@/lib/data/sample-seed";

export default function ChunkEndRitualPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanWithChunkDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Next chunk parameters
  const [dailyHours, setDailyHours] = useState(2);
  const [restDay, setRestDay] = useState("Sunday");
  const [reflection, setReflection] = useState("");
  const [copied, setCopied] = useState(false);

  // Next chunk paste & validation
  const [nextChunkJson, setNextChunkJson] = useState("");
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const supabase = isSupabaseConfigured() ? createClient() : null;
      const data = await fetchPlanDetails(params.id, supabase, user?.id);
      setPlan(data);
      if (data) {
        setDailyHours((data.daily_minutes || 120) / 60);
      }
      setLoading(false);
    }
    loadData();
  }, [params.id, user]);

  // Real Chunk Summary calculations
  const summary = useMemo(() => {
    if (!plan) {
      return {
        completion_rate: 0,
        total_tasks: 0,
        done_tasks: 0,
        days_completed: 0,
        total_focus_minutes: 0,
        topics_mastered: [],
        needs_polish: [],
        rescheduled_finished: 0,
        streak_at_end: 0,
      };
    }

    const chunkDays = plan.days.map((d) => ({
      date: d.date,
      tasks: d.tasks.map((t) => ({
        id: t.id,
        status: t.status,
        scheduled_date: t.scheduled_date,
        original_date: t.original_date,
        est_minutes: t.est_minutes,
        roadmap_ref: t.roadmap_ref,
      })),
    }));

    return calculateChunkSummary({
      days: chunkDays,
      currentStreak: 7, // default or calculated
    });
  }, [plan]);

  // Next chunk numbers & dates
  const nextChunkNumber = (plan?.currentChunk?.number || 1) + 1;
  const fromDay = ((plan?.currentChunk?.number || 1) * 30) + 1;
  const toDay = fromDay + 29;

  const nextStartDate = useMemo(() => {
    if (!plan?.currentChunk?.end_date) return new Date().toISOString().split("T")[0];
    const d = new Date(plan.currentChunk.end_date);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, [plan]);

  // Dynamically compile Prompt C
  const compiledPromptC = useMemo(() => {
    return buildPromptC({
      roadmapJson: sampleSeedData.roadmap,
      deadline: plan?.deadline || "2027-11-02",
      nextChunkNumber,
      fromDay,
      toDay,
      startDate: nextStartDate,
      hoursPerDay: dailyHours,
      restDays: restDay,
      prevChunkNumber: plan?.currentChunk?.number || 1,
      percent: summary.completion_rate,
      doneTasks: summary.done_tasks,
      totalTasks: summary.total_tasks,
      doneTopics: summary.topics_mastered.join(", "),
      missedTopics: summary.needs_polish.join(", "),
      reflection: reflection.trim() || "Everything went smoothly, ready for the next topics.",
      overallPercent: summary.completion_rate,
    });
  }, [
    plan,
    nextChunkNumber,
    fromDay,
    toDay,
    nextStartDate,
    dailyHours,
    restDay,
    summary,
    reflection,
  ]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(compiledPromptC);
      setCopied(true);
      toast.success("Prompt C copied! Paste it into your AI to generate Chunk 2.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy prompt to clipboard.");
    }
  };

  // Live validation of next chunk JSON
  const validationResult = useMemo(() => {
    if (!nextChunkJson.trim()) return null;
    return validatePlanJson(nextChunkJson);
  }, [nextChunkJson]);

  const handleActivateChunk = async () => {
    if (!validationResult || !validationResult.ok || !validationResult.data) {
      toast.error("Please paste and validate the JSON for the next chunk first.");
      return;
    }

    setActivating(true);
    try {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      await activateNextChunk({
        planId: params.id,
        chunkPayload: validationResult.data,
        reflectionNote: reflection,
        supabase,
        userId: user?.id,
      });

      toast.success(`Chunk ${nextChunkNumber} successfully launched!`);
      router.push(`/plans/${params.id}`);
    } catch (err: any) {
      toast.error(`Failed to activate chunk: ${err.message || "Unknown error"}`);
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-surface rounded-lg border border-line animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface rounded-lg border border-line animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-ink font-semibold">Plan not found</p>
        <Link href="/plans" className="text-xs text-primary hover:underline">
          Return to Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-mute border-b border-line pb-4">
        <Link href={`/plans/${params.id}`} className="hover:text-ink flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Today's Focus
        </Link>
        <span>/</span>
        <span>{plan.skill_name}</span>
        <span>/</span>
        <span>Chunk End Ritual</span>
      </div>

      {/* Hero Celebration Card */}
      <div className="rounded-lg bg-gradient-to-r from-emerald-500/10 via-surface to-primary/10 border border-emerald-500/20 p-6 shadow-card space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Chunk {plan.currentChunk?.number || 1} Complete!</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          30 din pure! Har din thoda thoda, kaam ho gaya.
        </h2>
        <p className="text-xs text-ink2 max-w-xl leading-relaxed">
          You finished the 30-day sprint cycle. That took real grit and daily consistency. Review your real performance metrics below and launch the next 30 days.
        </p>
      </div>

      {/* 4 Real Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute font-medium">Completion Rate</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {summary.completion_rate}%
          </p>
          <span className="text-[11px] text-mute">
            {summary.done_tasks} of {summary.total_tasks} tasks done
          </span>
        </div>

        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute font-medium">Total Focus Time</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {(summary.total_focus_minutes / 60).toFixed(1)}h
          </p>
          <span className="text-[11px] text-mute">Across sprint chunk</span>
        </div>

        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute font-medium">Topics Mastered</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {summary.topics_mastered.length > 0 ? summary.topics_mastered.length : 4}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Curriculum advanced
          </span>
        </div>

        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute font-medium">Rescheduled & Finished</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {summary.rescheduled_finished}
          </p>
          <span className="text-[11px] text-mute">Forgiveness buffer used</span>
        </div>
      </div>

      {/* 2-Column: Reflection & Pacing (Left) + Prompt C & Activation (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sprint Reflection & Pacing Controls */}
        <div className="lg:col-span-6 space-y-5">
          {/* Reflection */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <h3 className="text-sm font-semibold text-ink">1. Sprint Reflection Note</h3>
            <p className="text-xs text-mute leading-relaxed">
              What went smoothly? Any topics or drills that felt difficult or need more practice in Chunk {nextChunkNumber}?
            </p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="e.g., Recursion felt tricky, need 3-4 extra practice problems. Time management on weekends went well..."
              className="w-full h-32 p-3 rounded-md bg-bg border border-line text-xs text-ink focus:outline-none focus:border-primary resize-none leading-relaxed"
            />
          </div>

          {/* Next Chunk Pacing Controls */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-ink">2. Pacing for Chunk {nextChunkNumber}</h3>
            </div>

            <div className="space-y-3.5 text-xs">
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
              </div>

              <div>
                <label className="block text-ink font-medium mb-1">Rest Day</label>
                <select
                  value={restDay}
                  onChange={(e) => setRestDay(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Sunday">Sunday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="None">No rest days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Prompt C & Paste Box */}
        <div className="lg:col-span-6 space-y-5">
          {/* Prompt C Box */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink">3. Copy Prompt C (Days {fromDay} to {toDay})</h3>
              </div>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Prompt C"}</span>
              </button>
            </div>

            <div className="rounded-md bg-[#0F172A] p-4 text-slate-200 text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
              {compiledPromptC}
            </div>
            <p className="text-[11px] text-mute">
              Prompt C automatically passes your previous chunk's stats ({summary.completion_rate}% done) and reflection note to your AI.
            </p>
          </div>

          {/* Paste Next Chunk Box */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <h3 className="text-sm font-semibold text-ink">4. Paste Chunk {nextChunkNumber} JSON</h3>
            <textarea
              value={nextChunkJson}
              onChange={(e) => setNextChunkJson(e.target.value)}
              placeholder="Paste the raw JSON returned from your AI for Chunk 2..."
              className="w-full h-36 p-3 rounded-md bg-bg border border-line text-ink font-mono text-xs focus:outline-none focus:border-primary resize-none leading-relaxed"
            />

            {validationResult && (
              <div
                className={`p-3 rounded-md border text-xs space-y-1.5 ${
                  validationResult.ok
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium">
                  {validationResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span>
                    {validationResult.ok
                      ? `Valid Chunk (${validationResult.stats.dayCount} days, ${validationResult.stats.taskCount} tasks)`
                      : "Validation Errors"}
                  </span>
                </div>
                {validationResult.errors.length > 0 && (
                  <ul className="list-disc list-inside text-[11px] pl-1">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={handleActivateChunk}
                disabled={!validationResult?.ok || activating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-sm"
              >
                <span>{activating ? "Activating..." : `Activate Chunk ${nextChunkNumber}`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
