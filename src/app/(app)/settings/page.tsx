"use client";

import { useState } from "react";
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
} from "lucide-react";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { toast } from "sonner";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "ai" | "vault">("general");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-ink">
          Settings & Data Vault
        </h2>
        <p className="text-xs text-ink2">
          Manage your profile, preferred AI engine, streak forgiveness, and data backups.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "vault"
              ? "bg-primary text-white"
              : "text-mute hover:text-ink hover:bg-surface"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Data & Vault</span>
        </button>
      </div>

      {/* Tab 1: General */}
      {activeTab === "general" && (
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-4 max-w-xl">
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-ink font-medium mb-1">Display Name</label>
              <input
                type="text"
                defaultValue="Dhruv"
                className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-ink font-medium mb-1">Timezone</label>
              <select className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary">
                <option value="Asia/Kolkata">Asia/Kolkata (India Standard Time)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>

            <div>
              <label className="block text-ink font-medium mb-1">Microcopy Persona</label>
              <select className="w-full h-10 px-3 rounded-md bg-bg border border-line text-ink text-xs focus:outline-none focus:border-primary">
                <option value="hinglish">English + Light Hinglish ("Chalo, shuru karte hain!")</option>
                <option value="english">Pure English ("Let's get started")</option>
              </select>
            </div>

            <div>
              <label className="block text-ink font-medium mb-1">Streak Forgiveness Buffer</label>
              <p className="text-[11px] text-mute mb-2">
                Allows up to 3 missed days per 30-day chunk without breaking your streak.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary" />
                <span className="text-xs font-medium text-ink">Enable Forgiveness Buffer (3 days/chunk)</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => toast.success("Preferences saved!")}
                className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm"
              >
                Save Changes
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
              Highlights your preferred launcher button across all wizards and prompt screens.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {["ChatGPT", "Claude", "Gemini"].map((ai) => (
                <button
                  key={ai}
                  type="button"
                  className="p-2.5 rounded-md border border-line bg-bg hover:border-primary text-center font-medium text-ink transition-colors"
                >
                  {ai}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-ink font-medium mb-1">Custom Prompt Instructions</label>
            <p className="text-[11px] text-mute mb-2">
              Appended to every auto-compiled Prompt A, B, and C (e.g., "Emphasize real-world projects").
            </p>
            <textarea
              placeholder="e.g., Include links to official documentation whenever possible..."
              className="w-full h-24 p-3 rounded-md bg-bg border border-line text-xs text-ink focus:outline-none focus:border-primary resize-none"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Data & Vault */}
      {activeTab === "vault" && (
        <div className="rounded-lg bg-surface border border-line p-5 shadow-card space-y-5 max-w-xl text-xs">
          <div className="space-y-1">
            <h3 className="font-semibold text-ink">Data Ownership & Portability</h3>
            <p className="text-mute text-[11px]">
              You own 100% of your data. Export everything as a complete JSON backup at any time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => toast.success("JSON backup downloaded!")}
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-mute" />
              <span>Export Full Backup (JSON)</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-md border border-line bg-surface hover:bg-bg text-ink font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-mute" />
              <span>Import Backup</span>
            </button>
          </div>

          <div className="pt-4 border-t border-line space-y-2">
            <h4 className="font-semibold text-rose-600 dark:text-rose-400">Danger Zone</h4>
            <p className="text-mute text-[11px]">
              Irreversibly delete sample data or wipe all roadmaps and daily plans.
            </p>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All My Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
