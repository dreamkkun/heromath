"use client";

import { ChevronDown, Medal, Volume2, VolumeX } from "lucide-react";
import { CHARACTER_LIST } from "@/data/characters";
import type { Character, CharacterId } from "@/types/chat";

interface HeaderProps {
  character: Character;
  badges: number;
  soundOn: boolean;
  onToggleSound: () => void;
  onChangeCharacter: (id: CharacterId) => void;
}

export function Header({ character, badges, soundOn, onToggleSound, onChangeCharacter }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b-[3px] border-ink bg-[var(--hero)] text-white transition-colors duration-300">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:gap-3">
        <h1 className="flex min-w-0 flex-1 items-center gap-2 font-display text-xl leading-none [text-shadow:2px_2px_0_var(--ink)] sm:text-2xl">
          <span aria-hidden>⭐</span>
          <span className="truncate">
            HERO MATH<span className="max-sm:hidden"> ACADEMY</span>
          </span>
        </h1>

        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "효과음 끄기" : "효과음 켜기"}
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-white text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {soundOn ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
        </button>

        <div
          className="flex h-9 items-center gap-1 rounded-full border-2 border-ink bg-white px-3 text-sm font-bold text-ink"
          title="모은 히어로 배지"
        >
          <Medal className="h-4 w-4 text-amber-500" aria-hidden />
          {/* key가 바뀌면 숫자가 통통 튀는 애니메이션이 다시 재생된다 */}
          <span key={badges} className="animate-bump tabular-nums motion-reduce:animate-none">
            {badges}
          </span>
          <span className="sr-only">개의 히어로 배지</span>
        </div>

        {/* 모바일에서는 바로 아래 캐릭터 카드 바로 변경하므로 드롭다운을 숨긴다 */}
        <label className="relative flex items-center max-sm:hidden">
          <span className="sr-only">튜터 히어로 바꾸기</span>
          <select
            value={character.id}
            onChange={(e) => onChangeCharacter(e.target.value as CharacterId)}
            className="h-9 cursor-pointer appearance-none rounded-full border-2 border-ink bg-white pr-8 pl-3 text-sm font-bold text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {CHARACTER_LIST.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emblem} {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-ink" aria-hidden />
        </label>
      </div>
    </header>
  );
}
