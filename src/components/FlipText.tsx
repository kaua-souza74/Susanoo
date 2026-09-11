"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlipTextProps {
  phrases: readonly string[];
  duration?: number;
  className?: string;
}

export default function FlipText({ phrases, duration = 3.2, className }: FlipTextProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const currentPhrase = phrases[activeIndex] ?? "";

  useEffect(() => {
    if (prefersReducedMotion || phrases.length < 2) return;
    const interval = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % phrases.length),
      duration * 1000,
    );
    return () => window.clearInterval(interval);
  }, [duration, phrases.length, prefersReducedMotion]);

  return (
    <div className={cn("relative flex min-h-[2.4em] items-center justify-center overflow-hidden", className)} aria-live="polite">
      <span className="sr-only">{currentPhrase}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={activeIndex}
          aria-hidden="true"
          className="block text-center"
          style={{ transformPerspective: 900, transformOrigin: "center center" }}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, rotateX: 80, y: 18 }}
          animate={{ opacity: 1, rotateX: 0, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, rotateX: -80, y: -18 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {currentPhrase}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
