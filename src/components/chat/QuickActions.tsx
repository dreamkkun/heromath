"use client";

import { Lightbulb } from "lucide-react";
import { WORD_PROBLEM_STEPS } from "@/data/characters";

interface QuickActionsProps {
  onPick: (label: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onPick, disabled }: QuickActionsProps) {
  return (
    <div className="mt-3 flex flex-wrap gap-2" aria-label="문장제 3단계 힌트">
      {WORD_PROBLEM_STEPS.map(({ step, label }) => (
        <button
          key={step}
          type="button"
          disabled={disabled}
          onClick={() => onPick(label)}
          className="flex min-h-11 items-center gap-1 rounded-full border-2 border-[var(--hero)] bg-white px-3 text-sm font-bold text-[var(--hero)] transition-colors hover:bg-[var(--hero)] hover:text-white disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Lightbulb className="h-4 w-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
