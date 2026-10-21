"use client";

import { CHARACTER_LIST } from "@/data/characters";
import type { Character, CharacterId } from "@/types/chat";

interface HeroPlateProps {
  character: Character;
  onSelect: (id: CharacterId) => void;
}

/**
 * 오늘의 튜터 히어로 명판. 화면에서 가장 과감한 요소는 이것 하나다.
 * 히어로 색 집중선 띠 위에 큰 엠블럼과 이름, 오른쪽에 히어로를 바꾸는 동그란 버튼들.
 */
export function HeroPlate({ character, onSelect }: HeroPlateProps) {
  return (
    <section
      aria-label="오늘의 튜터 히어로"
      className="speed-lines border-b-[3px] text-white transition-[background-color] duration-300"
      style={{ borderColor: `color-mix(in srgb, ${character.themeColor} 70%, black)` }}
    >
      {/* 좁은 화면: 이름 줄 아래에 바꾸기 버튼 줄 / 넓은 화면: 한 줄 */}
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:py-4">
        <div className="flex min-w-0 items-center gap-3 break-keep sm:flex-1">
          <span
            key={character.id}
            className="animate-hero-in flex h-14 w-14 shrink-0 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white text-4xl shadow-[0_3px_0_rgb(0_0_0/0.25)] motion-reduce:animate-none"
            aria-hidden
          >
            {character.emblem}
          </span>
          <div className="min-w-0">
            <p className="font-display text-2xl leading-tight sm:text-[28px] [text-shadow:0_2px_0_rgb(0_0_0/0.25)]">
              {character.name}
            </p>
            <p className="mt-1 inline-block rounded-md bg-white/95 px-2 py-0.5 text-sm text-ink">
              {character.title}
            </p>
          </div>
        </div>

        <div role="radiogroup" aria-label="튜터 히어로 바꾸기" className="flex gap-2">
          {CHARACTER_LIST.map((c) => {
            const active = c.id === character.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${c.name} — ${c.title}`}
                title={c.name}
                onClick={() => onSelect(c.id)}
                className={`flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl transition-[box-shadow,opacity] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  active ? "shadow-[0_0_0_4px_var(--marker)]" : "opacity-75 hover:opacity-100"
                }`}
              >
                <span aria-hidden>{c.emblem}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
