import { CHARACTERS } from "@/data/characters";
import type { ChatMessage } from "@/types/chat";
import { HeroAvatar } from "./HeroAvatar";
import { MathText } from "./MathText";

export function MessageBubble({ message, children }: { message: ChatMessage; children?: React.ReactNode }) {
  if (message.role === "student") {
    // 학생의 말은 공책에 붙인 노란 메모지
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-md rounded-tr-2xl bg-marker-soft px-4 py-3 text-[17px] leading-relaxed whitespace-pre-wrap text-ink shadow-[0_2px_0_color-mix(in_srgb,var(--marker)_70%,var(--ink))]">
          <MathText text={message.content} />
        </div>
      </div>
    );
  }

  const hero = CHARACTERS[message.characterId ?? "web_hero"];
  return (
    <div className="flex items-start gap-3">
      <HeroAvatar character={hero} />
      <div className="max-w-[85%] min-w-0">
        <p className="mb-1 font-display text-sm" style={{ color: `color-mix(in srgb, ${hero.themeColor} 80%, black)` }}>
          {hero.name}
        </p>
        <div
          className="balloon rounded-2xl border-[2.5px] bg-white px-4 py-3 text-[17px] leading-relaxed whitespace-pre-wrap text-ink"
          style={{ borderColor: hero.themeColor, "--balloon-border": hero.themeColor } as React.CSSProperties}
        >
          <MathText text={message.content} />
          {message.solved && (
            <span
              className="animate-stamp absolute -top-8 right-2 -rotate-8 rounded-md border-[2.5px] border-red-600 bg-white/90 px-2 py-0.5 font-display text-base text-red-600 motion-reduce:animate-none"
              aria-label="정답 미션 성공"
            >
              참 잘했어요
            </span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function TypingBubble({ characterId }: { characterId: ChatMessage["characterId"] }) {
  const hero = CHARACTERS[characterId ?? "web_hero"];
  return (
    <div className="flex items-start gap-3" role="status" aria-label={`${hero.name} 생각하는 중`}>
      <HeroAvatar character={hero} />
      <div
        className="balloon mt-6 flex gap-1.5 rounded-2xl border-[2.5px] bg-white px-4 py-4"
        style={{ borderColor: hero.themeColor, "--balloon-border": hero.themeColor } as React.CSSProperties}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full motion-reduce:animate-none"
            style={{ backgroundColor: hero.themeColor, animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
