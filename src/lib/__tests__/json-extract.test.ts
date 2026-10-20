import { describe, it, expect } from "vitest";
import {
  extractJsonString,
  repairJsonString,
  parseTolerantJson,
  validateRoadmapJson,
  validatePlanJson,
} from "../json-extract";
import seedData from "../../../supabase/seed-sample.json";

describe("Tolerant JSON Engine", () => {
  it("extracts JSON wrapped in markdown code fence and conversational text", () => {
    const raw = `Here is your generated roadmap for C++:
\`\`\`json
{
  "skill": "C++",
  "stages": [
    { "id": 1, "title": "Basics", "topics": [{ "id": "1.1", "title": "Intro" }] },
    { "id": 2, "title": "OOP", "topics": [{ "id": "2.1", "title": "Classes" }] }
  ]
}
\`\`\`
Hope this helps! Let me know if you need more details.`;

    const { extracted, error } = extractJsonString(raw);
    expect(error).toBeUndefined();
    expect(extracted.startsWith("{")).toBe(true);
    expect(extracted.endsWith("}")).toBe(true);
    const parsed = JSON.parse(extracted);
    expect(parsed.skill).toBe("C++");
  });

  it("repairs smart curly quotes and trailing commas", () => {
    const badJson = `{
      “skill”: “Python”,
      “stages”: [
        { “id”: 1, “title”: “Basics”, “topics”: [{ “id”: “1.1”, “title”: “Syntax”, }], },
        { “id”: 2, “title”: “OOP”, “topics”: [{ “id”: “2.1”, “title”: “Objects”, }], },
      ],
    }`;

    const repaired = repairJsonString(badJson);
    const result = parseTolerantJson(repaired);
    expect(result.ok).toBe(true);
    expect(result.data.skill).toBe("Python");
  });

  it("returns a friendly error and never throws on completely invalid text", () => {
    const invalidText = "I cannot fulfill this prompt because I am an AI.";
    const result = parseTolerantJson(invalidText);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("I could not find any JSON here");
  });

  it("returns human-readable error when a stage is missing title", () => {
    const missingTitleRoadmap = JSON.stringify({
      skill: "Web Dev",
      stages: [
        { id: 1, topics: [{ id: "1.1", title: "HTML" }] },
        { id: 2, title: "CSS", topics: [{ id: "2.1", title: "Flexbox" }] },
      ],
    });

    const res = validateRoadmapJson(missingTitleRoadmap);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("Stage 1") && e.includes("title"))).toBe(true);
  });

  it("recomputes plan dates and warns if AI returned mismatched dates", () => {
    const planWithWrongDates = JSON.stringify({
      skill: "DSA in C++",
      start_date: "2026-11-01",
      deadline: "2027-11-01",
      chunk: { number: 1, from_day: 1, to_day: 2 },
      days: [
        {
          day: 1,
          date: "1999-01-01", // Mismatched AI date
          focus: "Basics",
          tasks: [{ title: "Task 1", est_minutes: 30 }],
        },
        {
          day: 2,
          date: "1999-01-02",
          focus: "Conditionals",
          tasks: [{ title: "Task 2", est_minutes: 30 }],
        },
      ],
    });

    const res = validatePlanJson(planWithWrongDates);
    expect(res.ok).toBe(true);
    expect(res.data?.days[0].date).toBe("2026-11-01");
    expect(res.data?.days[1].date).toBe("2026-11-02");
    expect(res.warnings.some((w) => w.includes("adjusted"))).toBe(true);
  });

  it("detects when user pasted a plan into the roadmap validator", () => {
    const planJson = JSON.stringify(seedData.plan);
    const res = validateRoadmapJson(planJson);
    expect(res.ok).toBe(false);
    expect(res.errors[0]).toContain("This looks like a 30-day daily plan, not a roadmap");
  });

  it("auto-suffixes duplicate topic IDs and gives a warning", () => {
    const duplicateIds = JSON.stringify({
      skill: "Test",
      stages: [
        {
          id: 1,
          title: "S1",
          topics: [
            { id: "1.1", title: "T1" },
            { id: "1.1", title: "T2" }, // Duplicate ID
          ],
        },
        { id: 2, title: "S2", topics: [{ id: "2.1", title: "T3" }] },
      ],
    });

    const res = validateRoadmapJson(duplicateIds);
    expect(res.ok).toBe(true);
    expect(res.warnings.some((w) => w.includes("Duplicate topic ID"))).toBe(true);
    expect(res.data?.stages[0].topics[0].id).not.toBe(res.data?.stages[0].topics[1].id);
  });
});
