"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Plus, Route, CalendarDays, ChevronDown } from "lucide-react";
import { SyncPill } from "./SyncPill";

export function TopBar() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        const searchInput = document.getElementById("global-search");
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Determine breadcrumb title
  const getPageTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (pathname === "/roadmaps") return "Skill Roadmaps";
    if (pathname === "/roadmaps/new") return "New Roadmap Wizard";
    if (pathname.startsWith("/roadmaps/")) return "Roadmap Detail";
    if (pathname === "/plans") return "Daily Plans";
    if (pathname === "/plans/new") return "New 30-Day Plan";
    if (pathname.includes("/chunk-end")) return "30-Day Chunk End Ritual";
    if (pathname.startsWith("/plans/")) return "Today's To-Do";
    if (pathname.startsWith("/focus/")) return "Focus Mode";
    if (pathname === "/history") return "History & Progress";
    if (pathname === "/settings") return "Settings & Data Vault";
    return "Roadmap Planner";
  };

  return (
    <header className="h-16 border-b border-line bg-surface/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-4 lg:px-8">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold text-ink tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-3">
        {/* Search Input with '/' hint */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-3.5 h-3.5 text-mute absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="global-search"
            type="text"
            placeholder="Search skills & tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-md bg-bg border border-line text-xs text-ink placeholder:text-mute focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-mute bg-surface rounded border border-line pointer-events-none">
            /
          </kbd>
        </div>

        {/* Sync Pill */}
        <SyncPill state="synced" />

        {/* + New Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-surface border border-line shadow-card-hover py-1 z-50 animate-in fade-in-50 zoom-in-95">
                <Link
                  href="/roadmaps/new"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-bg transition-colors"
                >
                  <Route className="w-4 h-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium">New Roadmap</span>
                    <span className="text-[10px] text-mute">From prompt & JSON</span>
                  </div>
                </Link>
                <Link
                  href="/plans/new"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-bg transition-colors"
                >
                  <CalendarDays className="w-4 h-4 text-success" />
                  <div className="flex flex-col">
                    <span className="font-medium">New 30-Day Plan</span>
                    <span className="text-[10px] text-mute">From roadmap & deadline</span>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
