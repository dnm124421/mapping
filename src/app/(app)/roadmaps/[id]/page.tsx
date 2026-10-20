"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Check,
  Lock,
  CalendarDays,
  Download,
  BookOpen,
  Sparkles,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Clock,
  NotebookPen,
  AlertCircle,
  Youtube,
  Video,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchRoadmapById,
  toggleTopicProgress,
  saveTopicNotes,
  saveTopicVideoProgress,
  removeTopicVideoProgress,
} from "@/lib/data/roadmaps";
import { Roadmap, Stage, Topic } from "@/lib/schemas";
import { calculateRoadmapProgress, calculateStageProgress } from "@/lib/logic/progress";
import { buildDoubtPrompt } from "@/lib/prompts";
import {
  extractYouTubeId,
  getYouTubeEmbedUrl,
  getYouTubeSearchUrl,
  getSavedTopicVideo,
} from "@/lib/video";
import { toast } from "sonner";

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const roadmapId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    skill: { id: string; name: string; category?: string; level: string };
    roadmap: { id: string; version: number; data: Roadmap; daily_minutes?: number };
    topicProgress: Record<string, { done: boolean; notes?: string; video_url?: string }>;
  } | null>(null);

  // Accordion state: map stageId -> boolean
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({});
  // Selected topic for Study Dossier
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [notesText, setNotesText] = useState("");
  const [notesSaveStatus, setNotesSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const [doubtCopied, setDoubtCopied] = useState(false);

  // Video state in dossier
  const [videoInputUrl, setVideoInputUrl] = useState("");
  const [isVideoInputOpen, setIsVideoInputOpen] = useState(false);

  // Load roadmap details
  const loadRoadmap = async () => {
    setLoading(true);
    const supabase = isSupabaseConfigured() ? createClient() : null;
    const res = await fetchRoadmapById(roadmapId, supabase, user?.id);
    if (!res) {
      setLoading(false);
      return;
    }

    setData(res);

    // Compute active stage to expand
    const doneMap: Record<string, boolean> = {};
    Object.keys(res.topicProgress).forEach((k) => {
      doneMap[k] = res.topicProgress[k].done;
    });

    const progressInfo = calculateRoadmapProgress(res.roadmap.data, doneMap);
    setExpandedStages({ [progressInfo.currentStageId]: true });

    // Preselect first topic of the active stage
    const activeStage =
      res.roadmap.data.stages.find((s) => s.id === progressInfo.currentStageId) ||
      res.roadmap.data.stages[0];
    if (activeStage && activeStage.topics.length > 0) {
      const firstTopic = activeStage.topics[0];
      setSelectedTopic(firstTopic);
      setNotesText(res.topicProgress[firstTopic.id]?.notes || "");
      const savedVid =
        res.topicProgress[firstTopic.id]?.video_url ||
        getSavedTopicVideo(res.roadmap.id, firstTopic.id) ||
        "";
      setVideoInputUrl(savedVid);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadRoadmap();
  }, [roadmapId, user]);

  // Topic selection handler
  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    if (data) {
      setNotesText(data.topicProgress[topic.id]?.notes || "");
      const savedVid =
        data.topicProgress[topic.id]?.video_url ||
        getSavedTopicVideo(data.roadmap.id, topic.id) ||
        "";
      setVideoInputUrl(savedVid);
      setIsVideoInputOpen(false);
    }
  };

  // Toggle stage accordion
  const toggleStage = (stageId: number) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  // Toggle Topic checkbox with optimistic update
  const handleToggleTopic = async (topicId: string, currentDone: boolean) => {
    if (!data) return;
    const newDone = !currentDone;

    // Optimistic state update
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        topicProgress: {
          ...prev.topicProgress,
          [topicId]: {
            ...prev.topicProgress[topicId],
            done: newDone,
          },
        },
      };
    });

    try {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      await toggleTopicProgress(roadmapId, topicId, newDone, supabase, user?.id);
      toast.success(newDone ? "Topic marked mastered!" : "Topic marked in-progress");
    } catch {
      toast.error("Failed to update topic status.");
      loadRoadmap();
    }
  };

  // Debounced auto-save for study notes
  useEffect(() => {
    if (!selectedTopic || !data) return;
    const currentSavedNote = data.topicProgress[selectedTopic.id]?.notes || "";
    if (notesText === currentSavedNote) return;

    setNotesSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const supabase = isSupabaseConfigured() ? createClient() : null;
        await saveTopicNotes(roadmapId, selectedTopic.id, notesText, supabase, user?.id);

        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            topicProgress: {
              ...prev.topicProgress,
              [selectedTopic.id]: {
                ...prev.topicProgress[selectedTopic.id],
                notes: notesText,
              },
            },
          };
        });
        setNotesSaveStatus("saved");
      } catch {
        setNotesSaveStatus("idle");
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [notesText]);

  // Overall Roadmap progress
  const progress = useMemo(() => {
    if (!data) return { doneCount: 0, totalCount: 0, percent: 0, currentStageId: 1 };
    const doneMap: Record<string, boolean> = {};
    Object.keys(data.topicProgress).forEach((k) => {
      doneMap[k] = data.topicProgress[k].done;
    });
    return calculateRoadmapProgress(data.roadmap.data, doneMap);
  }, [data]);

  // Save Topic Revision Video
  const handleSaveTopicVideo = async () => {
    if (!selectedTopic || !data || !videoInputUrl.trim()) return;
    const cleanUrl = videoInputUrl.trim();

    try {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      await saveTopicVideoProgress(roadmapId, selectedTopic.id, cleanUrl, supabase, user?.id);

      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          topicProgress: {
            ...prev.topicProgress,
            [selectedTopic.id]: {
              ...prev.topicProgress[selectedTopic.id],
              video_url: cleanUrl,
            },
          },
        };
      });

      setIsVideoInputOpen(false);
      toast.success("Revision video saved for this topic!");
    } catch {
      toast.error("Failed to save revision video.");
    }
  };

  // Remove Topic Revision Video
  const handleRemoveTopicVideo = async () => {
    if (!selectedTopic || !data) return;

    try {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      await removeTopicVideoProgress(roadmapId, selectedTopic.id, supabase, user?.id);

      setData((prev) => {
        if (!prev) return null;
        const progressCopy = { ...prev.topicProgress };
        if (progressCopy[selectedTopic.id]) {
          const topicCopy = { ...progressCopy[selectedTopic.id] };
          delete topicCopy.video_url;
          progressCopy[selectedTopic.id] = topicCopy;
        }
        return {
          ...prev,
          topicProgress: progressCopy,
        };
      });

      setVideoInputUrl("");
      setIsVideoInputOpen(false);
      toast.info("Revision video removed.");
    } catch {
      toast.error("Failed to remove video.");
    }
  };

  // Copy Doubt Prompt
  const handleCopyDoubt = async () => {
    if (!selectedTopic || !data) return;
    const prompt = buildDoubtPrompt(
      selectedTopic.title,
      selectedTopic.title,
      data.skill.name,
      profile?.settings?.tone || "english"
    );
    try {
      await navigator.clipboard.writeText(prompt);
      setDoubtCopied(true);
      toast.success("Doubt prompt copied! Paste into your AI.");
      setTimeout(() => setDoubtCopied(false), 2000);
    } catch {
      toast.error("Could not copy prompt.");
    }
  };

  // Download JSON
  const handleDownloadJson = () => {
    if (!data) return;
    const jsonStr = JSON.stringify(data.roadmap.data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.skill.name.toLowerCase().replace(/\s+/g, "_")}_roadmap.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Roadmap JSON downloaded!");
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-surface rounded-md w-1/3" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 h-96 bg-surface rounded-lg" />
          <div className="col-span-4 h-96 bg-surface rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center rounded-lg bg-surface border border-line space-y-4">
        <AlertCircle className="w-10 h-10 text-mute mx-auto" />
        <h2 className="text-lg font-bold text-ink">Roadmap not found</h2>
        <p className="text-xs text-mute">
          This roadmap doesn't exist or belongs to another account.
        </p>
        <Link
          href="/roadmaps"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Roadmaps</span>
        </Link>
      </div>
    );
  }

  // Active topic video url
  const currentTopicVideo = selectedTopic
    ? data.topicProgress[selectedTopic.id]?.video_url ||
      getSavedTopicVideo(data.roadmap.id, selectedTopic.id)
    : null;

  return (
    <div className="space-y-6">
      {/* Sticky Top Header */}
      <div className="sticky top-16 z-10 bg-bg/95 backdrop-blur-md border-b border-line py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-mute mb-1">
            <Link href="/roadmaps" className="hover:text-ink flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Roadmaps
            </Link>
            <span>/</span>
            <span>{data.skill.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {data.skill.name}
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
              {data.skill.level}
            </span>
          </div>
        </div>

        {/* Global Progress & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-mute font-mono">
                {progress.doneCount} of {progress.totalCount} topics ({progress.percent}%)
              </span>
            </div>
            <div className="w-36 h-2 rounded-full bg-surface border border-line overflow-hidden mt-1">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-mute" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Layout: Stage Accordion (8 cols) + Sticky Study Dossier (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Stage Accordions */}
        <div className="lg:col-span-8 space-y-4">
          {data.roadmap.data.stages.map((stage) => {
            const doneMap: Record<string, boolean> = {};
            stage.topics.forEach((t) => {
              doneMap[t.id] = data.topicProgress[t.id]?.done || false;
            });

            const stageInfo = calculateStageProgress(stage, doneMap);
            const isExpanded = !!expandedStages[stage.id];
            const isStageMastered = stageInfo.isCompleted;
            const isStageInProgress = stage.id === progress.currentStageId && !isStageMastered;
            const isStageLocked = stage.id > progress.currentStageId && stageInfo.doneCount === 0;

            return (
              <div
                key={stage.id}
                className="rounded-lg bg-surface border border-line shadow-card overflow-hidden transition-all"
              >
                {/* Stage Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleStage(stage.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-bg/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                        isStageMastered
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : isStageInProgress
                          ? "bg-primary text-white"
                          : "bg-bg text-mute border border-line"
                      }`}
                    >
                      {isStageMastered ? (
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      ) : isStageLocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        stage.id
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-mute">
                          Stage {stage.id}
                        </span>
                        {isStageMastered && (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Mastered
                          </span>
                        )}
                        {isStageInProgress && (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                            In-Progress
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-ink mt-0.5">
                        {stage.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-mute font-mono hidden sm:inline">
                      {stageInfo.doneCount} / {stageInfo.totalCount} topics ({stageInfo.percent}%)
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-mute transition-transform duration-200 ${
                        isExpanded ? "transform rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Topics List when expanded */}
                {isExpanded && (
                  <div className="border-t border-line divide-y divide-line/60 bg-bg/20">
                    {stage.topics.map((topic) => {
                      const isDone = data.topicProgress[topic.id]?.done || false;
                      const isSelected = selectedTopic?.id === topic.id;
                      const topicVideo =
                        data.topicProgress[topic.id]?.video_url ||
                        getSavedTopicVideo(data.roadmap.id, topic.id);

                      return (
                        <div
                          key={topic.id}
                          onClick={() => handleSelectTopic(topic)}
                          className={`p-3.5 sm:px-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary-tint/30 dark:bg-primary-tint/10 border-l-2 border-l-primary"
                              : "hover:bg-bg/60"
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleTopic(topic.id, isDone);
                              }}
                              className="w-4 h-4 rounded text-primary accent-primary mt-1 cursor-pointer shrink-0"
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[11px] font-medium text-mute">
                                  {topic.id}
                                </span>
                                <span
                                  className={`text-xs font-medium truncate ${
                                    isDone ? "line-through text-mute" : "text-ink"
                                  }`}
                                >
                                  {topic.title}
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded capitalize ${
                                    topic.difficulty === "easy"
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : topic.difficulty === "hard"
                                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  }`}
                                >
                                  {topic.difficulty}
                                </span>
                                {topicVideo && (
                                  <span
                                    className="p-0.5 text-red-500 inline-flex items-center"
                                    title="Has saved YouTube revision video"
                                  >
                                    <Youtube className="w-3.5 h-3.5 fill-red-500" />
                                  </span>
                                )}
                              </div>

                              {/* Subtopics snippet */}
                              {topic.subtopics && topic.subtopics.length > 0 && (
                                <p className="text-[11px] text-mute truncate mt-0.5">
                                  {topic.subtopics.join(" • ")}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Est. Minutes & Resources */}
                          <div className="flex items-center gap-2 shrink-0">
                            {topic.est_minutes && (
                              <span className="text-[11px] text-mute font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{topic.est_minutes}m</span>
                              </span>
                            )}
                            {topic.resources && topic.resources.length > 0 && (
                              <a
                                href={topic.resources[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded text-mute hover:text-primary hover:bg-bg transition-colors"
                                title={topic.resources[0].title || "External Resource"}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Sticky Study Dossier (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4 sticky top-36">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-ink">Study Dossier</h3>
              </div>
              <span className="text-[10px] text-mute font-mono">
                {notesSaveStatus === "saving" ? "Saving..." : notesSaveStatus === "saved" ? "Saved" : ""}
              </span>
            </div>

            {selectedTopic ? (
              <div className="space-y-4 text-xs">
                {/* Topic Title & Subtopics */}
                <div>
                  <span className="text-[11px] text-mute uppercase tracking-wider block">
                    Selected Topic ({selectedTopic.id})
                  </span>
                  <h4 className="text-sm font-semibold text-ink mt-0.5">
                    {selectedTopic.title}
                  </h4>
                  {selectedTopic.subtopics && selectedTopic.subtopics.length > 0 && (
                    <div className="mt-2 space-y-1 bg-bg p-2.5 rounded-md border border-line text-[11px] text-ink2">
                      <span className="font-semibold block text-[10px] text-mute uppercase">Subtopics:</span>
                      {selectedTopic.subtopics.map((sub, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          <span>{sub}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Revision Video Section */}
                <div className="rounded-md bg-bg border border-line p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-ink font-semibold text-xs">
                      <Youtube className="w-4 h-4 text-red-600 fill-red-600" />
                      <span>Revision Video</span>
                    </div>
                    <a
                      href={getYouTubeSearchUrl(selectedTopic.title, data.skill.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 dark:text-red-400 hover:text-red-500 flex items-center gap-1 text-[11px] font-medium transition-colors"
                      title="Search this topic on YouTube"
                    >
                      <span>Find on YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {currentTopicVideo ? (
                    <div className="space-y-2">
                      {getYouTubeEmbedUrl(currentTopicVideo) ? (
                        <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black shadow-inner">
                          <iframe
                            src={getYouTubeEmbedUrl(currentTopicVideo)!}
                            title={selectedTopic.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full border-0"
                          />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded bg-surface border border-line text-xs">
                          <a
                            href={currentTopicVideo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {currentTopicVideo}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <button
                          type="button"
                          onClick={() => setIsVideoInputOpen(!isVideoInputOpen)}
                          className="text-mute hover:text-ink underline cursor-pointer"
                        >
                          {isVideoInputOpen ? "Cancel Change" : "Change Video Link"}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveTopicVideo}
                          className="text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-mute leading-relaxed">
                        Found the best video tutorial for this topic? Paste the link here to revise it anytime.
                      </p>
                      {!isVideoInputOpen && (
                        <button
                          type="button"
                          onClick={() => setIsVideoInputOpen(true)}
                          className="w-full py-1.5 px-3 rounded bg-surface hover:bg-bg border border-line text-xs font-medium text-ink flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Paste YouTube Video Link</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Inline Paste input */}
                  {isVideoInputOpen && (
                    <div className="pt-2 border-t border-line space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          value={videoInputUrl}
                          onChange={(e) => setVideoInputUrl(e.target.value)}
                          placeholder="Paste YouTube link (https://youtu.be/...)"
                          className="flex-1 h-8 px-2.5 rounded bg-surface border border-line text-xs text-ink font-mono focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={handleSaveTopicVideo}
                          className="px-3 h-8 rounded bg-primary hover:bg-primary-hover text-white text-xs font-medium shrink-0 transition-colors shadow-sm cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Personal Study Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-ink font-medium">Personal Study Notes</label>
                    <span className="text-[10px] text-mute">Autosaves on blur</span>
                  </div>
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Capture code snippets, key takeaways, or concepts to revisit..."
                    className="w-full h-28 p-3 rounded-md bg-bg border border-line text-xs text-ink focus:outline-none focus:border-primary resize-none font-sans"
                  />
                </div>

                {/* Resource Links */}
                {selectedTopic.resources && selectedTopic.resources.length > 0 && (
                  <div>
                    <span className="text-[11px] text-mute font-medium block mb-1">
                      Recommended Free Resources
                    </span>
                    <div className="space-y-1">
                      {selectedTopic.resources.map((res, i) => (
                        <a
                          key={i}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded bg-bg hover:bg-primary-tint/20 text-ink text-[11px] transition-colors border border-line"
                        >
                          <span className="truncate">{res.title || res.url}</span>
                          <ExternalLink className="w-3 h-3 text-mute ml-2 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Doubt Assistant */}
                <div className="rounded-md bg-bg border border-line p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-primary font-medium text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Doubt Assistant</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyDoubt}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{doubtCopied ? "Copied!" : "Copy Prompt"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-mute leading-relaxed font-mono bg-surface p-2.5 rounded border border-line">
                    "I am learning {data.skill.name} and working on: {selectedTopic.title}. I am stuck here: [DESCRIBE WHERE]. Explain step by step in simple words..."
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-mute py-8 text-center">
                Select any topic from the curriculum on the left to inspect resources, notes, revision videos, and AI prompts.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
