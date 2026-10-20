import { describe, it, expect } from "vitest";
import { RoadmapSchema, PlanSchema } from "../schemas";
import seedData from "../../../supabase/seed-sample.json";

describe("Canonical Zod Schemas", () => {
  it("validates sample roadmap from Appendix A correctly", () => {
    const result = RoadmapSchema.safeParse(seedData.roadmap);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skill).toBe("DSA in C++");
      expect(result.data.stages.length).toBe(4);
    }
  });

  it("validates sample plan from Appendix A correctly", () => {
    const result = PlanSchema.safeParse(seedData.plan);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days.length).toBe(3);
      expect(result.data.chunk.number).toBe(1);
    }
  });

  it("fails when a stage has no topics", () => {
    const badRoadmap = {
      skill: "Test Skill",
      stages: [
        { id: 1, title: "Stage 1", topics: [] },
        { id: 2, title: "Stage 2", topics: [{ id: "2.1", title: "Topic 2.1" }] },
      ],
    };
    const result = RoadmapSchema.safeParse(badRoadmap);
    expect(result.success).toBe(false);
  });

  it("coerces numeric strings for est_minutes and stage id", () => {
    const stringNumbersRoadmap = {
      skill: "Test Skill",
      stages: [
        {
          id: "1",
          title: "Stage 1",
          est_weeks: "3",
          topics: [{ id: "1.1", title: "Topic 1", est_minutes: "45" }],
        },
        {
          id: "2",
          title: "Stage 2",
          est_weeks: "2",
          topics: [{ id: "2.1", title: "Topic 2", est_minutes: "60" }],
        },
      ],
    };
    const result = RoadmapSchema.safeParse(stringNumbersRoadmap);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.stages[0].id).toBe("number");
      expect(result.data.stages[0].id).toBe(1);
      expect(result.data.stages[0].topics[0].est_minutes).toBe(45);
    }
  });
});
