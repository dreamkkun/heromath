"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHARACTERS } from "@/data/characters";
import { fireConfetti, playFanfare } from "@/lib/celebrate";
import { streamChat } from "@/lib/chatClient";
import { cleanStreamText } from "@/lib/correctMarker";
import { isStepChip, looksLikeWordProblem, missionRequest } from "@/lib/wordProblem";
import { useActiveCharacter, useHeroStore } from "@/store/heroStore";
import type { UnitId } from "@/types/chat";
import { BadgeToast } from "./BadgeToast";
import { ChatInput } from "./ChatInput";
import { Header } from "./Header";
import { HeroPlate } from "./HeroPlate";
import { MessageList } from "./MessageList";
import { ModeSelector } from "./ModeSelector";

export function ChatRoom() {
  const character = useActiveCharacter();
  const messages = useHeroStore((s) => s.messages);
  const mode = useHeroStore((s) => s.mode);
  const isThinking = useHeroStore((s) => s.isThinking);
  const badges = useHeroStore((s) => s.badges);
  const soundOn = useHeroStore((s) => s.soundOn);
  const { selectCharacter, setMode, addMessage, updateMessage, setThinking, earnBadge, toggleSound } =
    useHeroStore.getState();
  const abortRef = useRef<AbortController>(null);
  const [toastKey, setToastKey] = useState<number | null>(null);
  const hideToast = useCallback(() => setToastKey(null), []);

  useEffect(() => {
    void useHeroStore.persist.rehydrate();
    return () => abortRef.current?.abort();
  }, []);

  const celebrate = () => {
    const { characterId, soundOn } = useHeroStore.getState();
    earnBadge();
    void fireConfetti(CHARACTERS[characterId].themeColor);
    if (soundOn) playFanfare();
    setToastKey(Date.now());
  };

  /** 학생(또는 숨김) 메시지를 추가하고 히어로 답변을 스트리밍으로 받는다 */
  const ask = async (text: string, { hidden = false, wordProblem = false } = {}) => {
    addMessage({ role: "student", content: text, hidden });
    const { characterId, messages: history } = useHeroStore.getState();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setThinking(true);

    let heroId: string | null = null;
    let raw = "";
    try {
      await streamChat(
        characterId,
        history,
        (chunk) => {
          raw += chunk;
          const { text: shown } = cleanStreamText(raw);
          // 첫 글자가 보일 때 말풍선을 만든다 (그 전까지는 '생각 중' 표시)
          if (!heroId) {
            if (!shown) return;
            heroId = addMessage({ role: "hero", characterId, content: "", showWordProblemSteps: wordProblem });
          }
          updateMessage(heroId, { content: shown });
        },
        controller.signal,
      );

      const { text: finalText, solved } = cleanStreamText(raw);
      if (heroId) updateMessage(heroId, { content: finalText });
      if (solved && heroId && !controller.signal.aborted) {
        // 문제를 풀었으니 단계 힌트 칩은 숨긴다
        updateMessage(heroId, { solved: true, showWordProblemSteps: false });
        celebrate();
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error(error);
        addMessage({ role: "hero", characterId, content: "⚠️ 히어로 통신이 끊겼어요. 다시 시도해 줄래?" });
      }
    } finally {
      if (abortRef.current === controller) setThinking(false);
    }
  };

  const sendStudentMessage = (text: string) => {
    void ask(text, { wordProblem: looksLikeWordProblem(text) || isStepChip(text) });
  };

  const pickUnit = (unit: UnitId) => {
    void ask(missionRequest(unit), { hidden: true, wordProblem: true });
  };

  return (
    <div
      className="flex h-dvh flex-col bg-paper"
      style={{ "--hero": character.themeColor } as React.CSSProperties}
    >
      <Header badges={badges} soundOn={soundOn} onToggleSound={toggleSound} />
      <HeroPlate character={character} onSelect={selectCharacter} />

      <main className="graph-paper flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          isThinking={isThinking}
          thinkingCharacterId={character.id}
          onQuickAction={sendStudentMessage}
        />
      </main>

      <footer className="border-t-2 border-grid bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-3">
          <ModeSelector mode={mode} onModeChange={setMode} onPickUnit={pickUnit} disabled={isThinking} />
          <ChatInput onSend={sendStudentMessage} disabled={isThinking} />
        </div>
      </footer>

      {toastKey !== null && <BadgeToast key={toastKey} character={character} badges={badges} onDone={hideToast} />}
    </div>
  );
}
