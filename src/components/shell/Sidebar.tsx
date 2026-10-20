"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Route,
  CalendarDays,
  TrendingUp,
  Settings,
  Flame,
  ExternalLink,
  Sparkles,
  LogOut,
} from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Roadmaps", href: "/roadmaps", icon: Route },
  { name: "Daily Plans", href: "/plans", icon: CalendarDays },
  { name: "History & Progress", href: "/history", icon: TrendingUp },
];

const AI_HELPERS = [
  { name: "ChatGPT", url: "https://chatgpt.com" },
  { name: "Claude", url: "https://claude.ai" },
  { name: "Gemini", url: "https://gemini.google.com" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();

  const displayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Dhruv";

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="hidden lg:flex w-60 flex-col justify-between border-r border-line bg-surface/80 backdrop-blur-sm fixed top-0 bottom-0 left-0 z-30">
      {/* Brand & Nav */}
      <div className="flex flex-col p-4 space-y-6 overflow-y-auto">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 px-2 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Route className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-ink group-hover:text-primary transition-colors">
              {APP_NAME}
            </span>
            <span className="text-[11px] text-mute">{APP_TAGLINE}</span>
          </div>
        </Link>

        {/* Main Navigation */}
        <nav className="space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-mute">
            Menu
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-ink2 hover:bg-bg hover:text-ink"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-mute"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick AI Helpers */}
        <div className="pt-2">
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-mute flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>AI Launchers</span>
          </div>
          <div className="space-y-1">
            {AI_HELPERS.map((ai) => (
              <a
                key={ai.name}
                href={ai.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-1.5 rounded-md text-xs text-ink2 hover:bg-bg hover:text-primary transition-colors group"
              >
                <span>{ai.name}</span>
                <ExternalLink className="w-3 h-3 text-mute group-hover:text-primary transition-colors opacity-70 group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom User & Controls Block */}
      <div className="p-3 border-t border-line bg-surface/90 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium border border-amber-500/20">
            <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>0 day streak</span>
          </div>
          <ThemeToggle />
        </div>

        {user ? (
          <div className="flex items-center justify-between p-2 rounded-md bg-bg border border-line">
            <div className="flex items-center gap-2.5 min-w-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-7 h-7 rounded-full object-cover border border-line"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                  {initial}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-ink truncate" title={displayName}>
                  {displayName}
                </span>
                <span className="text-[10px] text-mute truncate">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/settings"
                className="p-1.5 rounded-md text-mute hover:text-ink hover:bg-surface transition-colors"
                title="Settings & Data Vault"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="p-1.5 rounded-md text-mute hover:text-rose-600 hover:bg-surface transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Sign In to Supabase</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
