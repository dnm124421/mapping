import { todayISO, diffDays } from "./dates";

export type PlanStatusChip =
  | "On Track"
  | "Catch-up recommended"
  | "Behind"
  | "Paused"
  | "Completed";

export interface PlanStatusParams {
  tasks: Array<{
    status: string;
    scheduled_date: string;
    est_minutes: number;
  }>;
  dailyMinutes: number;
  chunkStartDate: string;
  chunkEndDate: string;
  planStatus?: string; // e.g. "active", "paused", "completed"
  timezone?: string;
  referenceDate?: string;
}

/**
 * Calculates the truthful status chip for a 30-day sprint chunk
 */
export function calculatePlanStatus({
  tasks,
  dailyMinutes,
  chunkStartDate,
  chunkEndDate,
  planStatus = "active",
  timezone = "Asia/Kolkata",
  referenceDate,
}: PlanStatusParams): PlanStatusChip {
  if (planStatus === "paused") return "Paused";
  if (planStatus === "completed") return "Completed";

  const today = referenceDate || todayISO(timezone);

  // 1. Calculate missed tasks (scheduled_date < today and status !== 'done')
  let missedTasksCount = 0;
  let missedMinutes = 0;
  let completedTasksCount = 0;

  for (const task of tasks) {
    if (task.status === "done") {
      completedTasksCount++;
    } else if (task.scheduled_date < today) {
      missedTasksCount++;
      missedMinutes += task.est_minutes || 30;
    }
  }

  // 2. Calculate chunk pacing
  const totalChunkDays = Math.max(1, diffDays(chunkStartDate, chunkEndDate) + 1);
  const daysElapsed = Math.min(
    totalChunkDays,
    Math.max(0, diffDays(chunkStartDate, today) + 1)
  );
  const timeElapsedPercent = Math.round((daysElapsed / totalChunkDays) * 100);

  const totalTasks = tasks.length;
  const completionPercent =
    totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  // Behind condition:
  // Missed minutes exceed 2 days of daily time OR completion is >25 points below time elapsed
  if (
    missedMinutes > dailyMinutes * 2 ||
    (timeElapsedPercent > 30 && completionPercent < timeElapsedPercent - 25)
  ) {
    return "Behind";
  }

  // Catch-up recommended condition:
  // At least one missed task and missed minutes within 2 days of daily time
  if (missedTasksCount > 0) {
    return "Catch-up recommended";
  }

  return "On Track";
}
