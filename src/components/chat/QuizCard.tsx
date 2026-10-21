"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import type { Quiz } from "@/types/chat";
import { MathText } from "./MathText";

interface QuizCardProps {
  quiz: Quiz;
  /** 다 맞히면 배지를 준다. 같은 퀴즈로는 한 번만 */
  rewarded: boolean;
  onPerfect: () => void;
}

/**
 * 개념 퀴즈 카드. 한 번에 한 문제씩: '알아두기'로 개념을 먼저 읽고, 보기를 고르면
 * 바로 맞았는지와 이유를 보여 준다. 마지막에 점수를 알려 주고 다시 풀 수 있다.
 */
export function QuizCard({ quiz, rewarded, onPerfect }: QuizCardProps) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const total = quiz.questions.length;
  const finished = index >= total;
  const q = quiz.questions[index];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answerIndex) setScore((s) => s + 1);
  };

  const next = () => {
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setPicked(null);
    if (nextIndex >= total && score === total && !rewarded) onPerfect();
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setRound((r) => r + 1);
  };

  return (
    <div className="space-y-3 whitespace-normal">
      <div>
        <p className="font-display text-lg text-ink">{quiz.title}</p>
        {index === 0 && picked === null && round === 1 && (
          <p className="text-[15px] text-ink-soft">
            <MathText text={quiz.intro} />
          </p>
        )}
      </div>

      {/* 실제로 순서가 있는 문제들이라 진행 막대로 위치를 보여 준다 */}
      <div className="flex gap-1.5" aria-label={`${total}문제 중 ${Math.min(index + 1, total)}번째`}>
        {quiz.questions.map((_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: i < index || finished ? "var(--hero)" : i === index ? "color-mix(in srgb, var(--hero) 45%, white)" : "var(--grid)" }}
          />
        ))}
      </div>

      {!finished ? (
        <div className="space-y-3" key={`${round}-${index}`}>
          <div className="rounded-xl bg-marker-soft px-3 py-2.5">
            <p className="font-display text-sm text-ink">알아두기</p>
            <p className="text-[16px] leading-relaxed text-ink">
              <MathText text={q.lesson} />
            </p>
          </div>

          <p className="text-[17px] leading-relaxed text-ink">
            <span className="font-display">Q{index + 1}. </span>
            <MathText text={q.question} />
          </p>

          <div role="group" aria-label="보기" className="grid gap-2">
            {q.choices.map((choice, i) => {
              const isAnswer = i === q.answerIndex;
              const isPicked = i === picked;
              const revealed = picked !== null;
              const tone = !revealed
                ? "border-grid bg-white hover:border-[var(--hero)]"
                : isAnswer
                  ? "border-green-600 bg-green-50"
                  : isPicked
                    ? "border-red-500 bg-red-50"
                    : "border-grid bg-white opacity-60";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={revealed}
                  aria-pressed={isPicked}
                  className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-3 py-2 text-left text-[16px] text-ink transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${tone}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper font-display text-sm text-ink-soft">
                    {revealed && isAnswer ? (
                      <Check className="h-4 w-4 text-green-700" aria-label="정답" />
                    ) : revealed && isPicked ? (
                      <X className="h-4 w-4 text-red-600" aria-label="내가 고른 오답" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="min-w-0">
                    <MathText text={choice} />
                  </span>
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className="space-y-3" aria-live="polite">
              <p className="text-[16px] leading-relaxed text-ink">
                <span className={`font-display ${picked === q.answerIndex ? "text-green-700" : "text-red-600"}`}>
                  {picked === q.answerIndex ? "맞았어! " : "아깝다! "}
                </span>
                <MathText text={q.explanation} />
              </p>
              <button
                type="button"
                onClick={next}
                className="btn-press w-full rounded-xl border-2 bg-white py-2.5 font-display text-base text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
                style={{ borderColor: "var(--hero)" }}
              >
                {index + 1 < total ? "다음 문제" : "결과 보기"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3" aria-live="polite">
          <p className="text-center">
            <span className="font-display text-4xl text-ink tabular-nums">
              {score} / {total}
            </span>
          </p>
          <p className="text-center text-[16px] text-ink">
            {score === total
              ? round === 1
                ? "모두 맞혔어! 개념 마스터 히어로야."
                : "이번엔 다 맞혔어! 실력이 쑥 늘었네."
              : score >= total / 2
                ? "거의 다 왔어! 틀린 문제의 알아두기를 다시 읽어 보자."
                : "괜찮아, 처음엔 다 어려워. 한 번 더 도전해 볼까?"}
          </p>
          <button
            type="button"
            onClick={restart}
            className="btn-press w-full rounded-xl border-2 bg-white py-2.5 font-display text-base text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
            style={{ borderColor: "var(--hero)" }}
          >
            다시 풀어 보기
          </button>
        </div>
      )}
    </div>
  );
}
