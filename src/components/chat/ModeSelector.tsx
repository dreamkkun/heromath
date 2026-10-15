"use client";

import { BookOpenText, Swords } from "lucide-react";
import { UNITS } from "@/data/characters";
import type { LearningMode, UnitId } from "@/types/chat";

interface ModeSelectorProps {
  mode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
  onPickUnit: (unit: UnitId) => void;
  disabled?: boolean;
}

const MODES = [
  { id: "own_problem", label: "내가 가져온 문제", icon: BookOpenText },
  { id: "hero_mission", label: "히어로 맞춤 미션", icon: Swords },
] as const;

export function ModeSelector({ mode, onModeChange, onPickUnit, disabled }: ModeSelectorProps) {
  return (
    <div className="space-y-2">
      <div role="radiogroup" aria-label="학습 모드" className="grid grid-cols-2 gap-2">
        {MODES.map(({ id, label, icon: Icon }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onModeChange(id)}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-ink px-2 text-sm font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                active ? "bg-ink text-white" : "bg-white text-ink hover:bg-paper"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {mode === "hero_mission" && (
        <div className="flex gap-2 overflow-x-auto px-0.5 pt-1 pb-1.5 [scrollbar-width:none]" aria-label="미션 단원 고르기">
          {UNITS.map((u) => (
            <button
              key={u.id}
              type="button"
              disabled={disabled}
              onClick={() => onPickUnit(u.id)}
              className="flex min-h-11 shrink-0 items-center gap-1 rounded-full border-2 border-ink bg-white px-3 text-sm font-bold text-ink shadow-[2px_2px_0_var(--ink)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span aria-hidden>{u.emoji}</span>
              {u.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
