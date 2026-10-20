import { z } from "zod";

// Helper for AI responses that return numbers as strings (e.g. "45")
const num = z.coerce.number();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

// Canonical Topic Schema
export const TopicResourceSchema = z.object({
  title: z.string().default(""),
  url: z
    .string()
    .refine((u) => u === "" || /^https?:\/\//i.test(u), {
      message: "Resource URL must start with http:// or https://",
    })
    .default(""),
});

export const TopicSchema = z.object({
  id: z.coerce.string().min(1, "Topic id is required"),
  title: z.string().min(1, "Topic title is required"),
  subtopics: z.array(z.string()).default([]),
  resources: z.array(TopicResourceSchema).default([]),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  est_minutes: num.int().positive().optional(),
  deliverable: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
});

// Canonical Stage Schema
export const StageSchema = z.object({
  id: num.int().positive("Stage id must be a positive integer"),
  title: z.string().min(1, "Stage title is required"),
  goal: z.string().default(""),
  est_weeks: num.positive().default(2),
  focus_archetype: z
    .enum(["theory", "project", "practice", "interview", "revision"])
    .optional(),
  topics: z.array(TopicSchema).min(1, "Stage must contain at least 1 topic"),
});

// Canonical Roadmap Schema
export const RoadmapSchema = z.object({
  skill: z.string().min(1, "Skill name is required"),
  level: z.string().default("beginner"),
  summary: z.string().optional(),
  stages: z
    .array(StageSchema)
    .min(2, "Roadmap must have at least 2 stages")
    .max(8, "Roadmap can have at most 8 stages"),
});

// Task Checklist Item (handles both string and object)
export const ChecklistItemSchema = z.union([
  z.string().transform((text) => ({ text, done: false })),
  z.object({
    text: z.string().min(1),
    done: z.boolean().default(false),
  }),
]);

// Canonical Task Schema
export const TaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  est_minutes: num.int().min(5).max(480).default(30),
  roadmap_ref: z.coerce.string().default(""),
  kind: z
    .enum(["learn", "practice", "project", "revision", "review"])
    .optional(),
  checklist: z.array(ChecklistItemSchema).max(5).default([]),
});

// Canonical Day Schema (1 to 30 days)
export const DaySchema = z.object({
  day: num.int().positive("Day number must be positive"),
  date: isoDate.optional(), // Ignored and recomputed from start_date + (day - 1)
  focus: z.string().default(""),
  tasks: z
    .array(TaskSchema)
    .min(1, "Each day must have at least 1 task")
    .max(6, "Each day can have at most 6 tasks"),
});

// Canonical Plan Schema (One 30-day chunk)
export const PlanSchema = z.object({
  skill: z.string().min(1, "Skill name is required"),
  start_date: isoDate,
  deadline: isoDate,
  chunk: z.object({
    number: num.int().positive(),
    from_day: num.int().positive(),
    to_day: num.int().positive(),
  }),
  days: z
    .array(DaySchema)
    .min(1, "Plan must contain at least 1 day")
    .max(31, "Plan chunk can contain at most 31 days"),
});

// TypeScript Types
export type Topic = z.infer<typeof TopicSchema>;
export type Stage = z.infer<typeof StageSchema>;
export type Roadmap = z.infer<typeof RoadmapSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Day = z.infer<typeof DaySchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
