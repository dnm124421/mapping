"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  Plus,
  HelpCircle,
  BookOpen,
  Check,
  ChevronRight,
  MoreVertical,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchPlanDetails,
  toggleTaskStatus,
  moveTaskDate,
  addCustomTask,
  saveDailyScratchpad,
  PlanWithChunkDetails,
  PlanTaskItem,
} from "@/lib/data/plans";
import { buildDoubtPrompt, buildQuizPrompt } from "@/lib/prompts";

export default function TodaysToDoPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanWithChunkDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected date / day state
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Custom task modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customEstMinutes, setCustomEstMinutes] = useState(30);

  // Scratchpad state
  const [scratchpad, setScratchpad] = useState("");
  const [scratchpadStatus, setScratchpadStatus] = useState("Saved");
  const scratchpadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadPlan = async () => {
    setLoading(true);
    const supabase = isSupabaseConfigured() ? createClient() : null;
    const data = await fetchPlanDetails(params.id, supabase, user?.id);
    setPlan(data);
    if (data && data.days && data.days.length > 0) {
      // If today is within chunk days, default to today, else first day
      const dayMatchesToday = data.days.some((d) => d.date === todayStr);
      if (!dayMatchesToday) {
        setSelectedDate(data.days[0].date);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPlan();
  }, [params.id, user]);

  // Load scratchpad from local storage or supabase
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`scratchpad_${selectedDate}`) || "";
      setScratchpad(saved);
    }
  }, [selectedDate]);

  const handleScratchpadChange = (val: string) => {
    setScratchpad(val);
    setScratchpadStatus("Saving...");
    if (scratchpadTimeoutRef.current) clearTimeout(scratchpadTimeoutRef.current);

    scratchpadTimeoutRef.current = setTimeout(async () => {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      await saveDailyScratchpad(selectedDate, val, supabase, user?.id);
      setScratchpadStatus("Autosaved");
    }, 800);
  };

  // Toggle task checkbox optimistically
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const isDone = currentStatus === "done";
    const nextStatus = isDone ? "todo" : "done";

    // Optimistic update
    setPlan((prev) => {
      if (!prev) return null;
      const updatedAll = prev.allTasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: nextStatus as "todo" | "done",
              completed_at: !isDone ? new Date().toISOString() : undefined,
            }
          : t
      );
      const updatedDays = prev.days.map((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: nextStatus as "todo" | "done",
                completed_at: !isDone ? new Date().toISOString() : undefined,
              }
            : t
        ),
      }));
      return { ...prev, allTasks: updatedAll, days: updatedDays };
    });

    try {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      await toggleTaskStatus(taskId, !isDone, supabase, user?.id);
      toast.success(isDone ? "Task marked todo" : "Task completed! Well done.");
    } catch {
      toast.error("Failed to update task status.");
      loadPlan();
    }
  };

  // Move missed task
  const handleMoveTask = async (taskId: string, targetDate: string) => {
    try {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      await moveTaskDate(taskId, targetDate, supabase, user?.id);
      toast.success(`Task moved to ${targetDate}.`);
      loadPlan();
    } catch {
      toast.error("Failed to reschedule task.");
    }
  };

  // Add custom task
  const handleAddCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    try {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      await addCustomTask({
        planId: params.id,
        title: customTitle.trim(),
        scheduledDate: selectedDate,
        estMinutes: customEstMinutes,
        supabase,
        userId: user?.id,
      });

      setCustomTitle("");
      setIsAddModalOpen(false);
      toast.success("Custom task added to today!");
      loadPlan();
    } catch (err: any) {
      toast.error(`Failed to add task: ${err.message || "Unknown error"}`);
    }
  };

  // Copy AI quick prompters
  const handleCopyDoubt = (task: PlanTaskItem) => {
    const prompt = buildDoubtPrompt(task.title, task.roadmap_ref || "Current Topic", plan?.skill_name || "Skill");
    navigator.clipboard.writeText(prompt);
    toast.success("Doubt prompt copied to clipboard! Paste it into your AI.");
  };

  const handleCopyQuiz = (task: PlanTaskItem) => {
    const prompt = buildQuizPrompt(task.roadmap_ref || task.title, plan?.skill_name || "Skill");
    navigator.clipboard.writeText(prompt);
    toast.success("Quiz prompt copied! Paste it into your AI.");
  };

  // Filter tasks for selected day
  const currentDay = useMemo(() => {
    return plan?.days.find((d) => d.date === selectedDate) || null;
  }, [plan, selectedDate]);

  const scheduledTasks = useMemo(() => {
    if (!plan) return [];
    return plan.allTasks.filter((t) => t.scheduled_date === selectedDate);
  }, [plan, selectedDate]);

  // Overdue / Missed tasks for Gentle Catch-Up banner
  const overdueTasks = useMemo(() => {
    if (!plan) return [];
    return plan.allTasks.filter(
      (t) => t.scheduled_date < selectedDate && t.status !== "done"
    );
  }, [plan, selectedDate]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-surface rounded-md border border-line animate-pulse" />
        <div className="h-24 bg-surface rounded-lg border border-line animate-pulse" />
        <div className="h-96 bg-surface rounded-lg border border-line animate-pulse" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="rounded-lg bg-surface border border-line p-10 text-center space-y-4 shadow-card">
        <h3 className="text-base font-semibold text-ink">Plan Not Found</h3>
        <p className="text-xs text-ink2">The requested daily plan does not exist or has been removed.</p>
        <Link
          href="/plans"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-mute mb-1">
            <Link href="/plans" className="hover:text-ink flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Daily Plans
            </Link>
            <span>/</span>
            <span>{plan.skill_name}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {currentDay ? `Day ${currentDay.day_number} of 30` : "Today's Agenda"}
              {currentDay?.focus && <span className="font-normal text-ink2"> • {currentDay.focus}</span>}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
              Chunk {plan.currentChunk?.number || 1} • {plan.statusChip}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/roadmaps/${plan.roadmap_id}`}
            className="text-xs text-mute hover:text-ink border border-line px-3 py-1.5 rounded-md hover:bg-bg transition-colors"
          >
            Roadmap Dossier
          </Link>
          <Link
            href={`/plans/${plan.id}/chunk-end`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chunk End Ritual</span>
          </Link>
        </div>
      </div>

      {/* DateStrip Component (30 Days) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-mute px-1">
          <span className="font-medium text-ink">30-Day Sprint Strip</span>
          <span>Click any day to inspect tasks or reschedule</span>
        </div>
        <div className="rounded-lg bg-surface border border-line p-2.5 shadow-card overflow-x-auto flex items-center gap-2 scrollbar-thin">
          {plan.days.map((d) => {
            const isSelected = d.date === selectedDate;
            const isToday = d.date === todayStr;
            const dayTasks = plan.allTasks.filter((t) => t.scheduled_date === d.date);
            const allDone = dayTasks.length > 0 && dayTasks.every((t) => t.status === "done");
            const hasMissed = d.date < todayStr && dayTasks.some((t) => t.status !== "done");

            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDate(d.date)}
                className={`flex flex-col items-center justify-center min-w-[58px] py-2 px-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-white font-bold shadow-sm"
                    : "hover:bg-bg text-ink2 border border-line bg-surface"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase opacity-75">D{d.day_number}</span>
                  {allDone && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  {hasMissed && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                </div>
                <span className="text-sm font-semibold">
                  {new Date(d.date).toLocaleDateString("en-US", { day: "numeric" })}
                </span>
                <span className="text-[10px] opacity-80">
                  {isToday ? "Today" : new Date(d.date).toLocaleDateString("en-US", { month: "short" })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gentle Catch-Up Banner */}
      {overdueTasks.length > 0 ? (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 shadow-card space-y-3 text-xs">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-medium">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>
                Gentle Catch-Up: <strong>{overdueTasks.length} task{overdueTasks.length === 1 ? "" : "s"}</strong> from previous days are waiting for you.
              </span>
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-mono">Forgiveness Buffer Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
            {overdueTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="p-2.5 rounded-md bg-surface border border-line flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <p className="text-ink font-medium text-xs truncate">{task.title}</p>
                  <span className="text-mute text-[10px] font-mono">
                    Scheduled: {task.scheduled_date} • {task.est_minutes}m
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveTask(task.id, selectedDate)}
                    className="px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-medium transition-colors"
                  >
                    Move to Today
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-surface border border-line p-3.5 shadow-card flex items-center justify-between text-xs text-mute">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>No missed tasks to catch up on. You are completely on track!</span>
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono text-[11px]">
            All Caught Up
          </span>
        </div>
      )}

      {/* 2-Column: Tasks & Focus (8 cols) + Scratchpad & Quick Prompting (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Task Cards Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">
                Tasks for {selectedDate} ({scheduledTasks.length} task{scheduledTasks.length === 1 ? "" : "s"})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add custom task
            </button>
          </div>

          {scheduledTasks.length === 0 ? (
            <div className="rounded-lg bg-surface border border-line p-8 text-center space-y-2 shadow-card">
              <Calendar className="w-6 h-6 text-mute mx-auto" />
              <p className="text-xs text-ink font-medium">No tasks scheduled for this day</p>
              <p className="text-[11px] text-mute">Enjoy your rest day or add a custom task above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledTasks.map((task) => {
                const isDone = task.status === "done";
                return (
                  <div
                    key={task.id}
                    className={`rounded-lg bg-surface border border-line p-4 shadow-card hover:shadow-card-hover transition-all flex items-start justify-between gap-3 ${
                      isDone ? "opacity-75 bg-bg/50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => handleToggleTask(task.id, task.status)}
                        className="w-4 h-4 rounded text-primary accent-primary mt-1 cursor-pointer shrink-0"
                      />

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${
                              task.kind === "practice"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : task.kind === "project"
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {task.kind || "learn"}
                          </span>
                          <span className="text-xs text-mute font-mono">
                            {task.est_minutes} mins
                          </span>
                          {task.roadmap_ref && (
                            <span className="text-xs text-mute font-mono">
                              • Ref {task.roadmap_ref}
                            </span>
                          )}
                          {task.is_custom && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-bg border border-line text-mute">
                              Custom
                            </span>
                          )}
                        </div>

                        <h4
                          className={`text-sm font-medium ${
                            isDone ? "line-through text-mute" : "text-ink"
                          }`}
                        >
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-xs text-ink2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Interactive Sub-checklist */}
                        {task.checklist && task.checklist.length > 0 && (
                          <div className="pt-1.5 space-y-1 border-t border-line/60">
                            {task.checklist.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-xs text-ink2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-line" />
                                <span>{typeof item === "string" ? item : item.text}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Quick AI Assistance buttons */}
                        <div className="pt-2 flex items-center gap-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => handleCopyDoubt(task)}
                            className="text-mute hover:text-ink flex items-center gap-1 transition-colors"
                          >
                            <HelpCircle className="w-3 h-3 text-primary" />
                            <span>Ask AI Doubt</span>
                          </button>
                          <span className="text-line">•</span>
                          <button
                            type="button"
                            onClick={() => handleCopyQuiz(task)}
                            className="text-mute hover:text-ink flex items-center gap-1 transition-colors"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            <span>Quiz Me</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Start Focus Button */}
                    <Link
                      href={`/focus/${task.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors shrink-0"
                    >
                      <Play className="w-3 h-3 fill-primary" />
                      <span>Start Focus</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Daily Scratchpad & Quick Helpers */}
        <div className="lg:col-span-4 space-y-4">
          {/* Daily Scratchpad */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Daily Scratchpad</h3>
              <span className="text-[11px] text-mute font-mono">{scratchpadStatus}</span>
            </div>
            <textarea
              value={scratchpad}
              onChange={(e) => handleScratchpadChange(e.target.value)}
              placeholder="Thoughts, bookmarks, doubts, or notes for today..."
              className="w-full h-40 p-3 rounded-md bg-bg border border-line text-xs text-ink focus:outline-none focus:border-primary resize-none leading-relaxed"
            />
            <p className="text-[11px] text-mute">
              Saved automatically to your daily journal for {selectedDate}.
            </p>
          </div>

          {/* Quick Prompters Box */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <h3 className="text-sm font-semibold text-ink">Quick AI Boosters</h3>
            <p className="text-xs text-mute leading-relaxed">
              Copy curated prompts instantly into your AI to unblock yourself or test your recall.
            </p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  const prompt = `Give me a 15-minute quick test on the core concepts of ${plan.skill_name} covered in today's session. Ask one question at a time.`;
                  navigator.clipboard.writeText(prompt);
                  toast.success("15-Min Quick Quiz copied!");
                }}
                className="w-full text-left p-2.5 rounded-md bg-bg hover:bg-bg/80 border border-line flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-medium text-ink">15-Min Fast Quiz</span>
                <ChevronRight className="w-3.5 h-3.5 text-mute" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const prompt = `Explain the core concept of ${plan.skill_name} using a simple real-world analogy, then explain the technical detail in 5 points.`;
                  navigator.clipboard.writeText(prompt);
                  toast.success("Analogy Prompt copied!");
                }}
                className="w-full text-left p-2.5 rounded-md bg-bg hover:bg-bg/80 border border-line flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="font-medium text-ink">Real-Life Analogy</span>
                <ChevronRight className="w-3.5 h-3.5 text-mute" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg bg-surface border border-line p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-semibold text-ink">Add Custom Task</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-mute hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-ink font-medium mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Solve LeetCode #1 Two Sum"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-ink font-medium mb-1">Estimated Minutes</label>
                <input
                  type="number"
                  min="5"
                  max="240"
                  value={customEstMinutes}
                  onChange={(e) => setCustomEstMinutes(parseInt(e.target.value) || 30)}
                  className="w-full h-9 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-ink font-medium mb-1">Scheduled Date</label>
                <input
                  type="date"
                  disabled
                  value={selectedDate}
                  className="w-full h-9 px-3 rounded-md bg-bg border border-line text-mute text-xs opacity-70"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-line hover:bg-bg text-ink text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
