"use client";

import { Medal } from "lucide-react";
import { useEffect } from "react";
import type { Character } from "@/types/chat";

const TOAST_MS = 3200;

interface BadgeToastProps {
  character: Character;
  badges: number;
  onDone: () => void;
}

export function BadgeToast({ character, badges, onDone }: BadgeToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, TOAST_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-24 z-50 flex justify-center px-4"
    >
      <div className="animate-pop-in flex items-center gap-3 rounded-2xl border-[3px] border-ink bg-white px-5 py-3 shadow-[5px_5px_0_var(--ink)] motion-reduce:animate-none">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-ink text-white"
          style={{ backgroundColor: character.themeColor }}
          aria-hidden
        >
          <Medal className="h-6 w-6" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-lg text-ink">히어로 배지 획득!</p>
          <p className="text-sm text-ink-soft">
            {character.sampleLines.at(-1)} · 지금까지 <b className="text-ink tabular-nums">{badges}</b>개
          </p>
        </div>
      </div>
    </div>
  );
}
