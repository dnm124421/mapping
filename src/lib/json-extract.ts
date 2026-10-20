import { z } from "zod";
import { RoadmapSchema, PlanSchema, type Roadmap, type Plan } from "./schemas";

export interface DiagnosticStats {
  stageCount?: number;
  topicCount?: number;
  totalWeeks?: number;
  dayCount?: number;
  taskCount?: number;
  totalMinutes?: number;
}

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
  stats: DiagnosticStats;
}

/**
 * Strips markdown fences and extracts substring from first '{' to last '}'
 */
export function extractJsonString(rawText: string): {
  extracted: string;
  error?: string;
} {
  if (!rawText || typeof rawText !== "string") {
    return {
      extracted: "",
      error: "Please paste the JSON answer from your AI.",
    };
  }

  let text = rawText.trim();

  // Strip leading/trailing code fence
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return {
      extracted: "",
      error: "I could not find any JSON here. Paste the full answer from your AI.",
    };
  }

  return {
    extracted: text.substring(firstBrace, lastBrace + 1),
  };
}

/**
 * Tolerant JSON string repair:
 * - Smart quotes replaced
 * - Trailing commas removed
 * - Single-line comments removed
 */
export function repairJsonString(jsonStr: string): string {
  let repaired = jsonStr;

  // Replace smart / curly double quotes
  repaired = repaired.replace(/[\u201C\u201D]/g, '"');
  // Replace smart / curly single quotes
  repaired = repaired.replace(/[\u2018\u2019]/g, "'");

  // Remove single line comments: // comment (simple regex avoiding http:// or https://)
  repaired = repaired.replace(/(?<!https?:)\/\/.*$/gm, "");

  // Remove trailing commas before } or ]
  repaired = repaired.replace(/,(\s*[}\]])/g, "$1");

  return repaired;
}

/**
 * Attempts to parse JSON string directly, falling back to repaired string
 */
export function parseTolerantJson(rawText: string): {
  ok: boolean;
  data?: any;
  error?: string;
} {
  const { extracted, error: extractErr } = extractJsonString(rawText);
  if (extractErr) {
    return { ok: false, error: extractErr };
  }

  // First attempt: standard JSON.parse
  try {
    const data = JSON.parse(extracted);
    return { ok: true, data };
  } catch (err1) {
    // Second attempt: repaired JSON
    try {
      const repaired = repairJsonString(extracted);
      const data = JSON.parse(repaired);
      return { ok: true, data };
    } catch (err2: any) {
      return {
        ok: false,
        error: `Could not read JSON (${err2.message || "Syntax error"}). Ask your AI: "Return only valid JSON, no extra text."`,
      };
    }
  }
}

/**
 * Formats Zod issues into friendly, human-readable lines
 */
function formatZodIssues(issues: z.ZodIssue[], maxIssues = 8): string[] {
  const formatted = issues.slice(0, maxIssues).map((issue) => {
    const pathStr = issue.path.join(".");
    // Stage and topic specific messages
    if (issue.path[0] === "stages" && typeof issue.path[1] === "number") {
      const stageIdx = issue.path[1] + 1;
      if (issue.path[2] === "topics" && typeof issue.path[3] === "number") {
        const topicIdx = issue.path[3] + 1;
        const field = issue.path.slice(4).join(" ") || "property";
        return `Stage ${stageIdx}, Topic #${topicIdx}: ${issue.message} (${field})`;
      }
      const field = issue.path.slice(2).join(" ") || "field";
      return `Stage ${stageIdx}: ${issue.message} (${field})`;
    }

    // Day and task specific messages
    if (issue.path[0] === "days" && typeof issue.path[1] === "number") {
      const dayIdx = issue.path[1] + 1;
      if (issue.path[2] === "tasks" && typeof issue.path[3] === "number") {
        const taskIdx = issue.path[3] + 1;
        const field = issue.path.slice(4).join(" ") || "property";
        return `Day ${dayIdx}, Task #${taskIdx}: ${issue.message} (${field})`;
      }
      return `Day ${dayIdx}: ${issue.message}`;
    }

    return `${pathStr ? pathStr + ": " : ""}${issue.message}`;
  });

  if (issues.length > maxIssues) {
    formatted.push(`...and ${issues.length - maxIssues} more issues.`);
  }

  return formatted;
}

/**
 * Validates a Roadmap payload against Canonical RoadmapSchema
 */
export function validateRoadmapJson(rawText: string): ValidationResult<Roadmap> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: DiagnosticStats = {};

  const parseResult = parseTolerantJson(rawText);
  if (!parseResult.ok || !parseResult.data) {
    return {
      ok: false,
      errors: [parseResult.error || "Invalid JSON"],
      warnings,
      stats,
    };
  }

  const payload = parseResult.data;

  // Check if user accidentally pasted a Plan
  if (payload.days || payload.chunk) {
    return {
      ok: false,
      errors: [
        "This looks like a 30-day daily plan, not a roadmap. Please use Prompt A to generate a roadmap first.",
      ],
      warnings,
      stats,
    };
  }

  const result = RoadmapSchema.safeParse(payload);
  if (!result.success) {
    return {
      ok: false,
      errors: formatZodIssues(result.error.issues),
      warnings,
      stats,
    };
  }

  const roadmap = result.data;

  // Check stage count warning (recommends 4 to 5)
  if (roadmap.stages.length < 4 || roadmap.stages.length > 5) {
    warnings.push(
      `Found ${roadmap.stages.length} stages. Recommended is 4 to 5 stages for optimal pacing.`
    );
  }

  // Deduplicate and verify topic IDs
  const seenIds = new Set<string>();
  let totalTopics = 0;
  let totalEstWeeks = 0;

  for (const stage of roadmap.stages) {
    totalEstWeeks += stage.est_weeks || 0;
    for (const topic of stage.topics) {
      totalTopics++;
      if (seenIds.has(topic.id)) {
        const newId = `${topic.id}-${Math.floor(Math.random() * 1000)}`;
        warnings.push(`Duplicate topic ID "${topic.id}" was renamed to "${newId}".`);
        topic.id = newId;
      } else {
        seenIds.add(topic.id);
      }
    }
  }

  stats.stageCount = roadmap.stages.length;
  stats.topicCount = totalTopics;
  stats.totalWeeks = totalEstWeeks;

  return {
    ok: true,
    data: roadmap,
    errors,
    warnings,
    stats,
  };
}

/**
 * Validates a Plan payload against Canonical PlanSchema and optionally cross-references a roadmap
 */
export function validatePlanJson(
  rawText: string,
  referenceRoadmap?: Roadmap
): ValidationResult<Plan> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: DiagnosticStats = {};

  const parseResult = parseTolerantJson(rawText);
  if (!parseResult.ok || !parseResult.data) {
    return {
      ok: false,
      errors: [parseResult.error || "Invalid JSON"],
      warnings,
      stats,
    };
  }

  const payload = parseResult.data;

  // Check if user accidentally pasted a Roadmap
  if (payload.stages && !payload.days) {
    return {
      ok: false,
      errors: [
        "This looks like a roadmap, not a daily plan. Please use Prompt B to generate the 30-day plan.",
      ],
      warnings,
      stats,
    };
  }

  const result = PlanSchema.safeParse(payload);
  if (!result.success) {
    return {
      ok: false,
      errors: formatZodIssues(result.error.issues),
      warnings,
      stats,
    };
  }

  const plan = result.data;

  // Normalise: Recompute all dates as start_date + (day - 1)
  const baseStart = new Date(plan.start_date);
  let hasDateMismatch = false;
  let totalTasks = 0;
  let totalMinutes = 0;

  // Roadmap reference lookup set
  const validTopicRefs = new Set<string>();
  if (referenceRoadmap) {
    for (const stage of referenceRoadmap.stages) {
      for (const topic of stage.topics) {
        validTopicRefs.add(topic.id);
      }
    }
  }

  // Check continuous days (1..N)
  for (let i = 0; i < plan.days.length; i++) {
    const day = plan.days[i];
    const expectedDayNumber = (plan.chunk.from_day || 1) + i;

    if (day.day !== expectedDayNumber) {
      errors.push(
        `Days must be continuous. Found day #${day.day} at index ${i + 1}, expected day #${expectedDayNumber}.`
      );
    }

    // Recompute date accurately
    const targetDate = new Date(baseStart.getTime() + (day.day - 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    if (day.date && day.date !== targetDate) {
      hasDateMismatch = true;
    }
    day.date = targetDate;

    // Check task counts and references
    if (day.tasks) {
      totalTasks += day.tasks.length;
      for (const task of day.tasks) {
        totalMinutes += task.est_minutes || 0;
        if (
          referenceRoadmap &&
          task.roadmap_ref &&
          !validTopicRefs.has(task.roadmap_ref)
        ) {
          warnings.push(
            `Task "${task.title}" references topic id "${task.roadmap_ref}" which is not found in the roadmap.`
          );
        }
      }
    }
  }

  if (hasDateMismatch) {
    warnings.push(
      "Some dates from AI were adjusted to match start date + day position."
    );
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings, stats };
  }

  stats.dayCount = plan.days.length;
  stats.taskCount = totalTasks;
  stats.totalMinutes = totalMinutes;

  return {
    ok: true,
    data: plan,
    errors,
    warnings,
    stats,
  };
}
