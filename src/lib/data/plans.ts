import { SupabaseClient } from "@supabase/supabase-js";
import { Plan } from "../schemas";
import { calculatePlanStatus, PlanStatusChip } from "../logic/plan-status";
import { sampleSeedData } from "./sample-seed";

export interface PlanTaskItem {
  id: string;
  plan_id: string;
  day_id?: string;
  title: string;
  description?: string;
  est_minutes: number;
  roadmap_ref?: string;
  kind?: string;
  checklist: Array<{ text: string; done?: boolean }>;
  status: "todo" | "done" | "moved";
  scheduled_date: string;
  original_date?: string;
  completed_at?: string;
  notes?: string;
  position: number;
  is_custom: boolean;
}

export interface PlanDayItem {
  id: string;
  chunk_id: string;
  day_number: number;
  date: string;
  focus?: string;
  tasks: PlanTaskItem[];
}

export interface PlanWithChunkDetails {
  id: string;
  skill_id: string;
  skill_name: string;
  roadmap_id: string;
  start_date: string;
  deadline: string;
  daily_minutes: number;
  rest_days: number[];
  status: string;
  currentChunk: {
    id: string;
    number: number;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
  days: PlanDayItem[];
  allTasks: PlanTaskItem[];
  statusChip: PlanStatusChip;
}

const LOCAL_PLANS_KEY = "roadmap_planner_plans_data";

function getLocalPlans(): PlanWithChunkDetails[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_PLANS_KEY);
    if (raw) return JSON.parse(raw);

    // Initial default seed plan
    const today = new Date().toISOString().split("T")[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const chunkEndDate = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const days: PlanDayItem[] = sampleSeedData.plan.days.map((d, index) => {
      const dDate = new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      return {
        id: `day-${index + 1}`,
        chunk_id: "chunk-1",
        day_number: d.day,
        date: dDate,
        focus: d.focus,
        tasks: d.tasks.map((t, tIndex) => ({
          id: `task-${index + 1}-${tIndex + 1}`,
          plan_id: "sample-plan-1",
          day_id: `day-${index + 1}`,
          title: t.title,
          est_minutes: t.est_minutes || 40,
          roadmap_ref: t.roadmap_ref,
          kind: t.kind,
          checklist: (t.checklist || []).map((item) =>
            typeof item === "string" ? { text: item, done: false } : item
          ),
          status: "todo",
          scheduled_date: dDate,
          original_date: dDate,
          position: tIndex,
          is_custom: false,
        })),
      };
    });

    const allTasks = days.flatMap((d) => d.tasks);

    const defaultPlan: PlanWithChunkDetails = {
      id: "sample-plan-1",
      skill_id: "sample-skill-1",
      skill_name: sampleSeedData.plan.skill,
      roadmap_id: "sample-1",
      start_date: today,
      deadline: nextYear,
      daily_minutes: 120,
      rest_days: [0],
      status: "active",
      currentChunk: {
        id: "chunk-1",
        number: 1,
        start_date: today,
        end_date: chunkEndDate,
        status: "active",
      },
      days,
      allTasks,
      statusChip: "On Track",
    };

    localStorage.setItem(LOCAL_PLANS_KEY, JSON.stringify([defaultPlan]));
    return [defaultPlan];
  } catch {
    return [];
  }
}

function saveLocalPlans(plans: PlanWithChunkDetails[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_PLANS_KEY, JSON.stringify(plans));
  } catch {}
}

/**
 * Fetches all plans with their active sprint status and day counts
 */
export async function fetchPlans(
  supabase?: SupabaseClient | null,
  userId?: string
): Promise<PlanWithChunkDetails[]> {
  if (!supabase || !userId) {
    return getLocalPlans();
  }

  try {
    const { data: plans, error: pError } = await supabase
      .from("plans")
      .select("*, skills(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (pError) throw pError;
    if (!plans || plans.length === 0) return [];

    const planIds = plans.map((p) => p.id);

    // Fetch active chunks
    const { data: chunks } = await supabase
      .from("plan_chunks")
      .select("*")
      .eq("user_id", userId)
      .in("plan_id", planIds)
      .eq("status", "active");

    // Fetch tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .in("plan_id", planIds);

    const result: PlanWithChunkDetails[] = plans.map((p) => {
      const chunk = (chunks || []).find((c) => c.plan_id === p.id) || null;
      const planTasks: PlanTaskItem[] = (tasks || []).filter((t) => t.plan_id === p.id);

      const statusChip = calculatePlanStatus({
        tasks: planTasks,
        dailyMinutes: p.daily_minutes,
        chunkStartDate: chunk?.start_date || p.start_date,
        chunkEndDate: chunk?.end_date || p.deadline,
        planStatus: p.status,
      });

      return {
        id: p.id,
        skill_id: p.skill_id,
        skill_name: (p.skills as any)?.name || "Learning Skill",
        roadmap_id: p.roadmap_id,
        start_date: p.start_date,
        deadline: p.deadline,
        daily_minutes: p.daily_minutes,
        rest_days: p.rest_days || [0],
        status: p.status,
        currentChunk: chunk,
        days: [],
        allTasks: planTasks,
        statusChip,
      };
    });

    return result;
  } catch (err) {
    console.warn("Falling back to local storage for plans:", err);
    return getLocalPlans();
  }
}

/**
 * Fetches single plan by ID along with its full days strip and scheduled tasks
 */
export async function fetchPlanDetails(
  planId: string,
  supabase?: SupabaseClient | null,
  userId?: string
): Promise<PlanWithChunkDetails | null> {
  if (!supabase || !userId) {
    const local = getLocalPlans();
    return local.find((p) => p.id === planId || planId === "sample-1" || planId === "sample-plan-1") || null;
  }

  try {
    const { data: plan, error: pError } = await supabase
      .from("plans")
      .select("*, skills(name)")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (pError || !plan) return null;

    // Fetch active chunk
    const { data: chunk } = await supabase
      .from("plan_chunks")
      .select("*")
      .eq("plan_id", planId)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    let planDays: PlanDayItem[] = [];
    let planTasks: PlanTaskItem[] = [];

    if (chunk) {
      const { data: days } = await supabase
        .from("plan_days")
        .select("*")
        .eq("chunk_id", chunk.id)
        .eq("user_id", userId)
        .order("day_number", { ascending: true });

      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("plan_id", planId)
        .eq("user_id", userId)
        .order("position", { ascending: true });

      planTasks = tasks || [];

      planDays = (days || []).map((d) => ({
        id: d.id,
        chunk_id: d.chunk_id,
        day_number: d.day_number,
        date: d.date,
        focus: d.focus,
        tasks: planTasks.filter((t) => t.day_id === d.id || t.scheduled_date === d.date),
      }));
    }

    const statusChip = calculatePlanStatus({
      tasks: planTasks,
      dailyMinutes: plan.daily_minutes,
      chunkStartDate: chunk?.start_date || plan.start_date,
      chunkEndDate: chunk?.end_date || plan.deadline,
      planStatus: plan.status,
    });

    return {
      id: plan.id,
      skill_id: plan.skill_id,
      skill_name: (plan.skills as any)?.name || "Learning Skill",
      roadmap_id: plan.roadmap_id,
      start_date: plan.start_date,
      deadline: plan.deadline,
      daily_minutes: plan.daily_minutes,
      rest_days: plan.rest_days || [0],
      status: plan.status,
      currentChunk: chunk || null,
      days: planDays,
      allTasks: planTasks,
      statusChip,
    };
  } catch {
    return null;
  }
}

/**
 * Creates new plan and imports first 30-day chunk atomically
 */
export async function createPlanWithChunk({
  planPayload,
  skillId,
  roadmapId,
  dailyMinutes = 120,
  restDays = [0],
  supabase,
  userId,
}: {
  planPayload: Plan;
  skillId: string;
  roadmapId: string;
  dailyMinutes?: number;
  restDays?: number[];
  supabase?: SupabaseClient | null;
  userId?: string;
}): Promise<string> {
  if (!supabase || !userId) {
    const local = getLocalPlans();
    const newPlanId = `plan-${Date.now()}`;
    const chunkId = `chunk-${Date.now()}`;

    const days: PlanDayItem[] = planPayload.days.map((d, index) => ({
      id: `day-${Date.now()}-${index}`,
      chunk_id: chunkId,
      day_number: d.day,
      date: d.date || planPayload.start_date,
      focus: d.focus,
      tasks: d.tasks.map((t, tIdx) => ({
        id: `task-${Date.now()}-${index}-${tIdx}`,
        plan_id: newPlanId,
        day_id: `day-${Date.now()}-${index}`,
        title: t.title,
        description: t.description,
        est_minutes: t.est_minutes || 30,
        roadmap_ref: t.roadmap_ref,
        kind: t.kind,
        checklist: (t.checklist || []).map((c) =>
          typeof c === "string" ? { text: c, done: false } : c
        ),
        status: "todo",
        scheduled_date: d.date || planPayload.start_date,
        original_date: d.date || planPayload.start_date,
        position: tIdx,
        is_custom: false,
      })),
    }));

    const newPlan: PlanWithChunkDetails = {
      id: newPlanId,
      skill_id: skillId,
      skill_name: planPayload.skill,
      roadmap_id: roadmapId,
      start_date: planPayload.start_date,
      deadline: planPayload.deadline,
      daily_minutes: dailyMinutes,
      rest_days: restDays,
      status: "active",
      currentChunk: {
        id: chunkId,
        number: planPayload.chunk.number,
        start_date: planPayload.start_date,
        end_date: planPayload.days[planPayload.days.length - 1]?.date || planPayload.deadline,
        status: "active",
      },
      days,
      allTasks: days.flatMap((d) => d.tasks),
      statusChip: "On Track",
    };

    local.unshift(newPlan);
    saveLocalPlans(local);
    return newPlanId;
  }

  // 1. Create plan row
  const { data: plan, error: pErr } = await supabase
    .from("plans")
    .insert({
      user_id: userId,
      skill_id: skillId,
      roadmap_id: roadmapId,
      start_date: planPayload.start_date,
      deadline: planPayload.deadline,
      daily_minutes: dailyMinutes,
      rest_days: restDays,
      status: "active",
    })
    .select()
    .single();

  if (pErr || !plan) throw new Error(pErr?.message || "Failed to create plan");

  // 2. Call atomic import function
  const { error: chunkErr } = await supabase.rpc("import_plan_chunk", {
    p_plan_id: plan.id,
    p_payload: planPayload,
  });

  if (chunkErr) {
    console.warn("import_plan_chunk RPC fallback:", chunkErr);
    // Manual fallback creation
    const { data: chunk } = await supabase
      .from("plan_chunks")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        number: planPayload.chunk.number,
        start_date: planPayload.start_date,
        end_date: planPayload.days[planPayload.days.length - 1]?.date,
        status: "active",
      })
      .select()
      .single();

    if (chunk) {
      for (const d of planPayload.days) {
        const { data: dayRow } = await supabase
          .from("plan_days")
          .insert({
            user_id: userId,
            chunk_id: chunk.id,
            day_number: d.day,
            date: d.date,
            focus: d.focus,
          })
          .select()
          .single();

        if (dayRow && d.tasks) {
          for (let pos = 0; pos < d.tasks.length; pos++) {
            const t = d.tasks[pos];
            await supabase.from("tasks").insert({
              user_id: userId,
              plan_id: plan.id,
              day_id: dayRow.id,
              title: t.title,
              description: t.description,
              est_minutes: t.est_minutes || 30,
              roadmap_ref: t.roadmap_ref,
              kind: t.kind,
              checklist: t.checklist || [],
              status: "todo",
              scheduled_date: d.date,
              position: pos,
            });
          }
        }
      }
    }
  }

  return plan.id;
}

/**
 * Toggles a task status (todo <-> done)
 */
export async function toggleTaskStatus(
  taskId: string,
  newDone: boolean,
  supabase?: SupabaseClient | null,
  userId?: string
) {
  const newStatus = newDone ? "done" : "todo";

  if (!supabase || !userId) {
    const local = getLocalPlans();
    for (const p of local) {
      for (const task of p.allTasks) {
        if (task.id === taskId) {
          task.status = newStatus;
          task.completed_at = newDone ? new Date().toISOString() : undefined;
        }
      }
      for (const day of p.days) {
        for (const task of day.tasks) {
          if (task.id === taskId) {
            task.status = newStatus;
            task.completed_at = newDone ? new Date().toISOString() : undefined;
          }
        }
      }
    }
    saveLocalPlans(local);
    return;
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status: newStatus,
      completed_at: newDone ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Moves a task to another day (e.g. Move to Today, Move to Tomorrow, To Weekend)
 */
export async function moveTaskDate(
  taskId: string,
  newScheduledDate: string,
  supabase?: SupabaseClient | null,
  userId?: string
) {
  if (!supabase || !userId) {
    const local = getLocalPlans();
    for (const p of local) {
      for (const task of p.allTasks) {
        if (task.id === taskId) {
          if (!task.original_date) task.original_date = task.scheduled_date;
          task.scheduled_date = newScheduledDate;
        }
      }
    }
    saveLocalPlans(local);
    return;
  }

  // Preserve original_date if not set
  const { data: existing } = await supabase
    .from("tasks")
    .select("original_date, scheduled_date")
    .eq("id", taskId)
    .single();

  const originalDate = existing?.original_date || existing?.scheduled_date || newScheduledDate;

  const { error } = await supabase
    .from("tasks")
    .update({
      scheduled_date: newScheduledDate,
      original_date: originalDate,
    })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Adds a custom task to a plan day
 */
export async function addCustomTask({
  planId,
  title,
  scheduledDate,
  estMinutes = 30,
  supabase,
  userId,
}: {
  planId: string;
  title: string;
  scheduledDate: string;
  estMinutes?: number;
  supabase?: SupabaseClient | null;
  userId?: string;
}): Promise<PlanTaskItem> {
  const newTask: PlanTaskItem = {
    id: `custom-task-${Date.now()}`,
    plan_id: planId,
    title,
    est_minutes: estMinutes,
    status: "todo",
    scheduled_date: scheduledDate,
    original_date: scheduledDate,
    checklist: [],
    position: 99,
    is_custom: true,
  };

  if (!supabase || !userId) {
    const local = getLocalPlans();
    const plan = local.find((p) => p.id === planId || planId === "sample-plan-1");
    if (plan) {
      plan.allTasks.push(newTask);
      const day = plan.days.find((d) => d.date === scheduledDate);
      if (day) day.tasks.push(newTask);
      saveLocalPlans(local);
    }
    return newTask;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      plan_id: planId,
      title,
      est_minutes: estMinutes,
      status: "todo",
      scheduled_date: scheduledDate,
      original_date: scheduledDate,
      is_custom: true,
      position: 99,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || "Failed to create task");
  return data;
}

/**
 * Saves daily scratchpad note
 */
export async function saveDailyScratchpad(
  date: string,
  scratchpad: string,
  supabase?: SupabaseClient | null,
  userId?: string
) {
  if (!supabase || !userId) {
    if (typeof window !== "undefined") {
      localStorage.setItem(`scratchpad_${date}`, scratchpad);
    }
    return;
  }

  await supabase.from("daily_logs").upsert(
    {
      user_id: userId,
      log_date: date,
      scratchpad,
    },
    { onConflict: "user_id,log_date" }
  );
}

/**
 * Activates a new 30-day chunk for an existing plan
 */
export async function activateNextChunk({
  planId,
  chunkPayload,
  reflectionNote,
  supabase,
  userId,
}: {
  planId: string;
  chunkPayload: Plan;
  reflectionNote?: string;
  supabase?: SupabaseClient | null;
  userId?: string;
}): Promise<void> {
  if (!supabase || !userId) {
    const local = getLocalPlans();
    const plan = local.find((p) => p.id === planId || planId === "sample-1" || planId === "sample-plan-1");
    if (!plan) throw new Error("Plan not found");

    const newChunkId = `chunk-${Date.now()}`;
    const newDays: PlanDayItem[] = chunkPayload.days.map((d, index) => ({
      id: `day-${Date.now()}-${index}`,
      chunk_id: newChunkId,
      day_number: d.day,
      date: d.date || chunkPayload.start_date,
      focus: d.focus,
      tasks: (d.tasks || []).map((t, tIdx) => ({
        id: `task-${Date.now()}-${index}-${tIdx}`,
        plan_id: plan.id,
        day_id: `day-${Date.now()}-${index}`,
        title: t.title,
        description: t.description,
        est_minutes: t.est_minutes || 30,
        roadmap_ref: t.roadmap_ref,
        kind: t.kind,
        checklist: (t.checklist || []).map((c) =>
          typeof c === "string" ? { text: c, done: false } : c
        ),
        status: "todo",
        scheduled_date: d.date || chunkPayload.start_date,
        original_date: d.date || chunkPayload.start_date,
        position: tIdx,
        is_custom: false,
      })),
    }));

    plan.currentChunk = {
      id: newChunkId,
      number: chunkPayload.chunk.number,
      start_date: chunkPayload.start_date,
      end_date: chunkPayload.days[chunkPayload.days.length - 1]?.date || chunkPayload.deadline,
      status: "active",
    };
    plan.days = newDays;
    plan.allTasks.push(...newDays.flatMap((d) => d.tasks));
    saveLocalPlans(local);
    return;
  }

  // 1. Mark existing chunks completed
  await supabase
    .from("plan_chunks")
    .update({ status: "completed" })
    .eq("plan_id", planId)
    .eq("user_id", userId);

  // 2. Insert new chunk via atomic RPC or manual insert
  const { error: rpcErr } = await supabase.rpc("import_plan_chunk", {
    p_plan_id: planId,
    p_payload: chunkPayload,
  });

  if (rpcErr) {
    console.warn("import_plan_chunk RPC fallback on chunk activation:", rpcErr);
    const { data: chunk } = await supabase
      .from("plan_chunks")
      .insert({
        user_id: userId,
        plan_id: planId,
        number: chunkPayload.chunk.number,
        start_date: chunkPayload.start_date,
        end_date: chunkPayload.days[chunkPayload.days.length - 1]?.date,
        status: "active",
      })
      .select()
      .single();

    if (chunk) {
      for (const d of chunkPayload.days) {
        const { data: dayRow } = await supabase
          .from("plan_days")
          .insert({
            user_id: userId,
            chunk_id: chunk.id,
            day_number: d.day,
            date: d.date,
            focus: d.focus,
          })
          .select()
          .single();

        if (dayRow && d.tasks) {
          for (let pos = 0; pos < d.tasks.length; pos++) {
            const t = d.tasks[pos];
            await supabase.from("tasks").insert({
              user_id: userId,
              plan_id: planId,
              day_id: dayRow.id,
              title: t.title,
              description: t.description,
              est_minutes: t.est_minutes || 30,
              roadmap_ref: t.roadmap_ref,
              kind: t.kind,
              checklist: t.checklist || [],
              status: "todo",
              scheduled_date: d.date,
              position: pos,
            });
          }
        }
      }
    }
  }
}

