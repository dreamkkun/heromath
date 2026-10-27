"use client";

import { Lightbulb, PencilLine } from "lucide-react";
import { useState } from "react";
import { UNITS } from "@/data/characters";
import type { Difficulty, LearningMode, UnitId } from "@/types/chat";

interface ModeSelectorProps {
  mode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
  onPickUnit: (unit: UnitId) => void;
  onPickQuiz: (unit: UnitId) => void;
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  disabled?: boolean;
}

const DIFFICULTIES = [
  { id: "basic", label: "기본" },
  { id: "challenge", label: "도전" },
] as const;

const MODES = [
  { id: "own_problem", label: "내 문제 풀기" },
  { id: "hero_mission", label: "미션 받기" },
] as const;

export function ModeSelector({
  mode,
  onModeChange,
  onPickUnit,
  onPickQuiz,
  difficulty,
  onDifficultyChange,
  disabled,
}: ModeSelectorProps) {
  // 단원을 고르면 '문제 받기'와 '개념 퀴즈' 중 무엇을 할지 한 번 더 고른다
  const [unit, setUnit] = useState<UnitId | null>(null);
  const unitInfo = UNITS.find((u) => u.id === unit);

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
        <>
          <div
            role="radiogroup"
            aria-label="미션 단원 고르기"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-1 pb-1 [scrollbar-width:none]"
          >
            {UNITS.map((u) => {
              const active = u.id === unit;
              return (
                <button
                  key={u.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled}
                  onClick={() => setUnit(active ? null : u.id)}
                  className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-[15px] transition-colors disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                    active
                      ? "border-[var(--hero)] bg-[var(--hero)] text-white"
                      : "border-grid bg-white text-ink hover:border-[var(--hero)]"
                  }`}
                >
                  <span aria-hidden>{u.emoji}</span>
                  {u.label}
                </button>
              );
            })}
          </div>

          {unitInfo ? (
            <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span id="difficulty-label" className="shrink-0 font-display text-base text-ink">
                난이도
              </span>
              <div
                role="radiogroup"
                aria-labelledby="difficulty-label"
                className="grid flex-1 grid-cols-2 rounded-full bg-paper p-1"
              >
                {DIFFICULTIES.map(({ id, label }) => {
                  const active = difficulty === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => onDifficultyChange(id)}
                      className={`min-h-9 rounded-full px-3 font-display text-base transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                        active ? "bg-[var(--hero)] text-white" : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onPickUnit(unitInfo.id);
                  // 고른 뒤엔 접어서 대화 볼 자리를 넓힌다
                  setUnit(null);
                }}
                className="btn-press flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 bg-white px-2 font-display text-base text-ink disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
                style={{ borderColor: "var(--hero)" }}
              >
                <PencilLine className="h-5 w-5 shrink-0" aria-hidden />
                문제 받기
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  onPickQuiz(unitInfo.id);
                  setUnit(null);
                }}
                className="btn-press flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 px-2 font-display text-base text-ink disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
                style={{ backgroundColor: "var(--marker)", borderColor: "color-mix(in srgb, var(--marker) 60%, black)" }}
              >
                <Lightbulb className="h-5 w-5 shrink-0" aria-hidden />
                개념 퀴즈
              </button>
            </div>
            </div>
          ) : (
            <p className="px-1 text-[15px] text-ink-soft">단원을 고르면 문제나 개념 퀴즈를 받을 수 있어.</p>
          )}
        </>
      )}
    </div>
  );
}
