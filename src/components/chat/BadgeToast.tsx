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
    <div role="status" className="pointer-events-none fixed inset-x-0 bottom-40 z-50 flex justify-center px-4">
      <div
        className="animate-pop-in flex items-center gap-3 rounded-2xl border-[2.5px] bg-white py-3 pr-5 pl-3 shadow-[0_6px_0_rgb(28_43_75/0.12)] motion-reduce:animate-none"
        style={{ borderColor: character.themeColor }}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-marker text-ink" aria-hidden>
          <Medal className="h-6 w-6" />
        </span>
        <div className="leading-snug">
          <p className="font-display text-xl text-ink">히어로 배지를 받았어!</p>
          <p className="text-[15px] text-ink-soft">
            {character.sampleLines.at(-1)} 지금까지 {badges}개 모았어.
          </p>
        </div>
      </div>
    </div>
  );
}
