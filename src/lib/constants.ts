export const APP_NAME = "Roadmap Planner";
export const APP_TAGLINE = "Master any skill";
export const CHUNK_DAYS = 30;
export const ALERT_DAYS = 7;
export const STREAK_MILESTONES = [7, 14, 21, 30, 50, 100];

export const DEFAULT_TIMEZONE = "Asia/Kolkata";
export const DEFAULT_DAILY_MINUTES = 120;
export const DEFAULT_FORGIVENESS_BUFFER = 3;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  ONBOARDING: "/onboarding",
  ROADMAPS: "/roadmaps",
  NEW_ROADMAP: "/roadmaps/new",
  ROADMAP_DETAIL: (id: string) => `/roadmaps/${id}`,
  PLANS: "/plans",
  NEW_PLAN: "/plans/new",
  PLAN_DETAIL: (id: string) => `/plans/${id}`,
  CHUNK_END: (id: string) => `/plans/${id}/chunk-end`,
  FOCUS: (taskId: string) => `/focus/${taskId}`,
  HISTORY: "/history",
  SETTINGS: "/settings",
};
