import { SupabaseClient } from "@supabase/supabase-js";
import seedData from "../../../supabase/seed-sample.json";

export const sampleSeedData = seedData;

export async function insertSampleData(supabase: SupabaseClient, userId: string) {
  // 1. Create Sample Skill
  const { data: skill, error: skillError } = await supabase
    .from("skills")
    .insert({
      user_id: userId,
      name: seedData.roadmap.skill,
      level: seedData.roadmap.level,
      category: "Computer Science",
      status: "active",
      is_sample: true,
    })
    .select()
    .single();

  if (skillError || !skill) {
    throw new Error(skillError?.message || "Failed to create sample skill");
  }

  // 2. Create Sample Roadmap
  const { data: roadmap, error: roadmapError } = await supabase
    .from("roadmaps")
    .insert({
      user_id: userId,
      skill_id: skill.id,
      version: 1,
      schema_version: 1,
      data: seedData.roadmap,
      daily_minutes: 120,
    })
    .select()
    .single();

  if (roadmapError || !roadmap) {
    throw new Error(roadmapError?.message || "Failed to create sample roadmap");
  }

  // 3. Create Sample Plan
  const today = new Date().toISOString().split("T")[0];
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .insert({
      user_id: userId,
      skill_id: skill.id,
      roadmap_id: roadmap.id,
      start_date: today,
      deadline: nextYear,
      daily_minutes: 120,
      rest_days: [0], // Sunday rest day
      status: "active",
    })
    .select()
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message || "Failed to create sample plan");
  }

  // 4. Import Sample Chunk (3 days of sample tasks)
  const chunkPayload = {
    ...seedData.plan,
    start_date: today,
    deadline: nextYear,
    days: seedData.plan.days.map((d, index) => {
      const dayDate = new Date(Date.now() + index * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      return {
        ...d,
        date: dayDate,
      };
    }),
  };

  const { error: chunkError } = await supabase.rpc("import_plan_chunk", {
    p_plan_id: plan.id,
    p_payload: chunkPayload,
  });

  if (chunkError) {
    // If SQL function wasn't executed yet, do manual inserts so sample data still loads smoothly
    console.warn("RPC import_plan_chunk failed, falling back to manual insert:", chunkError);
    const { data: chunk } = await supabase
      .from("plan_chunks")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        number: 1,
        start_date: today,
        end_date: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "active",
      })
      .select()
      .single();

    if (chunk) {
      for (const day of chunkPayload.days) {
        const { data: planDay } = await supabase
          .from("plan_days")
          .insert({
            user_id: userId,
            chunk_id: chunk.id,
            day_number: day.day,
            date: day.date,
            focus: day.focus,
          })
          .select()
          .single();

        if (planDay && day.tasks) {
          for (let i = 0; i < day.tasks.length; i++) {
            const task = day.tasks[i];
            await supabase.from("tasks").insert({
              user_id: userId,
              plan_id: plan.id,
              day_id: planDay.id,
              title: task.title,
              est_minutes: task.est_minutes,
              roadmap_ref: task.roadmap_ref,
              kind: task.kind,
              checklist: task.checklist || [],
              status: "todo",
              scheduled_date: day.date,
              position: i,
            });
          }
        }
      }
    }
  }

  return { skill, roadmap, plan };
}

export async function deleteSampleData(supabase: SupabaseClient, userId: string) {
  // Cascades to roadmaps, plans, chunks, tasks
  const { error } = await supabase
    .from("skills")
    .delete()
    .eq("user_id", userId)
    .eq("is_sample", true);

  if (error) {
    throw new Error(error.message);
  }
}
