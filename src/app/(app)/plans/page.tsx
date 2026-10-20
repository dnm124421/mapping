"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  CalendarDays,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchPlans, PlanWithChunkDetails } from "@/lib/data/plans";

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlanWithChunkDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    setLoading(true);
    const supabase = isSupabaseConfigured() ? createClient() : null;
    const data = await fetchPlans(supabase, user?.id);
    setPlans(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPlans();
  }, [user]);

  const todayStr = new Date().toISOString().split("T")[0];

  // Calculate real aggregates
  const totalDailyHours = plans.reduce((acc, p) => acc + (p.daily_minutes || 120), 0) / 60;
  
  const todayTasks = plans.flatMap((p) =>
    p.allTasks.filter((t) => t.scheduled_date === todayStr)
  );

  const completedTodayTasks = todayTasks.filter((t) => t.status === "done");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Catch-up recommended":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "Behind":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "Completed":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-mute/10 text-mute border-line";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Daily Plans</h2>
          <p className="text-xs text-ink2 mt-0.5">
            Every skill broken down into focused, bite-sized 30-day sprint chunks.
          </p>
        </div>
        <Link
          href="/plans/new"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New 30-Day Plan</span>
        </Link>
      </div>

      {/* Aggregate Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-mute font-medium">Daily Commitment</span>
            <Clock className="w-3.5 h-3.5 text-mute" />
          </div>
          <p className="text-2xl font-bold font-mono text-ink mt-2">
            {totalDailyHours.toFixed(1)} hrs/day
          </p>
          <span className="text-[11px] text-mute">Across {plans.length} active sprint{plans.length === 1 ? "" : "s"}</span>
        </div>

        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-mute font-medium">Today's Load</span>
            <CalendarDays className="w-3.5 h-3.5 text-mute" />
          </div>
          <p className="text-2xl font-bold font-mono text-ink mt-2">
            {todayTasks.length} task{todayTasks.length === 1 ? "" : "s"}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {completedTodayTasks.length} completed today
          </span>
        </div>

        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-mute font-medium">Sprint Engine</span>
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-2xl font-bold font-mono text-ink mt-2">
            30-Day Chunks
          </p>
          <span className="text-[11px] text-mute">Prompt → JSON → Active Plan</span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-lg bg-surface border border-line animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && plans.length === 0 && (
        <div className="rounded-lg bg-surface border border-line p-10 text-center space-y-4 shadow-card">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-semibold text-ink">No Sprint Plans Yet</h3>
            <p className="text-xs text-ink2 leading-relaxed">
              Transform any of your roadmaps into an actionable 30-day sprint with bite-sized daily tasks, rest days, and smart catch-up.
            </p>
          </div>
          <Link
            href="/plans/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create 30-Day Plan</span>
          </Link>
        </div>
      )}

      {/* Plans List */}
      {!loading && plans.length > 0 && (
        <div className="space-y-4">
          {plans.map((plan) => {
            const chunkTasks = plan.allTasks;
            const doneTasks = chunkTasks.filter((t) => t.status === "done");
            const percent = chunkTasks.length > 0
              ? Math.round((doneTasks.length / chunkTasks.length) * 100)
              : 0;

            const planTodayTasks = chunkTasks.filter((t) => t.scheduled_date === todayStr);

            // Compute days left in chunk
            let daysLeft = 30;
            if (plan.currentChunk?.end_date) {
              const diffMs = new Date(plan.currentChunk.end_date).getTime() - new Date(todayStr).getTime();
              daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            }

            return (
              <div
                key={plan.id}
                className="rounded-lg bg-surface border border-line p-5 shadow-card hover:shadow-card-hover transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                        {plan.skill_name}
                      </span>
                      <span className="text-xs text-mute font-mono">
                        {(plan.daily_minutes / 60).toFixed(1)} hrs/day
                      </span>
                      <span className="text-xs text-mute font-mono">
                        • Rest on {plan.rest_days?.includes(0) ? "Sunday" : "Scheduled"}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-ink mt-1">
                      Chunk {plan.currentChunk?.number || 1} • {daysLeft > 0 ? `Sprint ends in ${daysLeft} days` : "Sprint period completed"}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                        plan.statusChip
                      )}`}
                    >
                      {plan.statusChip}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mute">
                      Progress: <strong className="text-ink">{doneTasks.length}</strong> / {chunkTasks.length} tasks completed
                    </span>
                    <span className="font-mono font-medium text-ink">{percent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-bg border border-line overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Today's Agenda Preview */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink text-[11px] uppercase tracking-wider">
                      Today's Agenda ({planTodayTasks.length} task{planTodayTasks.length === 1 ? "" : "s"})
                    </span>
                    {planTodayTasks.length === 0 && (
                      <span className="text-mute text-[11px]">No tasks scheduled for today or rest day</span>
                    )}
                  </div>

                  {planTodayTasks.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {planTodayTasks.slice(0, 4).map((task) => (
                        <div
                          key={task.id}
                          className="p-2.5 rounded-md bg-bg border border-line flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                task.status === "done" ? "bg-emerald-500" : "bg-primary"
                              }`}
                            />
                            <span
                              className={`text-xs font-medium truncate ${
                                task.status === "done" ? "line-through text-mute" : "text-ink"
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <span className="text-mute font-mono text-[11px] shrink-0">
                            {task.est_minutes}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-2 flex items-center justify-between border-t border-line">
                  <Link
                    href={`/roadmaps/${plan.roadmap_id || "sample-1"}`}
                    className="text-xs text-mute hover:text-ink transition-colors flex items-center gap-1"
                  >
                    <span>View Roadmap</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/plans/${plan.id}/chunk-end`}
                      className="text-xs text-mute hover:text-ink px-2.5 py-1.5 rounded-md border border-line hover:bg-bg transition-colors"
                    >
                      Chunk Ritual
                    </Link>
                    <Link
                      href={`/plans/${plan.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
                    >
                      <span>Go to Today's To-Do</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
