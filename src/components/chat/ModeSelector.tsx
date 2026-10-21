"use client";

import { UNITS } from "@/data/characters";
import type { LearningMode, UnitId } from "@/types/chat";

interface ModeSelectorProps {
  mode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
  onPickUnit: (unit: UnitId) => void;
  disabled?: boolean;
}

const MODES = [
  { id: "own_problem", label: "내 문제 풀기" },
  { id: "hero_mission", label: "미션 받기" },
] as const;

export function ModeSelector({ mode, onModeChange, onPickUnit, disabled }: ModeSelectorProps) {
  return (
    <div className="space-y-2">
      {/* 공책의 두 칸짜리 탭처럼 붙어 있는 선택 버튼 */}
      <div role="radiogroup" aria-label="학습 모드" className="grid grid-cols-2 rounded-full bg-paper p-1">
        {MODES.map(({ id, label }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onModeChange(id)}
              className={`min-h-10 rounded-full px-3 font-display text-base transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                active ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {mode === "hero_mission" && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-1 pb-1 [scrollbar-width:none]" aria-label="미션 단원 고르기">
          {UNITS.map((u) => (
            <button
              key={u.id}
              type="button"
              disabled={disabled}
              onClick={() => onPickUnit(u.id)}
              className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-grid bg-white px-4 text-[15px] text-ink transition-colors hover:border-[var(--hero)] disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
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
