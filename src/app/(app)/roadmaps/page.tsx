"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Route,
  Upload,
  Download,
  Trash2,
  ArrowRight,
  Search,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchSkillsWithRoadmaps,
  deleteSkillAndRoadmap,
  createNewRoadmap,
  SkillWithRoadmap,
} from "@/lib/data/roadmaps";
import { validateRoadmapJson } from "@/lib/json-extract";
import { toast } from "sonner";

export default function RoadmapsPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<SkillWithRoadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [deleteModalSkill, setDeleteModalSkill] = useState<SkillWithRoadmap | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSkills = async () => {
    setLoading(true);
    const supabase = isSupabaseConfigured() ? createClient() : null;
    const data = await fetchSkillsWithRoadmaps(supabase, user?.id);
    setSkills(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSkills();
  }, [user]);

  // Handle Roadmap JSON Download
  const handleDownloadJson = (item: SkillWithRoadmap) => {
    if (!item.roadmap?.data) return;
    const jsonStr = JSON.stringify(item.roadmap.data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.name.toLowerCase().replace(/\s+/g, "_")}_roadmap.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Roadmap JSON downloaded!");
  };

  // Handle Roadmap JSON File Upload / Import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const validation = validateRoadmapJson(content);

      if (!validation.ok || !validation.data) {
        toast.error(`Invalid roadmap file: ${validation.errors[0] || "Unknown error"}`);
        return;
      }

      try {
        const supabase = isSupabaseConfigured() ? createClient() : null;
        await createNewRoadmap(validation.data, 120, supabase, user?.id);
        toast.success(`Imported "${validation.data.skill}" successfully!`);
        loadSkills();
      } catch (err: any) {
        toast.error(err.message || "Failed to import roadmap.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle Delete Skill & Roadmap
  const handleDelete = async () => {
    if (!deleteModalSkill) return;
    try {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      await deleteSkillAndRoadmap(deleteModalSkill.id, supabase, user?.id);
      toast.success(`Deleted "${deleteModalSkill.name}" and all its plans.`);
      setDeleteModalSkill(null);
      loadSkills();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete skill.");
    }
  };

  // Filtering
  const filteredSkills = skills.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel =
      levelFilter === "all" || s.level.toLowerCase() === levelFilter.toLowerCase();
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Skill Roadmaps</h2>
          <p className="text-xs text-ink2">
            Organize multi-stage curricula and track topic mastery step-by-step.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Hidden File Input for Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium transition-colors"
            title="Import a downloaded roadmap JSON file"
          >
            <Upload className="w-3.5 h-3.5 text-mute" />
            <span>Import JSON</span>
          </button>

          <Link
            href="/roadmaps/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Skill Roadmap</span>
          </Link>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Active Roadmaps</span>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {skills.length}
          </p>
        </div>
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Mastered Topics</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {skills.reduce((acc, curr) => acc + curr.stats.doneTopics, 0)}
          </p>
        </div>
        <div className="rounded-lg bg-surface border border-line p-4 shadow-card">
          <span className="text-xs text-mute">Curricula in Progress</span>
          <p className="text-2xl font-bold font-mono text-primary mt-1">
            {skills.filter((s) => s.status === "active").length}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-mute absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter roadmaps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-line text-xs text-ink placeholder:text-mute focus:outline-none focus:border-primary"
          />
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto text-xs">
          {["all", "beginner", "intermediate", "advanced"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1 rounded-full capitalize font-medium transition-colors ${
                levelFilter === lvl
                  ? "bg-primary text-white"
                  : "bg-surface border border-line text-mute hover:text-ink"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Roadmaps Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-lg bg-surface border border-line animate-pulse p-5" />
          ))}
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="rounded-lg bg-surface border border-line p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Route className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-ink">No roadmaps found</h3>
            <p className="text-xs text-mute max-w-sm mx-auto">
              Ready to learn a new skill? Use Prompt A to generate a structured curriculum in seconds.
            </p>
          </div>
          <Link
            href="/roadmaps/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Roadmap</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map((skillItem) => {
            const stagesCount = skillItem.roadmap?.data?.stages?.length || 0;
            const roadmapId = skillItem.roadmap?.id || skillItem.id;

            return (
              <div
                key={skillItem.id}
                className="rounded-lg bg-surface border border-line p-5 shadow-card hover:shadow-card-hover transition-all border-l-4 border-l-primary flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 capitalize">
                      {skillItem.level}
                    </span>
                    <span className="text-xs text-mute font-mono">
                      {stagesCount} Stages • {skillItem.stats.totalTopics} Topics
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-ink">
                      {skillItem.name}
                    </h3>
                    <p className="text-xs text-ink2 line-clamp-2 mt-1">
                      {skillItem.roadmap?.data?.summary ||
                        "Structured learning journey broken down stage by stage."}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mute text-[11px]">
                      Mastered {skillItem.stats.doneTopics} of {skillItem.stats.totalTopics} topics
                    </span>
                    <span className="font-mono font-semibold text-ink">
                      {skillItem.stats.percent}%
                    </span>
                  </div>
                  <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${skillItem.stats.percent}%` }}
                    />
                  </div>
                </div>

                {/* Actions row */}
                <div className="pt-3 border-t border-line flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadJson(skillItem)}
                      className="p-1.5 rounded text-mute hover:text-ink hover:bg-bg transition-colors"
                      title="Download JSON file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteModalSkill(skillItem)}
                      className="p-1.5 rounded text-mute hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                      title="Delete roadmap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link
                    href={`/roadmaps/${roadmapId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
                  >
                    <span>Open Roadmap</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Create new dashed card */}
          <Link
            href="/roadmaps/new"
            className="rounded-lg border-2 border-dashed border-line hover:border-primary/50 p-6 flex flex-col items-center justify-center text-center gap-2 transition-colors group bg-bg/50"
          >
            <div className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-mute group-hover:text-primary group-hover:scale-110 transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
              Embark on a new mastery journey
            </span>
            <span className="text-xs text-mute max-w-xs">
              Generate with Prompt A, ask your favourite AI, and paste JSON.
            </span>
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalSkill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-lg p-6 max-w-md w-full shadow-dialog space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-ink">Delete Skill Roadmap?</h3>
            </div>

            <p className="text-xs text-ink2 leading-relaxed">
              Are you sure you want to delete <strong>"{deleteModalSkill.name}"</strong>? This will permanently delete the curriculum, all its 30-day sprint plans, and logged tasks.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalSkill(null)}
                className="px-3.5 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
