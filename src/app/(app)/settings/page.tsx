"use client";

import { useState, useEffect, useRef } from "react";
import {
  Settings,
  Database,
  Download,
  Upload,
  Trash2,
  Sparkles,
  Bell,
  Shield,
  User,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchSkillsWithRoadmaps } from "@/lib/data/roadmaps";
import { fetchPlans } from "@/lib/data/plans";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"general" | "ai" | "vault">("general");

  // General Form State
  const [displayName, setDisplayName] = useState("Dhruv");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [persona, setPersona] = useState<"hinglish" | "english">("hinglish");
  const [forgivenessEnabled, setForgivenessEnabled] = useState(true);

  // AI Prompt Engine State
  const [preferredAi, setPreferredAi] = useState<string>("ChatGPT");
  const [customPromptInstructions, setCustomPromptInstructions] = useState("");

  // Saving state
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from profile or local storage
  useEffect(() => {
    if (profile) {
      if (profile.display_name) setDisplayName(profile.display_name);
      if (profile.timezone) setTimezone(profile.timezone);
      if (profile.preferred_ai) setPreferredAi(profile.preferred_ai);
      if (profile.settings) {
        if (profile.settings.persona) setPersona(profile.settings.persona);
        if (profile.settings.forgiveness !== undefined) setForgivenessEnabled(profile.settings.forgiveness);
        if (profile.settings.customPromptInstructions) setCustomPromptInstructions(profile.settings.customPromptInstructions);
      }
    } else if (typeof window !== "undefined") {
      const saved = localStorage.getItem("roadmap_planner_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.displayName) setDisplayName(parsed.displayName);
          if (parsed.timezone) setTimezone(parsed.timezone);
          if (parsed.persona) setPersona(parsed.persona);
          if (parsed.preferredAi) setPreferredAi(parsed.preferredAi);
          if (parsed.customPromptInstructions) setCustomPromptInstructions(parsed.customPromptInstructions);
        } catch {}
      }
    }
  }, [profile]);

  // Save General & AI Settings
  const handleSaveSettings = async () => {
    setSaving(true);
    const settingsObj = {
      displayName,
      timezone,
      persona,
      forgiveness: forgivenessEnabled,
      preferredAi,
      customPromptInstructions,
    };

    // Save to local storage
    if (typeof window !== "undefined") {
      localStorage.setItem("roadmap_planner_settings", JSON.stringify(settingsObj));
    }

    // Save to Supabase if logged in
    const supabase = isSupabaseConfigured() ? createClient() : null;
    if (supabase && user) {
      try {
        await supabase
          .from("profiles")
          .update({
            display_name: displayName,
            timezone,
            preferred_ai: preferredAi,
            settings: {
              persona,
              forgiveness: forgivenessEnabled,
              customPromptInstructions,
            },
          })
          .eq("id", user.id);
        await refreshProfile();
      } catch (err: any) {
        console.warn("Supabase profile update warning:", err);
      }
    }

    setSaving(false);
    toast.success("Preferences updated successfully!");
  };

  // Full Vault Export
  const handleExportFullVault = async () => {
    try {
      const supabase = isSupabaseConfigured() ? createClient() : null;
      const [skills, plans] = await Promise.all([
        fetchSkillsWithRoadmaps(supabase, user?.id),
        fetchPlans(supabase, user?.id),
      ]);

      const backupData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        user: {
          id: user?.id || "local-user",
          displayName,
          timezone,
          preferredAi,
        },
        skills,
        plans,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `roadmap_planner_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success("Complete JSON backup downloaded!");
    } catch {
      toast.error("Failed to export backup.");
    }
  };

  // Import Full Vault
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const raw = event.target?.result as string;
        const data = JSON.parse(raw);

        if (!data.skills && !data.plans) {
          throw new Error("Invalid backup format");
        }

        if (typeof window !== "undefined") {
          if (data.skills) {
            localStorage.setItem("roadmap_planner_skills_roadmaps", JSON.stringify(data.skills));
          }
          if (data.plans) {
            localStorage.setItem("roadmap_planner_plans_data", JSON.stringify(data.plans));
          }
        }

        toast.success("Backup imported successfully! Reloading data...");
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        toast.error("Invalid backup file. Could not parse JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Wipe All Data
  const handleWipeAllData = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all roadmaps, plans, and focus history? This cannot be undone."
    );
    if (!confirmed) return;

    if (typeof window !== "undefined") {
      localStorage.removeItem("roadmap_planner_skills_roadmaps");
      localStorage.removeItem("roadmap_planner_plans_data");
      localStorage.removeItem("roadmap_planner_focus_sessions");
      localStorage.removeItem("roadmap_planner_topic_progress");
    }

    toast.success("All local data wiped. Reset to clean slate.");
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">
          Settings & Data Vault
        </h2>
        <p className="text-xs text-ink2 mt-0.5">
          Manage your profile, preferred AI engine, streak forgiveness, and data backups.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "general"
              ? "bg-primary text-white"
              : "text-mute hover:text-ink hover:bg-surface"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>General & Profile</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "ai"
              ? "bg-primary text-white"
              : "text-mute hover:text-ink hover:bg-surface"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Prompt Engine</span>
        </button>

        <button
          onClick={() => setActiveTab("vault")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "vault"
              ? "bg-primary text-white"
              : "text-mute hover:text-ink hover:bg-surface"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Data & Vault</span>
        </button>
      </div>

      {/* Tab 1: General & Profile */}
      {activeTab === "general" && (
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4 max-w-xl">
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-ink font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-ink font-medium mb-1">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST • UTC+5:30)</option>
                <option value="UTC">UTC (Universal Time)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>

            <div>
              <label className="block text-ink font-medium mb-1">Microcopy Persona</label>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value as any)}
                className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="hinglish">English + Light Hinglish ("Chalo, shuru karte hain!")</option>
                <option value="english">Pure English ("Let's get started")</option>
              </select>
            </div>

            <div className="pt-1">
              <label className="block text-ink font-medium mb-1">Streak Forgiveness Buffer</label>
              <p className="text-[11px] text-mute mb-2">
                Allows up to 3 missed days per 30-day chunk without breaking your streak.
              </p>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={forgivenessEnabled}
                  onChange={(e) => setForgivenessEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-primary accent-primary"
                />
                <span className="text-xs font-medium text-ink">
                  Enable Forgiveness Buffer (3 days per chunk)
                </span>
              </label>
            </div>

            <div className="pt-2 border-t border-line flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Prompt Engine */}
      {activeTab === "ai" && (
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4 max-w-xl text-xs">
          <div>
            <label className="block text-ink font-medium mb-1">Preferred AI</label>
            <p className="text-[11px] text-mute mb-2">
              Default tool launcher across all wizards and prompt screens.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {["ChatGPT", "Claude", "Gemini"].map((ai) => (
                <button
                  key={ai}
                  type="button"
                  onClick={() => setPreferredAi(ai)}
                  className={`p-2.5 rounded-md border text-center font-medium transition-colors cursor-pointer ${
                    preferredAi === ai
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-line bg-bg text-ink hover:border-primary/50"
                  }`}
                >
                  {ai}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-ink font-medium mb-1">Custom Prompt Instructions</label>
            <p className="text-[11px] text-mute mb-2">
              Appended to every auto-compiled Prompt A, B, and C (e.g., "Emphasize practical coding drills").
            </p>
            <textarea
              value={customPromptInstructions}
              onChange={(e) => setCustomPromptInstructions(e.target.value)}
              placeholder="e.g., Include links to official documentation whenever possible..."
              className="w-full h-24 p-3 rounded-md bg-bg border border-line text-xs text-ink focus:outline-none focus:border-primary resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 border-t border-line flex justify-end">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              {saving ? "Saving..." : "Save AI Preferences"}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Data & Vault */}
      {activeTab === "vault" && (
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-5 max-w-xl text-xs">
          <div className="space-y-1">
            <h3 className="font-semibold text-ink">Data Ownership & Portability</h3>
            <p className="text-mute text-[11px] leading-relaxed">
              You own 100% of your curricula, sprint chunks, and telemetry. Export your full data vault anytime as a structured JSON file.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleExportFullVault}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-md border border-line bg-surface hover:bg-bg text-ink font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-mute" />
              <span>Export Full Vault (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-md border border-line bg-surface hover:bg-bg text-ink font-medium transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-mute" />
              <span>Import Full Vault</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </div>

          <div className="pt-4 border-t border-line space-y-2">
            <h4 className="font-semibold text-rose-600 dark:text-rose-400">Danger Zone</h4>
            <p className="text-mute text-[11px] leading-relaxed">
              Irreversibly wipe all local roadmaps, sprint plans, and telemetry.
            </p>
            <button
              type="button"
              onClick={handleWipeAllData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wipe All My Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
