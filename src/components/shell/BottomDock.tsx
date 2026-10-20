"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Route, Plus, CalendarDays, TrendingUp } from "lucide-react";

export function BottomDock() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-md border-t border-line z-30 flex items-center justify-around px-3">
      {/* Dashboard */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center gap-1 w-12 py-1 text-[11px] font-medium transition-colors ${
          pathname === "/" ? "text-primary" : "text-mute hover:text-ink"
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </Link>

      {/* Roadmaps */}
      <Link
        href="/roadmaps"
        className={`flex flex-col items-center justify-center gap-1 w-12 py-1 text-[11px] font-medium transition-colors ${
          pathname.startsWith("/roadmaps") ? "text-primary" : "text-mute hover:text-ink"
        }`}
      >
        <Route className="w-5 h-5" />
        <span>Skills</span>
      </Link>

      {/* Center + Action */}
      <Link
        href="/roadmaps/new"
        className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-hover active:scale-95 transition-all -mt-3 border-2 border-surface"
        title="Create New Roadmap or Plan"
      >
        <Plus className="w-6 h-6" />
      </Link>

      {/* Daily Plans */}
      <Link
        href="/plans"
        className={`flex flex-col items-center justify-center gap-1 w-12 py-1 text-[11px] font-medium transition-colors ${
          pathname.startsWith("/plans") ? "text-primary" : "text-mute hover:text-ink"
        }`}
      >
        <CalendarDays className="w-5 h-5" />
        <span>Plans</span>
      </Link>

      {/* History */}
      <Link
        href="/history"
        className={`flex flex-col items-center justify-center gap-1 w-12 py-1 text-[11px] font-medium transition-colors ${
          pathname.startsWith("/history") ? "text-primary" : "text-mute hover:text-ink"
        }`}
      >
        <TrendingUp className="w-5 h-5" />
        <span>History</span>
      </Link>
    </nav>
  );
}
