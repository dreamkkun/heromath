"use client";

import { WORD_PROBLEM_STEPS } from "@/data/characters";

interface QuickActionsProps {
  onPick: (label: string) => void;
  disabled?: boolean;
}

/** 문장제 3단계 힌트. 실제 순서가 있는 단계라 번호를 붙인다. */
export function QuickActions({ onPick, disabled }: QuickActionsProps) {
  return (
    <div className="mt-3 flex flex-col items-start gap-2" aria-label="문장제 힌트 단계">
      {WORD_PROBLEM_STEPS.map(({ step, label }) => (
        <button
          key={step}
          type="button"
          disabled={disabled}
          onClick={() => onPick(label)}
          className="group flex min-h-11 items-center gap-2 rounded-full border-2 border-dashed border-ink-soft/60 bg-white py-1.5 pr-4 pl-1.5 text-left text-[15px] text-ink transition-colors hover:border-solid hover:border-[var(--hero)] disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-base text-white"
            style={{ backgroundColor: "var(--hero)" }}
            aria-hidden
          >
            {step}
          </span>
          {label.replace(/^\d단계:\s*/, "")}
        </button>
      ))}
    </div>
  );
}
