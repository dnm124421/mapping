import { SupabaseClient } from "@supabase/supabase-js";
import { Roadmap } from "../schemas";
import { sampleSeedData } from "./sample-seed";

export interface SkillWithRoadmap {
  id: string; // skill_id
  name: string;
  category?: string;
  level: string;
  status: string;
  is_sample: boolean;
  created_at: string;
  roadmap: {
    id: string;
    version: number;
    data: Roadmap;
    daily_minutes?: number;
    created_at: string;
  } | null;
  topicProgress: Record<string, { done: boolean; notes?: string; video_url?: string }>;
  stats: {
    totalTopics: number;
    doneTopics: number;
    percent: number;
  };
}

const LOCAL_STORAGE_KEY = "roadmap_planner_skills_roadmaps";
const LOCAL_PROGRESS_KEY = "roadmap_planner_topic_progress";

// Local storage fallback for offline / preview testing
function getLocalData(): SkillWithRoadmap[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    // Initial default seed if nothing exists in local storage
    const defaultData: SkillWithRoadmap[] = [
      {
        id: "sample-skill-1",
        name: sampleSeedData.roadmap.skill,
        category: "Computer Science",
        level: sampleSeedData.roadmap.level,
        status: "active",
        is_sample: true,
        created_at: new Date().toISOString(),
        roadmap: {
          id: "sample-1",
          version: 1,
          data: sampleSeedData.roadmap as Roadmap,
          daily_minutes: 120,
          created_at: new Date().toISOString(),
        },
        topicProgress: {},
        stats: {
          totalTopics: 12,
          doneTopics: 0,
          percent: 0,
        },
      },
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
  } catch {
    return [];
  }
}

function saveLocalData(data: SkillWithRoadmap[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

/**
 * Fetches all skills along with their latest roadmaps and topic progress counts
 */
export async function fetchSkillsWithRoadmaps(
  supabase?: SupabaseClient | null,
  userId?: string
): Promise<SkillWithRoadmap[]> {
  if (!supabase || !userId) {
    return getLocalData();
  }

  try {
    // 1. Fetch skills
    const { data: skills, error: skillsError } = await supabase
      .from("skills")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (skillsError) throw skillsError;
    if (!skills || skills.length === 0) return [];

    const skillIds = skills.map((s) => s.id);

    // 2. Fetch roadmaps
    const { data: roadmaps, error: roadmapsError } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", userId)
      .in("skill_id", skillIds);

    if (roadmapsError) throw roadmapsError;

    // 3. Fetch topic progress
    const roadmapIds = (roadmaps || []).map((r) => r.id);
    let progressRows: any[] = [];
    if (roadmapIds.length > 0) {
      const { data: progress } = await supabase
        .from("topic_progress")
        .select("*")
        .eq("user_id", userId)
        .in("roadmap_id", roadmapIds);
      progressRows = progress || [];
    }

    // Assemble joined data
    const result: SkillWithRoadmap[] = skills.map((skill) => {
      const roadmapRow = (roadmaps || []).find((r) => r.skill_id === skill.id) || null;
      const topicProgress: Record<string, { done: boolean; notes?: string }> = {};

      if (roadmapRow) {
        progressRows
          .filter((p) => p.roadmap_id === roadmapRow.id)
          .forEach((p) => {
            topicProgress[p.topic_id] = { done: p.done, notes: p.notes };
          });
      }

      let totalTopics = 0;
      let doneTopics = 0;

      if (roadmapRow?.data?.stages) {
        roadmapRow.data.stages.forEach((stage: any) => {
          (stage.topics || []).forEach((topic: any) => {
            totalTopics++;
            if (topicProgress[topic.id]?.done) {
              doneTopics++;
            }
          });
        });
      }

      const percent = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

      return {
        id: skill.id,
        name: skill.name,
        category: skill.category,
        level: skill.level || "beginner",
        status: skill.status,
        is_sample: skill.is_sample,
        created_at: skill.created_at,
        roadmap: roadmapRow
          ? {
              id: roadmapRow.id,
              version: roadmapRow.version,
              data: roadmapRow.data as Roadmap,
              daily_minutes: roadmapRow.daily_minutes,
              created_at: roadmapRow.created_at,
            }
          : null,
        topicProgress,
        stats: {
          totalTopics,
          doneTopics,
          percent,
        },
      };
    });

    return result;
  } catch (err) {
    console.warn("Falling back to local storage for roadmaps:", err);
    return getLocalData();
  }
}

/**
 * Fetches single roadmap by ID along with topic progress and skill details
 */
export async function fetchRoadmapById(
  roadmapId: string,
  supabase?: SupabaseClient | null,
  userId?: string
): Promise<{
  roadmap: { id: string; version: number; data: Roadmap; daily_minutes?: number };
  skill: { id: string; name: string; level: string; category?: string };
  topicProgress: Record<string, { done: boolean; notes?: string; video_url?: string }>;
} | null> {
  if (!supabase || !userId) {
    const local = getLocalData();
    const found = local.find(
      (s) => s.roadmap?.id === roadmapId || s.id === roadmapId || roadmapId === "sample-1"
    );
    if (!found || !found.roadmap) return null;
    return {
      roadmap: found.roadmap,
      skill: {
        id: found.id,
        name: found.name,
        level: found.level,
        category: found.category,
      },
      topicProgress: found.topicProgress,
    };
  }

  try {
    const { data: roadmap, error: rError } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("id", roadmapId)
      .eq("user_id", userId)
      .single();

    if (rError || !roadmap) return null;

    const { data: skill, error: sError } = await supabase
      .from("skills")
      .select("*")
      .eq("id", roadmap.skill_id)
      .eq("user_id", userId)
      .single();

    if (sError || !skill) return null;

    const { data: progress } = await supabase
      .from("topic_progress")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .eq("user_id", userId);

    const topicProgress: Record<string, { done: boolean; notes?: string; video_url?: string }> = {};
    (progress || []).forEach((p) => {
      topicProgress[p.topic_id] = { done: p.done, notes: p.notes, video_url: p.video_url };
    });

    return {
      roadmap: {
        id: roadmap.id,
        version: roadmap.version,
        data: roadmap.data as Roadmap,
        daily_minutes: roadmap.daily_minutes,
      },
      skill: {
        id: skill.id,
        name: skill.name,
        level: skill.level,
        category: skill.category,
      },
      topicProgress,
    };
  } catch {
    return null;
  }
}

/**
 * Creates new skill and roadmap atomically
 */
export async function createNewRoadmap(
  roadmapData: Roadmap,
  dailyMinutes = 120,
  supabase?: SupabaseClient | null,
  userId?: string
): Promise<{ roadmapId: string; skillId: string }> {
  if (!supabase || !userId) {
    // Local storage fallback
    const local = getLocalData();
    const skillId = `skill-${Date.now()}`;
    const roadmapId = `roadmap-${Date.now()}`;

    let totalTopics = 0;
    roadmapData.stages.forEach((s) => (totalTopics += s.topics.length));

    const newSkill: SkillWithRoadmap = {
      id: skillId,
      name: roadmapData.skill,
      level: roadmapData.level || "beginner",
      status: "active",
      is_sample: false,
      created_at: new Date().toISOString(),
      roadmap: {
        id: roadmapId,
        version: 1,
        data: roadmapData,
        daily_minutes: dailyMinutes,
        created_at: new Date().toISOString(),
      },
      topicProgress: {},
      stats: {
        totalTopics,
        doneTopics: 0,
        percent: 0,
      },
    };

    local.unshift(newSkill);
    saveLocalData(local);
    return { roadmapId, skillId };
  }

  // 1. Insert skill
  const { data: skill, error: sErr } = await supabase
    .from("skills")
    .insert({
      user_id: userId,
      name: roadmapData.skill,
      level: roadmapData.level || "beginner",
      status: "active",
      is_sample: false,
    })
    .select()
    .single();

  if (sErr || !skill) throw new Error(sErr?.message || "Failed to create skill");

  // 2. Insert roadmap
  const { data: roadmap, error: rErr } = await supabase
    .from("roadmaps")
    .insert({
      user_id: userId,
      skill_id: skill.id,
      version: 1,
      schema_version: 1,
      data: roadmapData,
      daily_minutes: dailyMinutes,
    })
    .select()
    .single();

  if (rErr || !roadmap) throw new Error(rErr?.message || "Failed to create roadmap");

  return { roadmapId: roadmap.id, skillId: skill.id };
}

/**
 * Toggles a topic done state (upserts topic_progress row)
 */
export async function toggleTopicProgress(
  roadmapId: string,
  topicId: string,
  done: boolean,
  supabase?: SupabaseClient | null,
  userId?: string
) {
  if (!supabase || !userId) {
    const local = getLocalData();
    const item = local.find((s) => s.roadmap?.id === roadmapId || roadmapId === "sample-1");
    if (item && item.roadmap) {
      if (!item.topicProgress[topicId]) {
        item.topicProgress[topicId] = { done };
      } else {
        item.topicProgress[topicId].done = done;
      }
      // Recompute stats
      let doneCount = 0;
      let totalCount = 0;
      item.roadmap.data.stages.forEach((st) => {
        st.topics.forEach((t) => {
          totalCount++;
          if (item.topicProgress[t.id]?.done) doneCount++;
        });
      });
      item.stats = {
        totalTopics: totalCount,
        doneTopics: doneCount,
        percent: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
      };
      saveLocalData(local);
    }
    return;
  }

  const { error } = await supabase.from("topic_progress").upsert(
    {
      user_id: userId,
      roadmap_id: roadmapId,
      topic_id: topicId,
      done,
      done_at: done ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "roadmap_id,topic_id" }
  );

  if (error) throw error;
}

/**
 * Saves topic personal study notes
 */
export async function saveTopicNotes(
  roadmapId: string,
  topicId: string,
  notes: string,
  supabase?: SupabaseClient | null,
  userId?: string
) {
  if (!supabase || !userId) {
    const local = getLocalData();
    const item = local.find((s) => s.roadmap?.id === roadmapId || roadmapId === "sample-1");
    if (item) {
      if (!item.topicProgress[topicId]) {
        item.topicProgress[topicId] = { done: false, notes };
      } else {
        item.topicProgress[topicId].notes = notes;
      }
      saveLocalData(local);
    }
    return;
  }

  const { error } = await supabase.from("topic_progress").upsert(
    {
      user_id: userId,
      roadmap_id: roadmapId,
      topic_id: topicId,
      notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "roadmap_id,topic_id" }
  );

  if (error) throw error;
}

/**
 * Deletes a skill and all related roadmaps, plans, tasks (cascade)
 */
export async function deleteSkillAndRoadmap(
  skillId: string,
  supabase?: SupabaseClient | null,
  userId?: string
) {
  if (!supabase || !userId) {
    const local = getLocalData();
    const updated = local.filter((s) => s.id !== skillId && s.roadmap?.id !== skillId);
    saveLocalData(updated);
    return;
  }

  const { error } = await supabase
    .from("skills")
    .delete()
    .eq("id", skillId)
    .eq("user_id", userId);

  if (error) throw error;
}

/**
 * Saves or updates YouTube revision video for a topic
 */
export async function saveTopicVideoProgress(
  roadmapId: string,
  topicId: string,
  videoUrl: string,
  supabase?: SupabaseClient | null,
  userId?: string
) {
  const cleanUrl = videoUrl.trim();
  if (typeof window !== "undefined") {
    const local = getLocalData();
    const item = local.find((s) => s.roadmap?.id === roadmapId || roadmapId === "sample-1");
    if (item) {
      if (!item.topicProgress) item.topicProgress = {};
      if (!item.topicProgress[topicId]) {
        item.topicProgress[topicId] = { done: false, video_url: cleanUrl };
      } else {
        item.topicProgress[topicId].video_url = cleanUrl;
      }
      saveLocalData(local);
    }

    try {
      const rawVideos = localStorage.getItem("roadmap_planner_topic_videos");
      const map = rawVideos ? JSON.parse(rawVideos) : {};
      map[topicId] = cleanUrl;
      map[`${roadmapId}_${topicId}`] = cleanUrl;
      localStorage.setItem("roadmap_planner_topic_videos", JSON.stringify(map));
    } catch {}
  }

  if (supabase && userId) {
    try {
      await supabase.from("topic_progress").upsert(
        {
          user_id: userId,
          roadmap_id: roadmapId,
          topic_id: topicId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "roadmap_id,topic_id" }
      );
    } catch (err) {
      console.warn("Could not save topic video in supabase:", err);
    }
  }
}

/**
 * Removes YouTube revision video for a topic
 */
export async function removeTopicVideoProgress(
  roadmapId: string,
  topicId: string,
  supabase?: SupabaseClient | null,
  userId?: string
) {
  if (typeof window !== "undefined") {
    const local = getLocalData();
    const item = local.find((s) => s.roadmap?.id === roadmapId || roadmapId === "sample-1");
    if (item && item.topicProgress && item.topicProgress[topicId]) {
      delete item.topicProgress[topicId].video_url;
      saveLocalData(local);
    }

    try {
      const rawVideos = localStorage.getItem("roadmap_planner_topic_videos");
      if (rawVideos) {
        const map = JSON.parse(rawVideos);
        delete map[topicId];
        delete map[`${roadmapId}_${topicId}`];
        localStorage.setItem("roadmap_planner_topic_videos", JSON.stringify(map));
      }
    } catch {}
  }
}

