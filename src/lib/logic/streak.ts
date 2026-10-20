import { todayISO, addDaysISO, diffDays } from "./dates";
import { STREAK_MILESTONES } from "../constants";

export interface StreakParams {
  datesWithActivity: string[]; // List of YYYY-MM-DD dates where activity occurred
  restDays?: number[]; // Day of week numbers: 0 = Sun, 1 = Mon ... 6 = Sat
  forgivenessBuffer?: {
    enabled: boolean;
    maxAllowed: number;
    usedDates?: string[];
  };
  timezone?: string;
  referenceDate?: string; // Optional for deterministic testing, defaults to today
}

export interface StreakResult {
  currentStreak: number;
  bestStreak: number;
  nextMilestone: number;
  isStreakSafeToday: boolean;
  bufferDaysUsed: number;
  bufferDaysRemaining: number;
}

/**
 * Checks if a day of the week is a user's rest day (0 = Sun, 6 = Sat)
 */
export function isRestDay(dateStr: string, restDays: number[] = [0]): boolean {
  if (restDays.length === 0) return false;
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return restDays.includes(date.getUTCDay());
}

/**
 * Calculates user streak accurately considering rest days, forgiveness buffer, and timezone boundaries.
 */
export function calculateStreak({
  datesWithActivity,
  restDays = [0], // Default Sunday rest day
  forgivenessBuffer = { enabled: true, maxAllowed: 3, usedDates: [] },
  timezone = "Asia/Kolkata",
  referenceDate,
}: StreakParams): StreakResult {
  const today = referenceDate || todayISO(timezone);
  const activeSet = new Set(datesWithActivity);

  // If there are no active dates at all, streak is 0
  if (datesWithActivity.length === 0) {
    const isTodayRest = isRestDay(today, restDays);
    return {
      currentStreak: 0,
      bestStreak: 0,
      nextMilestone: STREAK_MILESTONES[0],
      isStreakSafeToday: isTodayRest,
      bufferDaysUsed: 0,
      bufferDaysRemaining: forgivenessBuffer.enabled ? forgivenessBuffer.maxAllowed : 0,
    };
  }

  // Find the earliest active date in history
  const sortedDates = [...datesWithActivity].sort();
  const earliestActiveDate = sortedDates[0];

  const hasActivityToday = activeSet.has(today);
  const isTodayRest = isRestDay(today, restDays);
  const isStreakSafeToday = hasActivityToday || isTodayRest;

  // Streak evaluation starts from today (if completed/rest) or yesterday
  let checkDate = isStreakSafeToday ? today : addDaysISO(today, -1);

  let currentStreak = 0;
  let totalBufferUsed = 0;
  const maxBuffer = forgivenessBuffer.enabled ? forgivenessBuffer.maxAllowed : 0;

  // Temporary accumulator for an unbridged gap of missed days
  let pendingBufferCount = 0;
  let safetyLoopCounter = 0;

  while (safetyLoopCounter < 1000) {
    safetyLoopCounter++;

    const hasActivity = activeSet.has(checkDate);
    const isRest = isRestDay(checkDate, restDays);

    // If we've walked past the earliest recorded activity date:
    // Only contiguous rest days immediately before the active start can be kept.
    // Non-rest inactive days before earliest activity cannot be buffered.
    if (checkDate < earliestActiveDate) {
      if (isRest && pendingBufferCount === 0) {
        currentStreak += 1;
        checkDate = addDaysISO(checkDate, -1);
        continue;
      } else {
        break;
      }
    }

    if (hasActivity) {
      // Bridged! All pending buffer days (if any) are confirmed as forgiven
      currentStreak += 1 + pendingBufferCount;
      totalBufferUsed += pendingBufferCount;
      pendingBufferCount = 0;
    } else if (isRest) {
      // Rest day keeps the streak without consuming buffer
      currentStreak += 1;
    } else {
      // Inactive, non-rest day: can only be bridged if remaining buffer allows
      if (totalBufferUsed + pendingBufferCount < maxBuffer) {
        pendingBufferCount++;
      } else {
        // Gap cannot be bridged by available buffer. Streak ends here.
        break;
      }
    }

    checkDate = addDaysISO(checkDate, -1);
  }

  // Calculate next milestone
  const nextMilestone =
    STREAK_MILESTONES.find((m) => m > currentStreak) || 100;

  const bestStreak = Math.max(currentStreak, datesWithActivity.length);

  return {
    currentStreak,
    bestStreak,
    nextMilestone,
    isStreakSafeToday,
    bufferDaysUsed: totalBufferUsed,
    bufferDaysRemaining: Math.max(0, maxBuffer - totalBufferUsed),
  };
}
