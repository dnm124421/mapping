"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  CheckCircle2,
  Copy,
  Plus,
  HelpCircle,
  Clock,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchTaskById,
  logFocusSession,
  toggleTaskStatus,
  PlanTaskItem,
} from "@/lib/data/plans";
import { buildFocusDoubtPrompt } from "@/lib/prompts";

export default function FocusModePage({
  params,
}: {
  params: { taskId: string };
}) {
  const router = useRouter();
  const { user } = useAuth();

  const [taskData, setTaskData] = useState<{
    task: PlanTaskItem;
    skillName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Timer state (Tab-sleep safe with target timestamp)
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Modal celebration
  const [isFinishedModalOpen, setIsFinishedModalOpen] = useState(false);

  // Checklist tracking
  const [checklist, setChecklist] = useState<Array<{ text: string; done?: boolean }>>([]);

  const targetEndTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load task
  useEffect(() => {
    async function loadTask() {
      setLoading(true);
      const supabase = isSupabaseConfigured() ? createClient() : null;
      const result = await fetchTaskById(params.taskId, supabase, user?.id);
      if (result) {
        setTaskData(result);
        const mins = result.task.est_minutes || 25;
        setPlannedMinutes(mins);
        setTotalSeconds(mins * 60);
        setRemainingSeconds(mins * 60);
        setChecklist(
          (result.task.checklist || []).map((item) =>
            typeof item === "string" ? { text: item, done: false } : item
          )
        );
      }
      setLoading(false);
    }
    loadTask();
  }, [params.taskId, user]);

  // Tab-sleep safe timer loop
  useEffect(() => {
    if (isRunning) {
      if (!targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + remainingSeconds * 1000;
      }

      timerIntervalRef.current = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const now = Date.now();
        const diffMs = targetEndTimeRef.current - now;
        const remaining = Math.max(0, Math.ceil(diffMs / 1000));

        setRemainingSeconds(remaining);
        const elapsed = Math.floor((totalSeconds - remaining) / 60);
        setElapsedMinutes(elapsed);

        if (remaining <= 0) {
          setIsRunning(false);
          targetEndTimeRef.current = null;
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleFinishSession(true);
        }
      }, 500);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      targetEndTimeRef.current = null;
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRunning, remainingSeconds, totalSeconds]);

  const toggleTimer = () => {
    if (!isRunning) {
      targetEndTimeRef.current = Date.now() + remainingSeconds * 1000;
      setIsRunning(true);
    } else {
      setIsRunning(false);
      targetEndTimeRef.current = null;
    }
  };

  const addFiveMinutes = () => {
    setTotalSeconds((prev) => prev + 300);
    setRemainingSeconds((prev) => {
      const next = prev + 300;
      if (isRunning && targetEndTimeRef.current) {
        targetEndTimeRef.current = Date.now() + next * 1000;
      }
      return next;
    });
    setPlannedMinutes((prev) => prev + 5);
    toast.info("Added 5 minutes to this session");
  };

  const resetTimer = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    setRemainingSeconds(plannedMinutes * 60);
    setTotalSeconds(plannedMinutes * 60);
  };

  const handleToggleChecklistItem = (idx: number) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, done: !item.done } : item))
    );
  };

  const handleFinishSession = async (autoFromTimer = false) => {
    const actualMins = Math.max(1, Math.round((totalSeconds - remainingSeconds) / 60));
    const supabase = isSupabaseConfigured() ? createClient() : null;

    try {
      // 1. Log session
      await logFocusSession({
        taskId: params.taskId,
        plannedMinutes,
        actualMinutes: actualMins,
        supabase,
        userId: user?.id,
      });

      // 2. Mark task complete
      if (taskData) {
        await toggleTaskStatus(taskData.task.id, true, supabase, user?.id);
      }

      setIsFinishedModalOpen(true);
      toast.success("Focus session logged and task marked complete!");
    } catch {
      setIsFinishedModalOpen(true);
    }
  };

  const handleCopyDoubt = () => {
    if (!taskData) return;
    const checklistStr = checklist.map((c) => c.text).join(", ") || "None";
    const prompt = buildFocusDoubtPrompt(
      taskData.task.title,
      taskData.skillName,
      checklistStr
    );
    navigator.clipboard.writeText(prompt);
    toast.success("Focus doubt prompt copied! Paste it into your AI.");
  };

  // Format time display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // SVG Ring Progress
  const progressPercent = totalSeconds > 0
    ? Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100))
    : 0;
  const strokeDashoffset = 440 - (440 * progressPercent) / 100;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-10 bg-surface rounded-md border border-line animate-pulse" />
        <div className="h-96 bg-surface rounded-lg border border-line animate-pulse" />
      </div>
    );
  }

  const task = taskData?.task;
  const skillName = taskData?.skillName || "Skill Sprint";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-mute hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Plan
        </button>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            {skillName}
          </span>
          <span className="text-xs text-mute font-mono">Deep Focus Mode</span>
        </div>
      </div>

      {/* Main Focus Area: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Timer Card (7 cols) */}
        <div className="md:col-span-7 rounded-lg bg-surface border border-line p-8 shadow-card flex flex-col items-center justify-center text-center space-y-6">
          <span className="text-xs uppercase tracking-wider text-mute font-semibold">
            {isRunning ? "Deep Study Sprint Running" : "Sprint Ready"}
          </span>

          {/* Circular Timer Ring with SVG */}
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="70"
                stroke="currentColor"
                strokeWidth="8"
                className="text-bg"
                fill="transparent"
              />
              <circle
                cx="112"
                cy="112"
                r="70"
                stroke="currentColor"
                strokeWidth="8"
                className="text-primary transition-all duration-500"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-mono font-bold text-ink">
                {formatTime(remainingSeconds)}
              </span>
              <span className="text-xs text-mute mt-1 font-mono">
                {plannedMinutes} min planned
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTimer}
              className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>{remainingSeconds < totalSeconds ? "Resume" : "Start Session"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={addFiveMinutes}
              className="px-3.5 py-2.5 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors cursor-pointer"
            >
              +5m
            </button>

            <button
              type="button"
              onClick={resetTimer}
              title="Reset Timer"
              className="p-2.5 rounded-md border border-line bg-surface hover:bg-bg text-mute hover:text-ink transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Complete Session Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleFinishSession(false)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
            >
              Finish Early & Mark Task Complete
            </button>
          </div>
        </div>

        {/* Priority Objective & Streak (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          {/* Priority Objective */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-mute">
                Priority Objective
              </span>
              {task?.roadmap_ref && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary">
                  Ref {task.roadmap_ref}
                </span>
              )}
            </div>

            <h3 className="text-base font-semibold text-ink">
              {task?.title || "Focus Task"}
            </h3>

            {task?.description && (
              <p className="text-xs text-ink2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Acceptance Criteria Checklist */}
            <div className="pt-2 border-t border-line space-y-2 text-xs">
              <span className="text-mute font-medium text-[11px] block uppercase tracking-wider">
                Acceptance Criteria ({checklist.filter((c) => c.done).length}/{checklist.length})
              </span>

              {checklist.length === 0 ? (
                <p className="text-xs text-mute italic">No sub-checklist items for this task.</p>
              ) : (
                <div className="space-y-1.5">
                  {checklist.map((item, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-2.5 cursor-pointer text-ink2 hover:text-ink select-none"
                    >
                      <input
                        type="checkbox"
                        checked={item.done || false}
                        onChange={() => handleToggleChecklistItem(idx)}
                        className="w-3.5 h-3.5 rounded text-primary accent-primary cursor-pointer shrink-0"
                      />
                      <span className={item.done ? "line-through text-mute" : ""}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Streak Shield Indicator */}
          <div
            className={`rounded-lg border p-4 text-xs space-y-1 transition-colors ${
              elapsedMinutes >= 10
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <Flame
                className={`w-4 h-4 ${
                  elapsedMinutes >= 10
                    ? "text-emerald-500 fill-emerald-500"
                    : "text-amber-500 fill-amber-500"
                }`}
              />
              <span>
                {elapsedMinutes >= 10
                  ? "Streak Shield Active 🔥"
                  : "Streak Shield (10-min minimum)"}
              </span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed">
              {elapsedMinutes >= 10
                ? `You've logged ${elapsedMinutes} minutes! Today's streak is safely locked in.`
                : `Focus for at least 10 minutes to lock in today's streak. (${elapsedMinutes}/10 mins done)`}
            </p>
          </div>

          {/* Doubt Assistance Card */}
          <div className="rounded-lg bg-surface border border-line p-4 shadow-card space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-ink">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                <span>Stuck on this task?</span>
              </div>
            </div>
            <p className="text-[11px] text-mute leading-relaxed">
              Copy a step-by-step doubt prompt with your acceptance criteria pre-filled.
            </p>
            <button
              type="button"
              onClick={handleCopyDoubt}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-bg hover:bg-bg/80 border border-line text-xs font-medium text-ink transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3 text-mute" />
              <span>Copy AI Doubt Prompt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Finished Celebration Modal */}
      {isFinishedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-lg bg-surface border border-line p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-ink">Shabash! Sprint Complete</h3>
              <p className="text-xs text-ink2 leading-relaxed">
                Task marked done and focus session logged. Your consistency is paying off.
              </p>
            </div>

            <div className="p-3 rounded-md bg-bg border border-line text-xs space-y-1 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-mute">Time Logged:</span>
                <span className="text-ink font-semibold">
                  {Math.max(1, Math.round((totalSeconds - remainingSeconds) / 60))} mins
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Streak Status:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Safe & Locked 🔥
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-2 px-3 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
              >
                Back to Today's Tasks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
