"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  Flame,
  Calendar,
  Download,
  CheckCircle2,
  BookOpen,
  Filter,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchPlans, PlanWithChunkDetails } from "@/lib/data/plans";
import { fetchSkillsWithRoadmaps, SkillWithRoadmap } from "@/lib/data/roadmaps";
import { calculateStreak } from "@/lib/logic/streak";

export default function HistoryPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PlanWithChunkDetails[]>([]);
  const [skills, setSkills] = useState<SkillWithRoadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    tasksCount: number;
    minutes: number;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const supabase = isSupabaseConfigured() ? createClient() : null;
      const [pData, sData] = await Promise.all([
        fetchPlans(supabase, user?.id),
        fetchSkillsWithRoadmaps(supabase, user?.id),
      ]);
      setPlans(pData);
      setSkills(sData);
      setLoading(false);
    }
    loadData();
  }, [user]);

  // Aggregate all completed tasks
  const completedTasks = useMemo(() => {
    return plans.flatMap((p) =>
      p.allTasks
        .filter((t) => t.status === "done")
        .map((t) => ({
          ...t,
          skillName: p.skill_name,
        }))
    );
  }, [plans]);

  // Total Focus Minutes
  const totalFocusMinutes = useMemo(() => {
    return completedTasks.reduce((acc, t) => acc + (t.est_minutes || 30), 0);
  }, [completedTasks]);

  // Streak Stats
  const streakInfo = useMemo(() => {
    const datesSet = new Set<string>();
    for (const t of completedTasks) {
      if (t.completed_at) {
        datesSet.add(t.completed_at.split("T")[0]);
      } else if (t.scheduled_date) {
        datesSet.add(t.scheduled_date);
      }
    }
    return calculateStreak({
      datesWithActivity: Array.from(datesSet),
      restDays: [0],
    });
  }, [completedTasks]);

  // On-time velocity (% tasks completed without moving date)
  const onTimeVelocity = useMemo(() => {
    if (completedTasks.length === 0) return 100;
    const onTimeCount = completedTasks.filter(
      (t) => !t.original_date || t.original_date === t.scheduled_date
    ).length;
    return Math.round((onTimeCount / completedTasks.length) * 100);
  }, [completedTasks]);

  // 91-Day Heatmap Data (13 weeks x 7 days)
  const heatmapData = useMemo(() => {
    const cells: Array<{ date: string; tasksCount: number; minutes: number }> = [];
    const today = new Date();

    // Map tasks by completion date
    const activityMap: Record<string, { tasksCount: number; minutes: number }> = {};
    for (const t of completedTasks) {
      const dStr = t.completed_at ? t.completed_at.split("T")[0] : t.scheduled_date;
      if (!activityMap[dStr]) {
        activityMap[dStr] = { tasksCount: 0, minutes: 0 };
      }
      activityMap[dStr].tasksCount += 1;
      activityMap[dStr].minutes += t.est_minutes || 30;
    }

    for (let i = 90; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const act = activityMap[dStr] || { tasksCount: 0, minutes: 0 };

      cells.push({
        date: dStr,
        tasksCount: act.tasksCount,
        minutes: act.minutes,
      });
    }

    return cells;
  }, [completedTasks]);

  // Export CSV of completed tasks
  const handleExportCSV = () => {
    if (completedTasks.length === 0) return;
    const headers = ["Task Title", "Skill", "Scheduled Date", "Completed At", "Est Minutes", "Roadmap Ref"];
    const rows = completedTasks.map((t) => [
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.skillName}"`,
      t.scheduled_date || "",
      t.completed_at || t.scheduled_date || "",
      t.est_minutes || 30,
      t.roadmap_ref || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `study_history_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getHeatmapColor = (minutes: number) => {
    if (minutes === 0) return "bg-bg border border-line";
    if (minutes <= 30) return "bg-emerald-500/25";
    if (minutes <= 60) return "bg-emerald-500/50";
    if (minutes <= 120) return "bg-emerald-500/80";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">
            History & Telemetry
          </h2>
          <p className="text-xs text-ink2 mt-0.5">
            Real performance tracking: study hours, 90-day consistency heatmap, and task velocity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={completedTasks.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-line bg-surface hover:bg-bg disabled:opacity-50 text-ink text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-mute" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Real Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute font-medium">Total Study Time</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {(totalFocusMinutes / 60).toFixed(1)}h
          </p>
          <span className="text-[11px] text-mute">{completedTasks.length} tasks completed</span>
        </div>

        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute font-medium">Longest Streak</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {streakInfo.bestStreak} day{streakInfo.bestStreak === 1 ? "" : "s"}
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            Current: {streakInfo.currentStreak} days
          </span>
        </div>

        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute font-medium">On-Time Velocity</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {onTimeVelocity}%
          </p>
          <span className="text-[11px] text-mute">Completed without delay</span>
        </div>

        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute font-medium">Active Curricula</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {plans.length}
          </p>
          <span className="text-[11px] text-mute">Skills in active sprint</span>
        </div>
      </div>

      {/* 90-Day Activity Heatmap Matrix */}
      <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink">90-Day Consistency Heatmap</h3>
            <p className="text-[11px] text-mute">Hover over any square to see tasks logged on that day.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-mute font-mono">
            <span>0m</span>
            <div className="w-3 h-3 rounded-xs bg-bg border border-line" />
            <div className="w-3 h-3 rounded-xs bg-emerald-500/25" />
            <div className="w-3 h-3 rounded-xs bg-emerald-500/50" />
            <div className="w-3 h-3 rounded-xs bg-emerald-500/80" />
            <div className="w-3 h-3 rounded-xs bg-emerald-500" />
            <span>2h+</span>
          </div>
        </div>

        {/* Heatmap Grid (7 rows for days of week, 13 columns for weeks) */}
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[580px] p-1">
            {heatmapData.map((cell, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredCell(cell)}
                onMouseLeave={() => setHoveredCell(null)}
                className={`w-3.5 h-3.5 rounded-xs transition-transform hover:scale-125 cursor-pointer ${getHeatmapColor(
                  cell.minutes
                )}`}
              />
            ))}
          </div>
        </div>

        {/* Heatmap tooltip info */}
        <div className="h-6 text-xs text-ink2">
          {hoveredCell ? (
            <span className="font-mono">
              <strong>{hoveredCell.date}</strong>: {hoveredCell.tasksCount} tasks completed •{" "}
              {hoveredCell.minutes} minutes studied
            </span>
          ) : (
            <span className="text-mute text-[11px]">Hover over any day to inspect details</span>
          )}
        </div>
      </div>

      {/* Completed Tasks History Log */}
      <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Recent Task Completions</h3>
          <span className="text-xs text-mute font-mono">
            {completedTasks.length} task{completedTasks.length === 1 ? "" : "s"} total
          </span>
        </div>

        {completedTasks.length === 0 ? (
          <p className="text-xs text-mute py-4 text-center">
            No completed tasks yet. Finish your daily focus sessions to build your telemetry!
          </p>
        ) : (
          <div className="space-y-2">
            {completedTasks.slice(0, 10).map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-md bg-bg border border-line flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="truncate">
                    <span className="font-medium text-ink truncate block">{task.title}</span>
                    <span className="text-[11px] text-mute font-mono">
                      {task.skillName} • {task.est_minutes}m
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-mute font-mono text-[11px]">
                    {task.completed_at ? task.completed_at.split("T")[0] : task.scheduled_date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
