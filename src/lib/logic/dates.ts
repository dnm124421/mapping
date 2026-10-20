/**
 * Returns current date in YYYY-MM-DD format for a given timezone.
 * Uses 'en-CA' locale which outputs ISO format YYYY-MM-DD.
 */
export function todayISO(timezone = "Asia/Kolkata"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    // Fallback if timezone string is invalid
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Adds integer days to an ISO date string (YYYY-MM-DD)
 */
export function addDaysISO(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * Computes difference in calendar days between two ISO dates (endDate - startDate)
 */
export function diffDays(startDateStr: string, endDateStr: string): number {
  const [y1, m1, d1] = startDateStr.split("-").map(Number);
  const [y2, m2, d2] = endDateStr.split("-").map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / msPerDay);
}

/**
 * Day X of Y calculation for a multi-month or 1-year plan:
 * X = days from start_date to today inclusive (clamped between 1 and Y)
 * Y = days from start_date to deadline inclusive
 */
export function dayXofY(
  startDateStr: string,
  deadlineStr: string,
  timezone = "Asia/Kolkata"
): { dayX: number; totalY: number; percent: number } {
  const today = todayISO(timezone);
  const totalY = Math.max(1, diffDays(startDateStr, deadlineStr) + 1);
  const daysSinceStart = diffDays(startDateStr, today) + 1;
  const dayX = Math.min(totalY, Math.max(1, daysSinceStart));
  const percent = Math.min(100, Math.max(0, Math.round((dayX / totalY) * 100)));

  return { dayX, totalY, percent };
}

/**
 * Position inside current 30-day chunk (1 to 30)
 */
export function chunkDayPosition(
  chunkStartDateStr: string,
  timezone = "Asia/Kolkata"
): number {
  const today = todayISO(timezone);
  const days = diffDays(chunkStartDateStr, today) + 1;
  return Math.min(30, Math.max(1, days));
}

/**
 * Days remaining in current chunk (minimum 0)
 */
export function chunkDaysLeft(
  chunkEndDateStr: string,
  timezone = "Asia/Kolkata"
): number {
  const today = todayISO(timezone);
  const remaining = diffDays(today, chunkEndDateStr);
  return Math.max(0, remaining);
}

/**
 * Converts UTC timestamp to YYYY-MM-DD in user's timezone
 */
export function timestampToDateISO(
  utcTimestamp: string | Date,
  timezone = "Asia/Kolkata"
): string {
  try {
    const date = new Date(utcTimestamp);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return new Date(utcTimestamp).toISOString().split("T")[0];
  }
}
