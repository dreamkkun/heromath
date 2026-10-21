"use client";

import { Gamepad2, Medal, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  badges: number;
  soundOn: boolean;
  onToggleSound: () => void;
}

/** 공책 맨 위 여백 같은 얇은 상단 줄. 히어로 정보는 아래 HeroPlate가 맡는다. */
export function Header({ badges, soundOn, onToggleSound }: HeaderProps) {
  return (
    <header className="border-b-2 border-grid bg-white">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
        <h1 className="flex flex-1 items-center gap-1.5 font-display text-xl leading-none text-ink">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-marker text-base"
            aria-hidden
          >
            ⭐
          </span>
          히어로 매스
        </h1>

        <Link
          href="/game"
          aria-label="쉬는 시간 게임"
          className="flex h-11 items-center gap-1.5 rounded-full px-3 text-[15px] text-ink-soft hover:bg-paper hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Gamepad2 className="h-5 w-5" aria-hidden />
          <span className="max-sm:hidden">쉬는 시간</span>
        </Link>

        <button
          type="button"
          onClick={onToggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "효과음 끄기" : "효과음 켜기"}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {soundOn ? <Volume2 className="h-5 w-5" aria-hidden /> : <VolumeX className="h-5 w-5" aria-hidden />}
        </button>

        <div
          className="flex h-9 items-center gap-1.5 rounded-full bg-marker px-3 font-display text-lg text-ink"
          title="모은 히어로 배지"
        >
          <Medal className="h-4 w-4" aria-hidden />
          {/* key가 바뀌면 숫자가 통통 튀는 애니메이션이 다시 재생된다 */}
          <span key={badges} className="animate-bump tabular-nums motion-reduce:animate-none">
            {badges}
          </span>
          <span className="sr-only">개의 히어로 배지</span>
        </div>
      </div>
    </header>
  );
}
