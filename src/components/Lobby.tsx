"use client";

import { ChevronRight, Medal } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { HeroPlate } from "@/components/chat/HeroPlate";
import { useActiveCharacter, useHeroStore } from "@/store/heroStore";
import type { LearningMode } from "@/types/chat";

interface MenuItem {
  href: string;
  emoji: string;
  title: string;
  description: string;
  /** 공부 화면으로 갈 때 어떤 모드로 열지 */
  mode?: LearningMode;
}

const MENU: MenuItem[] = [
  {
    href: "/study",
    emoji: "📷",
    title: "내 문제 풀기",
    description: "숙제 문제를 쓰거나 사진으로 찍어 올리면 히어로가 같이 풀어 줘.",
    mode: "own_problem",
  },
  {
    href: "/study",
    emoji: "🦸",
    title: "히어로 미션",
    description: "단원을 골라 문제를 받거나, 개념 퀴즈로 이론을 익혀.",
    mode: "hero_mission",
  },
  {
    href: "/game",
    emoji: "🎮",
    title: "쉬는 시간",
    description: "5분 동안 우주 방어전! 수학 관문을 넘어야 다음 단계야.",
  },
];

/** 첫 화면. 오늘의 히어로를 고르고, 무엇을 할지 메뉴에서 고른다. */
export function Lobby() {
  const character = useActiveCharacter();
  const badges = useHeroStore((s) => s.badges);
  const { selectCharacter, setMode } = useHeroStore.getState();

  useEffect(() => {
    void useHeroStore.persist.rehydrate();
  }, []);

  return (
    <div
      className="flex min-h-dvh flex-col bg-paper"
      style={{ "--hero": character.themeColor } as React.CSSProperties}
    >
      <header className="border-b-2 border-grid bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <h1 className="flex flex-1 items-center gap-1.5 font-display text-xl leading-none text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-marker text-base" aria-hidden>
              ⭐
            </span>
            히어로 매스
          </h1>
          <div
            className="flex h-9 items-center gap-1.5 rounded-full bg-marker px-3 font-display text-lg text-ink"
            title="모은 히어로 배지"
          >
            <Medal className="h-4 w-4" aria-hidden />
            <span className="tabular-nums">{badges}</span>
            <span className="sr-only">개의 히어로 배지</span>
          </div>
        </div>
      </header>

      <HeroPlate character={character} onSelect={selectCharacter} />

      <main className="graph-paper flex-1">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          <p className="font-display text-2xl text-ink">오늘은 뭘 해 볼까?</p>
          <nav aria-label="메뉴">
            <ul className="grid gap-3">
              {MENU.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    onClick={() => item.mode && setMode(item.mode)}
                    className="group flex items-center gap-4 rounded-2xl border-2 border-grid bg-white p-4 transition-colors hover:border-[var(--hero)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-paper text-3xl"
                      aria-hidden
                    >
                      {item.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-xl text-ink">{item.title}</span>
                      <span className="block text-[15px] leading-snug text-ink-soft">{item.description}</span>
                    </span>
                    <ChevronRight
                      className="h-6 w-6 shrink-0 text-ink-soft transition-colors group-hover:text-[var(--hero)]"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
    </div>
  );
}
