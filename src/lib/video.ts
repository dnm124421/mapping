/**
 * YouTube and Revision Video Utilities for Roadmap Planner
 */

/**
 * Extracts 11-character YouTube video ID from various YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/i;
  const match = trimmed.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  return null;
}

/**
 * Builds standard embed URL for iframe
 */
export function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0`;
}

/**
 * Builds search query URL for YouTube
 */
export function getYouTubeSearchUrl(topicOrTitle: string, skillName?: string): string {
  const query = skillName ? `${topicOrTitle} ${skillName}` : topicOrTitle;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;
}

const LOCAL_TOPIC_VIDEOS_KEY = "roadmap_planner_topic_videos";

export function getSavedTopicVideo(roadmapId?: string, topicId?: string): string | null {
  if (typeof window === "undefined" || !topicId) return null;
  try {
    const raw = localStorage.getItem(LOCAL_TOPIC_VIDEOS_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    if (roadmapId && map[`${roadmapId}_${topicId}`]) {
      return map[`${roadmapId}_${topicId}`];
    }
    return map[topicId] || null;
  } catch {
    return null;
  }
}

export function saveTopicVideo(topicId: string, videoUrl: string, roadmapId?: string): void {
  if (typeof window === "undefined" || !topicId) return;
  try {
    const raw = localStorage.getItem(LOCAL_TOPIC_VIDEOS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[topicId] = videoUrl.trim();
    if (roadmapId) {
      map[`${roadmapId}_${topicId}`] = videoUrl.trim();
    }
    localStorage.setItem(LOCAL_TOPIC_VIDEOS_KEY, JSON.stringify(map));
  } catch {}
}

export function removeTopicVideo(topicId: string, roadmapId?: string): void {
  if (typeof window === "undefined" || !topicId) return;
  try {
    const raw = localStorage.getItem(LOCAL_TOPIC_VIDEOS_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[topicId];
    if (roadmapId) {
      delete map[`${roadmapId}_${topicId}`];
    }
    localStorage.setItem(LOCAL_TOPIC_VIDEOS_KEY, JSON.stringify(map));
  } catch {}
}
