import { describe, it, expect } from "vitest";
import { todayISO, addDaysISO, diffDays, dayXofY, chunkDayPosition, chunkDaysLeft } from "../logic/dates";
import { calculateStreak } from "../logic/streak";
import { calculateStageProgress, calculateRoadmapProgress, calculateChunkProgress } from "../logic/progress";
import { calculatePlanStatus } from "../logic/plan-status";
import { calculateChunkSummary } from "../logic/chunk";
import seedData from "../../../supabase/seed-sample.json";

describe("Business Logic - Dates", () => {
  it("formats todayISO correctly as YYYY-MM-DD", () => {
    const today = todayISO("Asia/Kolkata");
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("adds and subtracts days accurately across month boundaries", () => {
    expect(addDaysISO("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDaysISO("2026-11-01", -1)).toBe("2026-10-31");
    expect(addDaysISO("2028-02-28", 1)).toBe("2028-02-29"); // Leap year
  });

  it("calculates day difference accurately", () => {
    expect(diffDays("2026-11-01", "2026-11-30")).toBe(29);
    expect(diffDays("2026-11-01", "2026-11-01")).toBe(0);
  });

  it("calculates Day X of Y clamped between 1 and totalY", () => {
    const result = dayXofY("2026-11-01", "2026-11-30", "Asia/Kolkata");
    expect(result.totalY).toBe(30);
    expect(result.dayX).toBeGreaterThanOrEqual(1);
    expect(result.dayX).toBeLessThanOrEqual(30);
  });
});

describe("Business Logic - Streak Engine", () => {
  it("counts consecutive active days including today", () => {
    const result = calculateStreak({
      datesWithActivity: ["2026-11-01", "2026-11-02", "2026-11-03"],
      referenceDate: "2026-11-03",
      restDays: [0], // Sun
    });
    expect(result.currentStreak).toBe(3);
    expect(result.isStreakSafeToday).toBe(true);
  });

  it("preserves streak across rest days without counting against buffer", () => {
    // Nov 1 = Sun (rest day), Nov 2 = Mon (active), Nov 3 = Tue (active)
    const result = calculateStreak({
      datesWithActivity: ["2026-11-02", "2026-11-03"],
      referenceDate: "2026-11-03",
      restDays: [0], // Sunday is rest
    });
    // Nov 3 active, Nov 2 active, Nov 1 rest day -> 3 days kept!
    expect(result.currentStreak).toBe(3);
    expect(result.bufferDaysUsed).toBe(0);
  });

  it("absorbs missed non-rest days using forgiveness buffer", () => {
    // Nov 3 active, Nov 2 missed (buffer used), Nov 1 active
    const result = calculateStreak({
      datesWithActivity: ["2026-11-01", "2026-11-03"],
      referenceDate: "2026-11-03",
      restDays: [], // No rest days
      forgivenessBuffer: { enabled: true, maxAllowed: 3 },
    });
    expect(result.currentStreak).toBe(3);
    expect(result.bufferDaysUsed).toBe(1);
    expect(result.bufferDaysRemaining).toBe(2);
  });

  it("breaks streak when buffer is exhausted", () => {
    // 4 consecutive missed days with max buffer 2
    const result = calculateStreak({
      datesWithActivity: ["2026-10-25", "2026-11-03"],
      referenceDate: "2026-11-03",
      restDays: [],
      forgivenessBuffer: { enabled: true, maxAllowed: 2 },
    });
    // Only today (Nov 3) counts
    expect(result.currentStreak).toBe(1);
  });
});

describe("Business Logic - Progress Formulas", () => {
  it("computes stage progress and detects completion", () => {
    const stage = seedData.roadmap.stages[0]; // 3 topics: 1.1, 1.2, 1.3
    const res1 = calculateStageProgress(stage, { "1.1": true });
    expect(res1.percent).toBe(33);
    expect(res1.isCompleted).toBe(false);

    const res2 = calculateStageProgress(stage, { "1.1": true, "1.2": true, "1.3": true });
    expect(res2.percent).toBe(100);
    expect(res2.isCompleted).toBe(true);
  });

  it("computes roadmap progress and identifies current active stage", () => {
    const roadmap = seedData.roadmap;
    // Stage 1 completed
    const doneMap: Record<string, boolean> = {
      "1.1": true,
      "1.2": true,
      "1.3": true,
    };
    const res = calculateRoadmapProgress(roadmap, doneMap);
    expect(res.doneCount).toBe(3);
    expect(res.totalCount).toBe(12);
    expect(res.percent).toBe(25);
    expect(res.currentStageId).toBe(2); // Stage 2 is first incomplete
  });
});

describe("Business Logic - Plan Status Pacing", () => {
  it("reports 'On Track' when no tasks are missed", () => {
    const tasks = [
      { status: "todo", scheduled_date: "2026-11-05", est_minutes: 30 },
      { status: "done", scheduled_date: "2026-11-04", est_minutes: 40 },
    ];
    const status = calculatePlanStatus({
      tasks,
      dailyMinutes: 120,
      chunkStartDate: "2026-11-01",
      chunkEndDate: "2026-11-30",
      referenceDate: "2026-11-04",
    });
    expect(status).toBe("On Track");
  });

  it("reports 'Catch-up recommended' when a past task is unfinished", () => {
    const tasks = [
      { status: "todo", scheduled_date: "2026-11-02", est_minutes: 40 }, // Missed
      { status: "todo", scheduled_date: "2026-11-04", est_minutes: 40 },
    ];
    const status = calculatePlanStatus({
      tasks,
      dailyMinutes: 120,
      chunkStartDate: "2026-11-01",
      chunkEndDate: "2026-11-30",
      referenceDate: "2026-11-04",
    });
    expect(status).toBe("Catch-up recommended");
  });

  it("reports 'Behind' when missed minutes exceed 2 days of daily commitment", () => {
    const tasks = [
      { status: "todo", scheduled_date: "2026-11-01", est_minutes: 150 }, // Missed
      { status: "todo", scheduled_date: "2026-11-02", est_minutes: 150 }, // Missed (Total 300m > 240m)
      { status: "todo", scheduled_date: "2026-11-04", est_minutes: 40 },
    ];
    const status = calculatePlanStatus({
      tasks,
      dailyMinutes: 120, // 2 days = 240m
      chunkStartDate: "2026-11-01",
      chunkEndDate: "2026-11-30",
      referenceDate: "2026-11-04",
    });
    expect(status).toBe("Behind");
  });
});
