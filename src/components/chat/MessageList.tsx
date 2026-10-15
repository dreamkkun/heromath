"use client";

import { useEffect, useRef } from "react";
import type { CharacterId, ChatMessage } from "@/types/chat";
import { MessageBubble, TypingBubble } from "./MessageBubble";
import { QuickActions } from "./QuickActions";

interface MessageListProps {
  messages: ChatMessage[];
  isThinking: boolean;
  thinkingCharacterId: CharacterId;
  onQuickAction: (label: string) => void;
}

export function MessageList({ messages, isThinking, thinkingCharacterId, onQuickAction }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const visible = messages.filter((m) => !m.hidden);
  const last = visible.at(-1);
  // 답변이 스트리밍되기 시작하면 '생각 중' 표시는 숨긴다
  const showTyping = isThinking && messages.at(-1)?.role === "student";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visible.length, last?.content.length, showTyping]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6" aria-live="polite">
      {visible.map((m) => (
        <MessageBubble key={m.id} message={m}>
          {m.showWordProblemSteps && m.id === last?.id && !isThinking && (
            <QuickActions onPick={onQuickAction} disabled={isThinking} />
          )}
        </MessageBubble>
      ))}
      {showTyping && <TypingBubble characterId={thinkingCharacterId} />}
      <div ref={endRef} />
    </div>
  );
}
