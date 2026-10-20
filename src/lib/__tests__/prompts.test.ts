import { describe, it, expect } from "vitest";
import {
  buildPromptA,
  buildPromptB,
  buildPromptC,
  buildDoubtPrompt,
  buildQuizPrompt,
  buildAnalogyPrompt,
} from "../prompts";

describe("Prompt Template Builders", () => {
  it("builds Prompt A with filled parameters and strict JSON structure", () => {
    const prompt = buildPromptA({
      skill: "System Design",
      level: "intermediate",
      hoursPerDay: 3,
      daysPerWeek: 5,
      horizonMonths: 4,
      balance: "High-scale projects",
      customInstructions: "Include Redis and Kafka.",
      tone: "english",
    });

    expect(prompt).toContain("I want to learn: System Design");
    expect(prompt).toContain("My current level: intermediate");
    expect(prompt).toContain("3 hours per day, 5 days per week");
    expect(prompt).toContain("Custom instructions: Include Redis and Kafka.");
    expect(prompt).toContain('"skill":""');
    expect(prompt).toContain('"stages":[');
  });

  it("builds Prompt B with roadmap JSON and 30-day chunk constraints", () => {
    const prompt = buildPromptB({
      roadmapJson: { skill: "Python" },
      startDate: "2026-11-01",
      deadline: "2027-11-01",
      hoursPerDay: 2,
      restDays: "Sunday",
    });

    expect(prompt).toContain("Start date: 2026-11-01");
    expect(prompt).toContain("Deadline: 2027-11-01");
    expect(prompt).toContain("Daily study time: 2 hours");
    expect(prompt).toContain("FIRST 30 DAYS in detail (days 1 to 30)");
    expect(prompt).toContain('"chunk":{"number":1,"from_day":1,"to_day":30}');
  });

  it("builds Prompt C with auto-filled progress and reflection", () => {
    const prompt = buildPromptC({
      roadmapJson: { skill: "Python" },
      deadline: "2027-11-01",
      nextChunkNumber: 2,
      fromDay: 31,
      toDay: 60,
      startDate: "2026-12-01",
      hoursPerDay: 2,
      prevChunkNumber: 1,
      percent: 90,
      doneTasks: 54,
      totalTasks: 60,
      doneTopics: "1.1, 1.2",
      missedTopics: "1.3",
      reflection: "Pointers needed more drills",
      overallPercent: 25,
    });

    expect(prompt).toContain("Next chunk number: 2");
    expect(prompt).toContain("days 31 to 60");
    expect(prompt).toContain("completion 90%");
    expect(prompt).toContain("Topics completed: 1.1, 1.2");
    expect(prompt).toContain("Topics missed or unfinished (put these FIRST): 1.3");
    expect(prompt).toContain("Weak spots from my reflection: Pointers needed more drills");
  });

  it("builds doubt and quiz helper prompts", () => {
    const doubt = buildDoubtPrompt("Pointer arithmetic", "Pointers", "C++", "hinglish");
    expect(doubt).toContain("I am learning C++");
    expect(doubt).toContain("Pointer arithmetic");
    expect(doubt).toContain("Explain in simple Hinglish");

    const quiz = buildQuizPrompt("Trees", "DSA", "english");
    expect(quiz).toContain("15-minute quiz");
    expect(quiz).toContain("Trees");
  });
});
