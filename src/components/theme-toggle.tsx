"use client";

import { motion } from "framer-motion";
import { useTheme } from "./theme-provider";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === "dark" : true;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={isDark ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
      className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-110 cursor-pointer outline-none border-0 shadow-none bg-transparent ${
        isDark
          ? "hover:bg-white/10 text-yellow-400"
          : "hover:bg-black/5 text-amber-500"
      } ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        fill="currentColor"
        strokeLinecap="round"
        viewBox="0 0 32 32"
        className="w-5 h-5"
      >
        <clipPath id="susanoo-theme-toggle-clip">
          <motion.path
            animate={{ 
              y: isDark ? 10 : 0, 
              x: isDark ? -12 : 0 
            }}
            transition={{ ease: "easeInOut", duration: 0.35 }}
            d="M0-5h30a1 1 0 0 0 9 13v24H0Z"
          />
        </clipPath>
        <g clipPath="url(#susanoo-theme-toggle-clip)">
          <motion.circle
            animate={{ 
              r: isDark ? 10 : 7.5,
              fill: isDark ? "#fbbf24" : "#f59e0b"
            }}
            transition={{ ease: "easeInOut", duration: 0.35 }}
            cx="16"
            cy="16"
          />
          <motion.g
            animate={{
              rotate: isDark ? -100 : 0,
              scale: isDark ? 0.3 : 1,
              opacity: isDark ? 0 : 1,
            }}
            transition={{ ease: "easeInOut", duration: 0.35 }}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M16 5.5v-4" />
            <path d="M16 30.5v-4" />
            <path d="M1.5 16h4" />
            <path d="M26.5 16h4" />
            <path d="m23.4 8.6 2.8-2.8" />
            <path d="m5.7 26.3 2.9-2.9" />
            <path d="m5.8 5.8 2.8 2.8" />
            <path d="m23.4 23.4 2.9 2.9" />
          </motion.g>
        </g>
      </svg>
    </button>
  );
}
