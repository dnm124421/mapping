"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

export type SyncState = "synced" | "saving" | "offline";

export function SyncPill({ state = "synced" }: { state?: SyncState }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const effectiveState: SyncState = !isOnline ? "offline" : state;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        effectiveState === "synced"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          : effectiveState === "saving"
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      }`}
      title={
        effectiveState === "synced"
          ? "All changes synced to your account"
          : effectiveState === "saving"
          ? "Saving changes to database..."
          : "Working offline. Changes will sync when reconnected."
      }
    >
      {effectiveState === "synced" && (
        <>
          <Cloud className="w-3.5 h-3.5" />
          <span>Synced</span>
        </>
      )}
      {effectiveState === "saving" && (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Saving…</span>
        </>
      )}
      {effectiveState === "offline" && (
        <>
          <CloudOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}
