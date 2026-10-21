import type { Character } from "@/types/chat";

const SIZES = {
  sm: "h-9 w-9 text-lg",
  md: "h-11 w-11 text-xl",
} as const;

export function HeroAvatar({ character, size = "md" }: { character: Character; size?: keyof typeof SIZES }) {
  return (
    <div
      className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full border-[2.5px] bg-white`}
      style={{ borderColor: character.themeColor }}
      aria-hidden
    >
      {character.emblem}
    </div>
  );
}
