"use client";

import { useState } from "react";
import type { Solution } from "@/types/chat";
import { MathText } from "./MathText";

/**
 * 단계별 풀이 카드. 처음엔 단계 제목만 보이고, 버튼을 누를 때마다 한 단계씩 설명이 열린다.
 * 정답은 모든 단계를 연 뒤에 따로 확인한다. 아이가 스스로 먼저 생각해 볼 틈을 남기기 위해서다.
 */
export function SolutionCard({ solution }: { solution: Solution }) {
  const [opened, setOpened] = useState(0);
  const [answerShown, setAnswerShown] = useState(false);
  const allOpened = opened >= solution.steps.length;

  return (
    <div className="space-y-3">
      <div>
        <p className="font-display text-lg text-ink">단계별 풀이</p>
        <p className="text-[15px] text-ink-soft">
          <MathText text={solution.problem} />
        </p>
      </div>

      <ol className="space-y-2" aria-live="polite">
        {solution.steps.map((step, i) => {
          const isOpen = i < opened;
          return (
            <li key={i} className={`flex gap-3 rounded-xl p-2 ${isOpen ? "bg-paper" : ""}`}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-base ${
                  isOpen ? "text-white" : "border-2 border-dashed border-ink-soft/60 text-ink-soft"
                }`}
                style={isOpen ? { backgroundColor: "var(--hero)" } : undefined}
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="min-w-0 pt-1">
                <p className={`font-display text-base ${isOpen ? "text-ink" : "text-ink-soft"}`}>{step.title}</p>
                {isOpen && (
                  <p className="mt-1 text-[16px] leading-relaxed text-ink">
                    <MathText text={step.explanation} />
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {!allOpened ? (
        <button
          type="button"
          onClick={() => setOpened((n) => n + 1)}
          className="btn-press w-full rounded-xl border-2 bg-white py-2.5 font-display text-base text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
          style={{ borderColor: "var(--hero)" }}
        >
          {opened === 0 ? "1단계 보기" : `${opened + 1}단계 보기`}
        </button>
      ) : answerShown ? (
        <p className="rounded-xl bg-marker-soft px-3 py-2.5 text-[17px] text-ink">
          <span className="font-display">정답 </span>
          <MathText text={solution.answer} />
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-[15px] text-ink-soft">답을 먼저 생각해 보고 눌러 봐!</p>
          <button
            type="button"
            onClick={() => setAnswerShown(true)}
            className="btn-press w-full rounded-xl border-2 py-2.5 font-display text-base text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
            style={{ backgroundColor: "var(--marker)", borderColor: "color-mix(in srgb, var(--marker) 60%, black)" }}
          >
            정답 확인하기
          </button>
        </div>
      )}
    </div>
  );
}
