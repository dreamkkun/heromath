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
  onShowSolution: () => void;
  onQuizPerfect: (messageId: string) => void;
  /** 풀이·퀴즈를 기다리는 중이면 그 문구 */
  pendingLabel: string | null;
}

export function MessageList({
  messages,
  isThinking,
  thinkingCharacterId,
  onQuickAction,
  onShowSolution,
  onQuizPerfect,
  pendingLabel,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const visible = messages.filter((m) => !m.hidden);
  const last = visible.at(-1);
  // 답변이 스트리밍되기 시작하면 '생각 중' 표시는 숨긴다. 풀이·퀴즈는 한 번에 오니 끝날 때까지 보인다.
  const showTyping = isThinking && (pendingLabel !== null || messages.at(-1)?.role === "student");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visible.length, last?.content.length, showTyping]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6" aria-live="polite">
      {visible.map((m) => (
        <MessageBubble key={m.id} message={m} onQuizPerfect={() => onQuizPerfect(m.id)}>
          {m.showWordProblemSteps && m.id === last?.id && !isThinking && (
            <QuickActions onPick={onQuickAction} onShowSolution={onShowSolution} disabled={isThinking} />
          )}
        </MessageBubble>
      ))}
      {showTyping && (
        <TypingBubble characterId={thinkingCharacterId} label={pendingLabel ?? undefined} />
      )}
      <div ref={endRef} />
    </div>
  );
}
