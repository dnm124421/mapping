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
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchRoadmapById,
  toggleTopicProgress,
  saveTopicNotes,
} from "@/lib/data/roadmaps";
import { Roadmap, Stage, Topic } from "@/lib/schemas";
import { calculateRoadmapProgress, calculateStageProgress } from "@/lib/logic/progress";
import { buildDoubtPrompt } from "@/lib/prompts";
import { toast } from "sonner";

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const roadmapId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    roadmap: { id: string; version: number; data: Roadmap; daily_minutes?: number };
    skill: { id: string; name: string; level: string; category?: string };
    topicProgress: Record<string, { done: boolean; notes?: string }>;
  } | null>(null);

  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({});
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [notesText, setNotesText] = useState("");
  const [notesSaveStatus, setNotesSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const [doubtCopied, setDoubtCopied] = useState(false);

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
    const activeStage = res.roadmap.data.stages.find((s) => s.id === progressInfo.currentStageId) || res.roadmap.data.stages[0];
    if (activeStage && activeStage.topics.length > 0) {
      setSelectedTopic(activeStage.topics[0]);
      setNotesText(res.topicProgress[activeStage.topics[0].id]?.notes || "");
    }

    setLoading(false);
  };

  useEffect(() => {
    if (roadmapId) {
      loadRoadmap();
    }
  }, [roadmapId, user]);

  // Sync selected topic notes when changing topic
  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setNotesText(data?.topicProgress[topic.id]?.notes || "");
    setNotesSaveStatus("idle");
  };

  // Optimistic Topic Progress Toggle
  const handleToggleTopic = async (topicId: string, currentDone: boolean) => {
    if (!data) return;

    const newDone = !currentDone;

    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
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
      await toggleTopicProgress(data.roadmap.id, topicId, newDone, supabase, user?.id);
      toast.success(newDone ? "Topic marked complete!" : "Topic unchecked.");
    } catch (err: any) {
      // Rollback on error
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          topicProgress: {
            ...prev.topicProgress,
            [topicId]: {
              ...prev.topicProgress[topicId],
              done: currentDone,
            },
          },
        };
      });
      toast.error(err.message || "Failed to update topic status.");
    }
  };

  // Autosave Notes with Debounce
  useEffect(() => {
    if (!selectedTopic || !data) return;

    setNotesSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const supabase = isSupabaseConfigured() ? createClient() : null;
        await saveTopicNotes(data.roadmap.id, selectedTopic.id, notesText, supabase, user?.id);
        setData((prev) => {
          if (!prev) return prev;
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

  return (
    <div className="space-y-6">
      {/* Sticky Top Header */}
      <div className="sticky top-16 z-10 bg-bg/95 backdrop-blur-md border-b border-line py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-mute">
            <Link href="/roadmaps" className="hover:text-ink flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Roadmaps
            </Link>
            <span>/</span>
            <span className="text-ink font-medium">{data.skill.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              {data.skill.name}
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 capitalize">
              {data.skill.level}
            </span>
            <span className="text-xs text-mute font-mono">
              {progress.doneCount} / {progress.totalCount} topics ({progress.percent}%)
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors"
            title="Download full roadmap as JSON"
          >
            <Download className="w-3.5 h-3.5 text-mute" />
            <span className="hidden sm:inline">Download JSON</span>
          </button>

          <Link
            href={`/plans/new?roadmap=${data.roadmap.id}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Create 30-Day Plan</span>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stage Accordion (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {data.roadmap.data.stages.map((stage) => {
            const doneMap: Record<string, boolean> = {};
            stage.topics.forEach((t) => {
              doneMap[t.id] = data.topicProgress[t.id]?.done || false;
            });
            const stageRes = calculateStageProgress(stage, doneMap);
            const isExpanded = expandedStages[stage.id] ?? false;
            const isCurrent = stage.id === progress.currentStageId;
            const isLocked = stage.id > progress.currentStageId && !stageRes.isCompleted;

            return (
              <div
                key={stage.id}
                className={`rounded-lg bg-surface border transition-all overflow-hidden ${
                  isCurrent
                    ? "border-primary/40 shadow-card ring-1 ring-primary/20"
                    : stageRes.isCompleted
                    ? "border-emerald-500/30 shadow-card"
                    : "border-line shadow-card"
                }`}
              >
                {/* Stage Header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedStages((prev) => ({
                      ...prev,
                      [stage.id]: !isExpanded,
                    }))
                  }
                  className={`w-full p-4 text-left flex items-center justify-between transition-colors ${
                    isCurrent
                      ? "bg-primary-tint/40 dark:bg-primary-tint/10"
                      : stageRes.isCompleted
                      ? "bg-emerald-500/5"
                      : "bg-surface hover:bg-bg/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        stageRes.isCompleted
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-primary text-white shadow-sm"
                          : "bg-line text-mute"
                      }`}
                    >
                      {stageRes.isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : isLocked ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        stage.id
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-ink truncate">
                          Stage {stage.id}: {stage.title}
                        </h3>
                        {stageRes.isCompleted && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Mastered 100%
                          </span>
                        )}
                        {isCurrent && !stageRes.isCompleted && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-mute truncate mt-0.5">
                        {stage.goal} • Est. {stage.est_weeks} weeks
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs font-mono font-medium text-mute">
                      {stageRes.doneCount}/{stageRes.totalCount}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-mute" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-mute" />
                    )}
                  </div>
                </button>

                {/* Topics List (Expanded) */}
                {isExpanded && (
                  <div className="divide-y divide-line border-t border-line bg-surface/50">
                    {stage.topics.map((topic) => {
                      const isDone = data.topicProgress[topic.id]?.done || false;
                      const isSelected = selectedTopic?.id === topic.id;

                      return (
                        <div
                          key={topic.id}
                          onClick={() => handleSelectTopic(topic)}
                          className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-primary-tint/30 dark:bg-primary-tint/15 border-l-2 border-l-primary"
                              : "hover:bg-bg"
                          }`}
                        >
                          {/* Checkbox & Topic Info */}
                          <div className="flex items-start gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleTopic(topic.id, isDone);
                              }}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mt-0.5 shrink-0 ${
                                isDone
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                                  : "border-line bg-surface hover:border-primary"
                              }`}
                              title={isDone ? "Mark as not done" : "Mark as completed"}
                            >
                              {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-medium ${isDone ? "line-through text-mute" : "text-ink"}`}>
                                  {topic.id} {topic.title}
                                </span>
                                {topic.difficulty && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] capitalize font-medium ${
                                      topic.difficulty === "easy"
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : topic.difficulty === "medium"
                                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                    }`}
                                  >
                                    {topic.difficulty}
                                  </span>
                                )}
                                {data.topicProgress[topic.id]?.notes && (
                                  <span className="text-[10px] text-mute flex items-center gap-0.5">
                                    <NotebookPen className="w-3 h-3 text-primary" />
                                    <span>Notes</span>
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
                    className="w-full h-32 p-3 rounded-md bg-bg border border-line text-xs text-ink focus:outline-none focus:border-primary resize-none font-sans"
                  />
                </div>

                {/* Resource Links */}
                {selectedTopic.resources && selectedTopic.resources.length > 0 && (
                  <div>
                    <span className="text-[11px] text-mute font-medium block mb-1">
                      Recommended Resources
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
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{doubtCopied ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-mute leading-relaxed font-mono bg-surface p-2.5 rounded border border-line">
                    "I am learning {data.skill.name} and working on: {selectedTopic.title}. I am stuck here: [DESCRIBE WHERE]. Explain step by step in simple words..."
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-mute">Select any topic row to view its study dossier.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
