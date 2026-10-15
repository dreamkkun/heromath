import { CHARACTERS } from "@/data/characters";
import type { ChatMessage } from "@/types/chat";
import { HeroAvatar } from "./HeroAvatar";
import { MathText } from "./MathText";

export function MessageBubble({ message, children }: { message: ChatMessage; children?: React.ReactNode }) {
  if (message.role === "student") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm border-2 border-ink bg-ink px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap text-white">
          <MathText text={message.content} />
        </div>
      </div>
    );
  }

  const hero = CHARACTERS[message.characterId ?? "web_hero"];
  return (
    <div className="flex items-start gap-2">
      <HeroAvatar character={hero} />
      <div className="max-w-[85%] min-w-0">
        <p className="mb-1 font-display text-sm" style={{ color: hero.themeColor }}>
          {hero.name}
        </p>
        <div className="relative rounded-2xl rounded-tl-sm border-2 border-ink bg-white px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap text-ink shadow-[3px_3px_0_var(--ink)]">
          <MathText text={message.content} />
          {message.solved && (
            <span
              className="animate-stamp absolute -top-3 -right-3 rotate-12 rounded-lg border-2 border-ink bg-amber-300 px-2 py-0.5 font-display text-sm text-ink shadow-[2px_2px_0_var(--ink)] motion-reduce:animate-none"
              aria-label="정답 미션 성공"
            >
              🏅 미션 성공!
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
    <div className="flex items-start gap-2" role="status" aria-label={`${hero.name} 생각하는 중`}>
      <HeroAvatar character={hero} />
      <div className="mt-6 flex gap-1 rounded-2xl rounded-tl-sm border-2 border-ink bg-white px-4 py-4">
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
