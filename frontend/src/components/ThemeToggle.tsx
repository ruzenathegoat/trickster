import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import clsx from "clsx";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 border-4 border-theme-border bg-theme-bg flex items-center justify-center shadow-[4px_4px_0px_0px_var(--color-theme-shadow)] opacity-50">
        <span className="w-5 h-5" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={clsx(
        "relative w-10 h-10 flex items-center justify-center overflow-hidden transition-all duration-300",
        "border-4 border-theme-border",
        "bg-theme-bg",
        "hover:bg-[var(--color-primary)]",
        "hover:scale-110 active:scale-95",
        "shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]",
        "hover:shadow-[4px_4px_0px_0px_var(--color-theme-shadow)]"
      )}
      aria-label="Toggle theme"
    >
      <div
        className={clsx(
          "absolute inset-0 flex items-center justify-center transition-transform duration-500",
          isDark ? "translate-y-10" : "translate-y-0"
        )}
      >
        <Moon weight="bold" size={20} className="text-black" />
      </div>
      <div
        className={clsx(
          "absolute inset-0 flex items-center justify-center transition-transform duration-500",
          isDark ? "translate-y-0" : "-translate-y-10"
        )}
      >
        <Sun weight="bold" size={20} className="text-white" />
      </div>
    </button>
  );
}
