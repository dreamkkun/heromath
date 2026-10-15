import type { Character } from "@/types/chat";

const SIZES = {
  sm: "h-9 w-9 text-lg",
  md: "h-11 w-11 text-xl",
  lg: "h-14 w-14 text-3xl",
} as const;

export function HeroAvatar({ character, size = "md" }: { character: Character; size?: keyof typeof SIZES }) {
  return (
    <div
      className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full border-[3px] border-ink shadow-[2px_2px_0_var(--ink)]`}
      style={{ backgroundColor: `color-mix(in srgb, ${character.themeColor} 18%, white)` }}
      aria-hidden
    >
      {character.emblem}
    </div>
  );
}
