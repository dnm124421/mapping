import { type Roadmap, type Stage } from "../schemas";

export interface ProgressSummary {
  doneCount: number;
  totalCount: number;
  percent: number;
}

/**
 * Calculates completion percentage and status for a single stage
 */
export function calculateStageProgress(
  stage: Stage,
  topicDoneMap: Record<string, boolean>
): ProgressSummary & { isCompleted: boolean } {
  const totalCount = stage.topics.length;
  if (totalCount === 0) {
    return { doneCount: 0, totalCount: 0, percent: 100, isCompleted: true };
  }

  let doneCount = 0;
  for (const topic of stage.topics) {
    if (topicDoneMap[topic.id] === true) {
      doneCount++;
    }
  }

  const percent = Math.round((doneCount / totalCount) * 100);
  return {
    doneCount,
    totalCount,
    percent,
    isCompleted: doneCount === totalCount,
  };
}

/**
 * Calculates overall roadmap progress and identifies the active/current stage
 */
export function calculateRoadmapProgress(
  roadmap: Roadmap,
  topicDoneMap: Record<string, boolean>
): ProgressSummary & { currentStageId: number } {
  let totalTopics = 0;
  let doneTopics = 0;
  let currentStageId = roadmap.stages[0]?.id || 1;
  let foundIncomplete = false;

  for (const stage of roadmap.stages) {
    const stageRes = calculateStageProgress(stage, topicDoneMap);
    totalTopics += stageRes.totalCount;
    doneTopics += stageRes.doneCount;

    if (!foundIncomplete && !stageRes.isCompleted) {
      currentStageId = stage.id;
      foundIncomplete = true;
    }
  }

  // If all stages are completed, active stage is the last stage
  if (!foundIncomplete && roadmap.stages.length > 0) {
    currentStageId = roadmap.stages[roadmap.stages.length - 1].id;
  }

  const percent = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

  return {
    doneCount: doneTopics,
    totalCount: totalTopics,
    percent,
    currentStageId,
  };
}

/**
 * Calculates chunk task completion percentage
 */
export function calculateChunkProgress(
  tasks: Array<{ status: string }>
): ProgressSummary {
  const totalCount = tasks.length;
  if (totalCount === 0) return { doneCount: 0, totalCount: 0, percent: 0 };

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const percent = Math.round((doneCount / totalCount) * 100);

  return { doneCount, totalCount, percent };
}

/**
 * Calculates today's target completion (done tasks / total scheduled for today)
 */
export function calculateTodayTarget(
  todayTasks: Array<{ status: string }>
): ProgressSummary {
  const totalCount = todayTasks.length;
  if (totalCount === 0) return { doneCount: 0, totalCount: 0, percent: 100 };

  const doneCount = todayTasks.filter((t) => t.status === "done").length;
  const percent = Math.round((doneCount / totalCount) * 100);

  return { doneCount, totalCount, percent };
}
