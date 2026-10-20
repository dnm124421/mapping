export interface ChunkSummary {
  completion_rate: number; // 0 to 100
  total_tasks: number;
  done_tasks: number;
  days_completed: number;
  total_focus_minutes: number;
  topics_mastered: string[];
  needs_polish: string[];
  rescheduled_finished: number;
  streak_at_end: number;
}

export interface ChunkTask {
  id: string;
  status: string;
  scheduled_date: string;
  original_date?: string | null;
  est_minutes: number;
  roadmap_ref?: string | null;
}

export interface ChunkDay {
  date: string;
  tasks: ChunkTask[];
}

export function calculateChunkSummary({
  days,
  focusSessionMinutes = 0,
  topicDoneMap = {},
  currentStreak = 0,
}: {
  days: ChunkDay[];
  focusSessionMinutes?: number;
  topicDoneMap?: Record<string, boolean>;
  currentStreak?: number;
}): ChunkSummary {
  let totalTasks = 0;
  let doneTasks = 0;
  let daysCompleted = 0;
  let estimatedDoneMinutes = 0;
  let rescheduledFinished = 0;

  const masteredTopicSet = new Set<string>();
  const unfinishedTopicSet = new Set<string>();

  for (const day of days) {
    const dayTasks = day.tasks || [];
    if (dayTasks.length === 0) continue;

    let dayAllDone = true;

    for (const task of dayTasks) {
      totalTasks++;
      const isDone = task.status === "done";

      if (isDone) {
        doneTasks++;
        estimatedDoneMinutes += task.est_minutes || 30;

        // Check if task was rescheduled and completed
        if (task.original_date && task.original_date !== task.scheduled_date) {
          rescheduledFinished++;
        }

        if (task.roadmap_ref && topicDoneMap[task.roadmap_ref]) {
          masteredTopicSet.add(task.roadmap_ref);
        }
      } else {
        dayAllDone = false;
        if (task.roadmap_ref) {
          unfinishedTopicSet.add(task.roadmap_ref);
        }
      }
    }

    if (dayAllDone && dayTasks.length > 0) {
      daysCompleted++;
    }
  }

  // Remove topics from needs_polish if they are fully mastered
  masteredTopicSet.forEach((ref) => {
    unfinishedTopicSet.delete(ref);
  });

  const completion_rate =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Use actual logged session minutes if available, otherwise estimated minutes
  const total_focus_minutes = Math.max(focusSessionMinutes, estimatedDoneMinutes);

  return {
    completion_rate,
    total_tasks: totalTasks,
    done_tasks: doneTasks,
    days_completed: daysCompleted,
    total_focus_minutes,
    topics_mastered: Array.from(masteredTopicSet),
    needs_polish: Array.from(unfinishedTopicSet),
    rescheduled_finished: rescheduledFinished,
    streak_at_end: currentStreak,
  };
}
