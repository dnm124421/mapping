"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-md bg-line/20 animate-pulse" />;
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 p-2 rounded-md hover:bg-surface border border-line text-ink2 hover:text-ink transition-colors text-xs font-medium"
      title={`Theme: ${theme}. Click to change.`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Moon className="w-4 h-4 text-primary" />
      ) : theme === "light" ? (
        <Sun className="w-4 h-4 text-warning" />
      ) : (
        <Laptop className="w-4 h-4 text-mute" />
      )}
      <span className="capitalize hidden md:inline">{theme}</span>
    </button>
  );
}
