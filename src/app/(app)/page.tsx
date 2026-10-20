"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Calendar,
  Route,
  ArrowRight,
  Clock,
  Play,
  Copy,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchSkillsWithRoadmaps, SkillWithRoadmap } from "@/lib/data/roadmaps";
import {
  fetchPlans,
  toggleTaskStatus,
  PlanWithChunkDetails,
  PlanTaskItem,
} from "@/lib/data/plans";
import { calculateStreak } from "@/lib/logic/streak";
import {
  buildDoubtPrompt,
  buildQuizPrompt,
  buildAnalogyPrompt,
  buildDrillsPrompt,
} from "@/lib/prompts";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [skills, setSkills] = useState<SkillWithRoadmap[]>([]);
  const [plans, setPlans] = useState<PlanWithChunkDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const supabase = isSupabaseConfigured() ? createClient() : null;
    const [skillsData, plansData] = await Promise.all([
      fetchSkillsWithRoadmaps(supabase, user?.id),
      fetchPlans(supabase, user?.id),
    ]);
    setSkills(skillsData);
    setPlans(plansData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const todayStr = new Date().toISOString().split("T")[0];

  // Aggregated today's tasks across all active plans
  const todayTasks = useMemo(() => {
    return plans.flatMap((p) =>
      p.allTasks.filter((t) => t.scheduled_date === todayStr)
    );
  }, [plans, todayStr]);

  const completedTodayTasks = useMemo(() => {
    return todayTasks.filter((t) => t.status === "done");
  }, [todayTasks]);

  const firstPendingTask = useMemo(() => {
    return todayTasks.find((t) => t.status !== "done") || todayTasks[0] || null;
  }, [todayTasks]);

  // Real Streak Calculation
  const streakInfo = useMemo(() => {
    const datesSet = new Set<string>();
    for (const p of plans) {
      for (const t of p.allTasks) {
        if (t.status === "done") {
          if (t.completed_at) {
            datesSet.add(t.completed_at.split("T")[0]);
          } else if (t.scheduled_date) {
            datesSet.add(t.scheduled_date);
          }
        }
      }
    }

    return calculateStreak({
      datesWithActivity: Array.from(datesSet),
      restDays: [0], // Sunday
    });
  }, [plans]);

  // Check for Sprint Chunks ending within 7 days
  const expiringChunkPlan = useMemo(() => {
    for (const p of plans) {
      if (p.currentChunk?.end_date) {
        const diffMs = new Date(p.currentChunk.end_date).getTime() - new Date(todayStr).getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysLeft >= 0 && daysLeft <= 7) {
          return { plan: p, daysLeft };
        }
      }
    }
    return null;
  }, [plans, todayStr]);

  // 7-Day Weekly Rhythm Data
  const weeklyRhythm = useMemo(() => {
    const daysArr: Array<{ date: string; dayLabel: string; minutes: number; isToday: boolean }> = [];
    const base = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });

      // Sum minutes of completed tasks on this date
      let mins = 0;
      for (const p of plans) {
        for (const t of p.allTasks) {
          if (t.status === "done") {
            const taskDoneDate = t.completed_at ? t.completed_at.split("T")[0] : t.scheduled_date;
            if (taskDoneDate === dStr) {
              mins += t.est_minutes || 30;
            }
          }
        }
      }

      daysArr.push({
        date: dStr,
        dayLabel,
        minutes: mins,
        isToday: dStr === todayStr,
      });
    }

    return daysArr;
  }, [plans, todayStr]);

  // Max minutes for weekly rhythm bar scale
  const maxWeeklyMinutes = useMemo(() => {
    const max = Math.max(...weeklyRhythm.map((w) => w.minutes));
    return max > 0 ? max : 120;
  }, [weeklyRhythm]);

  // Task check toggle
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const isDone = currentStatus === "done";
    const nextStatus = isDone ? "todo" : "done";

    // Optimistic UI update
    setPlans((prev) =>
      prev.map((p) => ({
        ...p,
        allTasks: p.allTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: nextStatus as "todo" | "done",
                completed_at: !isDone ? new Date().toISOString() : undefined,
              }
            : t
        ),
      }))
    );

    try {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      await toggleTaskStatus(taskId, !isDone, supabase, user?.id);
      toast.success(isDone ? "Task marked incomplete" : "Task completed! Well done.");
    } catch {
      toast.error("Failed to update task status");
      loadData();
    }
  };

  // Quick Prompt Copy Handlers
  const handleCopyPrompt = (promptText: string, title: string) => {
    navigator.clipboard.writeText(promptText);
    toast.success(`${title} copied to clipboard! Paste it into your AI.`);
  };

  // Greeting by hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const displayName = profile?.display_name || "Dhruv";

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="rounded-lg bg-surface border border-line p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Today • {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            <span className="text-xs text-mute font-mono">Calm Clarity Engine</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            {greeting}, {displayName}!
          </h2>
          <p className="text-xs text-ink2 leading-relaxed">
            Master any skill without overwhelm in structured, bite-sized 30-day chunks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/plans/new"
            className="flex items-center gap-2 px-3.5 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors"
          >
            <span>+ New Sprint</span>
          </Link>
          {firstPendingTask ? (
            <Link
              href={`/focus/${firstPendingTask.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Focus ({firstPendingTask.est_minutes}m)</span>
            </Link>
          ) : (
            <Link
              href="/plans"
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm transition-colors"
            >
              <span>View All Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* 3 Real Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Skills */}
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs text-mute">
            <span className="font-medium">Active Skills</span>
            <Route className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-ink">
              {skills.length}
            </span>
            <span className="text-xs text-ink2">
              Curriculum{skills.length === 1 ? "" : "s"} in progress
            </span>
          </div>
          <div className="pt-2 flex items-center gap-1.5 flex-wrap">
            {skills.slice(0, 2).map((s) => (
              <Link
                key={s.id}
                href={`/roadmaps/${s.roadmap?.id || "sample-1"}`}
                className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Target */}
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs text-mute">
            <span className="font-medium">Today's Target</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-ink">
              {completedTodayTasks.length} / {todayTasks.length}
            </span>
            <span className="text-xs text-ink2">Tasks completed</span>
          </div>
          <div className="w-full bg-line rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${
                  todayTasks.length > 0
                    ? Math.round((completedTodayTasks.length / todayTasks.length) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Streak with Forgiveness status */}
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-xs text-mute">
            <span className="font-medium">Current Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-ink">
              {streakInfo.currentStreak}
            </span>
            <span className="text-xs text-ink2">
              Day{streakInfo.currentStreak === 1 ? "" : "s"} streak (Next: {streakInfo.nextMilestone} days)
            </span>
          </div>
          <div className="pt-2 text-xs text-mute flex items-center gap-1.5">
            <span className="text-[11px]">
              Streak safe • Rest days never break it
            </span>
          </div>
        </div>
      </div>

      {/* Chunk Alert Banner (if <= 7 days left in current chunk) */}
      {expiringChunkPlan && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Chunk {expiringChunkPlan.plan.currentChunk?.number || 1} of {expiringChunkPlan.plan.skill_name}</strong> ends in{" "}
              <strong>{expiringChunkPlan.daysLeft} days</strong>. Get ready for your 30-Day Chunk End Ritual!
            </span>
          </div>
          <Link
            href={`/plans/${expiringChunkPlan.plan.id}/chunk-end`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors shrink-0"
          >
            <span>Preview Ritual</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 2-Column Main Section: Today's Agenda (8 cols) + Weekly Rhythm & Quick Prompts (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Tasks */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-ink">
                Today's Agenda ({todayTasks.length} task{todayTasks.length === 1 ? "" : "s"})
              </h3>
            </div>
            {plans.length > 0 && (
              <Link
                href={`/plans/${plans[0].id}`}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              >
                <span>Full Day View</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-surface border border-line animate-pulse" />
              ))}
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="rounded-lg bg-surface border border-line p-8 text-center space-y-3 shadow-card">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-semibold text-ink">Sab ho gaya! All tasks done for today.</h4>
              <p className="text-xs text-ink2 max-w-sm mx-auto leading-relaxed">
                You've completed everything scheduled for today or today is a scheduled rest day. Take a break or start a practice sprint.
              </p>
              <Link
                href="/plans/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm transition-colors"
              >
                <span>Create Another Sprint</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => {
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

                      <div className="space-y-1 flex-1 min-w-0">
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
                        </div>

                        <h4
                          className={`text-sm font-medium ${
                            isDone ? "line-through text-mute" : "text-ink"
                          }`}
                        >
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-xs text-ink2 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/focus/${task.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors shrink-0"
                    >
                      <Play className="w-3 h-3 fill-primary" />
                      <span>Focus</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Weekly Study Rhythm & Quick Prompter */}
        <div className="lg:col-span-4 space-y-5">
          {/* 7-Day Weekly Rhythm Chart */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Weekly Study Rhythm</h3>
              <span className="text-[11px] text-mute font-mono">Past 7 Days</span>
            </div>

            <div className="h-28 flex items-end justify-between gap-2 pt-4 px-1">
              {weeklyRhythm.map((item, idx) => {
                const heightPercent = Math.max(
                  10,
                  Math.round((item.minutes / maxWeeklyMinutes) * 100)
                );
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono text-mute">
                      {item.minutes > 0 ? `${item.minutes}m` : "-"}
                    </span>
                    <div className="w-full bg-bg rounded-t-sm h-16 flex items-end overflow-hidden border border-line">
                      <div
                        className={`w-full transition-all duration-300 rounded-t-sm ${
                          item.isToday
                            ? "bg-primary"
                            : item.minutes > 0
                            ? "bg-emerald-500/80"
                            : "bg-transparent"
                        }`}
                        style={{ height: `${item.minutes > 0 ? heightPercent : 0}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] uppercase font-mono ${
                        item.isToday ? "font-bold text-primary" : "text-mute"
                      }`}
                    >
                      {item.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick AI Prompter Bar */}
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink">Quick AI Boosters</h3>
              </div>
              <span className="text-[11px] text-mute">One-click copy</span>
            </div>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  handleCopyPrompt(
                    buildDoubtPrompt(
                      firstPendingTask?.title || "Current Task",
                      firstPendingTask?.roadmap_ref || "Core Topic",
                      skills[0]?.name || "Skill"
                    ),
                    "Ask AI Doubt Prompt"
                  )
                }
                className="w-full text-left p-2.5 rounded-md bg-bg hover:bg-bg/80 border border-line flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-ink">Ask AI Doubt</span>
                </div>
                <Copy className="w-3 h-3 text-mute" />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCopyPrompt(
                    buildQuizPrompt(skills[0]?.name || "Skill", skills[0]?.name || "Skill"),
                    "15-Min Quick Quiz Prompt"
                  )
                }
                className="w-full text-left p-2.5 rounded-md bg-bg hover:bg-bg/80 border border-line flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-medium text-ink">15-Min Fast Quiz</span>
                </div>
                <Copy className="w-3 h-3 text-mute" />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleCopyPrompt(
                    buildAnalogyPrompt(skills[0]?.name || "Skill", skills[0]?.name || "Skill"),
                    "Real-Life Analogy Prompt"
                  )
                }
                className="w-full text-left p-2.5 rounded-md bg-bg hover:bg-bg/80 border border-line flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-medium text-ink">Real-Life Analogy</span>
                </div>
                <Copy className="w-3 h-3 text-mute" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
