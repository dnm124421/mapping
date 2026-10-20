export interface PromptAParams {
  skill: string;
  level: string;
  hoursPerDay: number;
  daysPerWeek?: number;
  horizonMonths?: number;
  balance?: string;
  customInstructions?: string;
  tone?: "english" | "hinglish";
}

export function buildPromptA({
  skill,
  level,
  hoursPerDay,
  daysPerWeek = 6,
  horizonMonths = 6,
  balance = "practical projects, interview drills, theory",
  customInstructions = "",
  tone = "english",
}: PromptAParams): string {
  const toneHint =
    tone === "hinglish"
      ? "\nNote: Write topic descriptions in friendly Hinglish (Hindi + English in Roman script) if appropriate."
      : "";

  const customHint = customInstructions.trim()
    ? `\nCustom instructions: ${customInstructions.trim()}`
    : "";

  return `You are an expert learning coach and curriculum designer.
I want to learn: ${skill}
My current level: ${level}
I can study about ${hoursPerDay} hours per day, ${daysPerWeek} days per week.
Target horizon: about ${horizonMonths} months.
Focus balance: ${balance}${customHint}${toneHint}

Task:
1. Split this skill into 4 to 5 stages, from basics to advanced.
2. For each stage give a goal, estimated weeks, and the topics (5 to 10 topics per stage).
3. For each topic give subtopics, a difficulty (easy, medium or hard), est_minutes,
   and 1 to 2 good FREE resources with real links.
4. Topic ids must be like "1.1", "1.2", "2.1" (stage number, then topic number).

OUTPUT RULES (very important):
- Return ONLY valid JSON. No text before or after. No markdown, no code fences.
- Use exactly this structure and these key names:
{"skill":"","level":"","summary":"","stages":[{"id":1,"title":"","goal":"","est_weeks":0,"focus_archetype":"theory","topics":[{"id":"1.1","title":"","subtopics":[""],"resources":[{"title":"","url":""}],"difficulty":"easy","est_minutes":0}]}]}`;
}

export interface PromptBParams {
  roadmapJson: string | object;
  startDate: string;
  deadline: string;
  hoursPerDay: number;
  restDays?: string;
  languageStyle?: string;
  customInstructions?: string;
  tone?: "english" | "hinglish";
}

export function buildPromptB({
  roadmapJson,
  startDate,
  deadline,
  hoursPerDay,
  restDays = "Sunday",
  languageStyle = "Clear and practical",
  customInstructions = "",
  tone = "english",
}: PromptBParams): string {
  const jsonStr =
    typeof roadmapJson === "string"
      ? roadmapJson
      : JSON.stringify(roadmapJson, null, 2);

  const customHint = customInstructions.trim()
    ? `\nCustom instructions: ${customInstructions.trim()}`
    : "";

  const toneHint =
    tone === "hinglish"
      ? "\nLanguage style: Short, clear Hinglish (Hindi in Roman script + English terms)."
      : `\nLanguage style for task titles: ${languageStyle}`;

  return `You are a study planner. Below is my learning roadmap (JSON) and my deadline.

ROADMAP JSON:
${jsonStr}

Start date: ${startDate}
Deadline: ${deadline}
Daily study time: ${hoursPerDay} hours
Rest days (weekdays): ${restDays}${toneHint}${customHint}

Task:
- Spread the whole roadmap sensibly across the time until the deadline, but create ONLY the
  FIRST 30 DAYS in detail (days 1 to 30), one entry per day.
- Each day has 2 to 4 tasks. Each task has est_minutes (total per day close to my daily time),
  roadmap_ref (a topic id from the roadmap), kind (learn, practice, project, revision or review),
  and optionally a short checklist (max 5 items) for practice or project tasks.
- On my rest days give only ONE light optional review task.
- Include one revision or practice-heavy day every week.

OUTPUT RULES (very important):
- Return ONLY valid JSON. No text before or after. No markdown, no code fences.
- Exact structure:
{"skill":"","start_date":"${startDate}","deadline":"${deadline}","chunk":{"number":1,"from_day":1,"to_day":30},"days":[{"day":1,"date":"","focus":"","tasks":[{"title":"","description":"","est_minutes":0,"roadmap_ref":"1.1","kind":"learn","checklist":[""]}]}]}`;
}

export interface PromptCParams {
  roadmapJson: string | object;
  deadline: string;
  nextChunkNumber: number;
  fromDay: number;
  toDay: number;
  startDate: string;
  hoursPerDay: number;
  restDays?: string;
  prevChunkNumber: number;
  percent: number;
  doneTasks: number;
  totalTasks: number;
  doneTopics: string;
  missedTopics: string;
  reflection?: string;
  overallPercent: number;
  customInstructions?: string;
  tone?: "english" | "hinglish";
}

export function buildPromptC({
  roadmapJson,
  deadline,
  nextChunkNumber,
  fromDay,
  toDay,
  startDate,
  hoursPerDay,
  restDays = "Sunday",
  prevChunkNumber,
  percent,
  doneTasks,
  totalTasks,
  doneTopics,
  missedTopics,
  reflection = "None",
  overallPercent,
  customInstructions = "",
  tone = "english",
}: PromptCParams): string {
  const jsonStr =
    typeof roadmapJson === "string"
      ? roadmapJson
      : JSON.stringify(roadmapJson, null, 2);

  const customHint = customInstructions.trim()
    ? `\nCustom instructions: ${customInstructions.trim()}`
    : "";

  return `My previous 30-day chunk is finished. Create the NEXT 30 days of my plan.

ROADMAP JSON:
${jsonStr}

Deadline: ${deadline}
Next chunk number: ${nextChunkNumber}   (days ${fromDay} to ${toDay}; start date ${startDate})
Daily study time for this chunk: ${hoursPerDay} hours
Rest days (weekdays): ${restDays}${customHint}

PROGRESS SO FAR:
- Chunk just finished: ${prevChunkNumber}  (completion ${percent}%, ${doneTasks} of ${totalTasks} tasks)
- Topics completed: ${doneTopics || "None"}
- Topics missed or unfinished (put these FIRST): ${missedTopics || "None"}
- Weak spots from my reflection: ${reflection || "None"}
- Overall roadmap completion: ${overallPercent}%

Task: continue from where I am. Put missed topics first, then new topics in roadmap order.
Do not repeat completed topics except for short revision tasks.

OUTPUT RULES: same as before. Return ONLY valid JSON in exactly this structure:
{"skill":"","start_date":"${startDate}","deadline":"${deadline}","chunk":{"number":${nextChunkNumber},"from_day":${fromDay},"to_day":${toDay}},"days":[{"day":${fromDay},"date":"","focus":"","tasks":[{"title":"","description":"","est_minutes":0,"roadmap_ref":"","kind":"learn","checklist":[""]}]}]}`;
}

// =========================================================
// Small helper prompts (Section 11.4)
// =========================================================

export function buildDoubtPrompt(
  taskTitle: string,
  topicTitle: string,
  skillName: string,
  tone: "english" | "hinglish" = "english"
): string {
  const hinglishLine =
    tone === "hinglish"
      ? "\nExplain in simple Hinglish (Hindi + English in Roman script)."
      : "";
  return `I am learning ${skillName} and I am working on: ${taskTitle} (topic: ${topicTitle}). I am stuck here: [DESCRIBE WHERE]. Explain step by step in simple words, then give a tiny example and one practice question.${hinglishLine}`;
}

export function buildQuizPrompt(
  topicTitle: string,
  skillName: string,
  tone: "english" | "hinglish" = "english"
): string {
  const hinglishLine =
    tone === "hinglish"
      ? "\nExplain in simple Hinglish (Hindi + English in Roman script)."
      : "";
  return `Give me a 15-minute quiz (8 questions, mixed difficulty) on ${topicTitle} for ${skillName}. Ask one question at a time, wait for my answer, then correct me.${hinglishLine}`;
}

export function buildAnalogyPrompt(
  topicTitle: string,
  skillName: string,
  tone: "english" | "hinglish" = "english"
): string {
  return `Explain ${topicTitle} (${skillName}) using a real-life analogy, then connect the analogy back to the technical idea in 5 bullet points.`;
}

export function buildDrillsPrompt(
  topicTitle: string,
  skillName: string,
  tone: "english" | "hinglish" = "english"
): string {
  return `Give me 5 progressively harder practice drills on ${topicTitle} for ${skillName}, with hints hidden until I ask.`;
}

export function buildFocusDoubtPrompt(
  taskTitle: string,
  skillName: string,
  checklistText: string
): string {
  return `I am implementing ${taskTitle} (${skillName}). Acceptance criteria: ${checklistText}. I am stuck on: [DESCRIBE WHERE]. Give a step-by-step trace and the key idea, not just the final answer.`;
}
