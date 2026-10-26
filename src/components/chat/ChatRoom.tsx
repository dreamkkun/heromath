"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHARACTERS, unitById } from "@/data/characters";
import { fireConfetti, playFanfare } from "@/lib/celebrate";
import { fetchQuiz, fetchSolution, quizToText, solutionToText, streamChat } from "@/lib/chatClient";
import { cleanStreamText } from "@/lib/correctMarker";
import { addRecent, getRecent } from "@/lib/recentProblems";
import { isStepChip, looksLikeWordProblem, missionRequest } from "@/lib/wordProblem";
import { useActiveCharacter, useHeroStore } from "@/store/heroStore";
import type { ChatMessage, UnitId } from "@/types/chat";
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
  /** 풀이·퀴즈처럼 한 번에 오는 카드를 기다리는 동안 보여줄 문구 */
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
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
  const ask = async (
    text: string,
    {
      hidden = false,
      wordProblem = false,
      image,
      missionUnit,
    }: { hidden?: boolean; wordProblem?: boolean; image?: string; missionUnit?: UnitId } = {},
  ) => {
    addMessage({ role: "student", content: text, hidden, image });
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
      // 미션으로 낸 문제는 기억해 두었다가 다음 출제 때 겹치지 않게 한다
      if (missionUnit && heroId && finalText && !controller.signal.aborted) addRecent("mission", missionUnit, [finalText]);
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

  const sendStudentMessage = (text: string, image?: string) => {
    // 사진으로 올린 문제는 대부분 문장제라서 힌트 단계를 바로 보여 준다
    void ask(text, { image, wordProblem: Boolean(image) || looksLikeWordProblem(text) || isStepChip(text) });
  };

  /**
   * 한 번에 오는 카드(풀이·퀴즈)를 받아 대화에 붙인다. 받는 동안 '생각 중' 말풍선에 label을 보여 준다.
   * load는 성공하면 히어로 메시지로 붙일 내용을, 실패하면 아이에게 보여줄 error 문장을 돌려준다.
   */
  const fetchCard = async (
    label: string,
    load: (signal: AbortSignal) => Promise<Partial<ChatMessage> & { content: string }>,
  ) => {
    const { characterId, isThinking: busy } = useHeroStore.getState();
    if (busy) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setThinking(true);
    setPendingLabel(label);
    try {
      const message = await load(controller.signal);
      addMessage({ role: "hero", characterId, ...message });
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error(error);
        addMessage({ role: "hero", characterId, content: "⚠️ 히어로 통신이 끊겼어요. 다시 눌러 줄래?" });
      }
    } finally {
      if (abortRef.current === controller) {
        setThinking(false);
        setPendingLabel(null);
      }
    }
  };

  /** 지금 문제의 단계별 풀이 카드 */
  const showSolution = () =>
    fetchCard("풀이를 정리하고 있어", async (signal) => {
      const { characterId, messages: history } = useHeroStore.getState();
      const result = await fetchSolution(characterId, history, signal);
      return "solution" in result
        ? { content: solutionToText(result.solution), solution: result.solution }
        : { content: result.error };
    });

  /** 단원 개념 퀴즈 카드. 아이가 무엇을 골랐는지 메모지로 먼저 남긴다. */
  const startQuiz = (unit: UnitId) => {
    if (useHeroStore.getState().isThinking) return;
    addMessage({ role: "student", content: `💡 ${unitById(unit)?.label ?? ""} 개념 퀴즈 풀래!` });
    void fetchCard("퀴즈를 만들고 있어", async (signal) => {
      const result = await fetchQuiz(useHeroStore.getState().characterId, unit, getRecent("quiz", unit), signal);
      if (!("quiz" in result)) return { content: result.error };
      addRecent("quiz", unit, result.quiz.questions.map((q) => q.question));
      return { content: quizToText(result.quiz), quiz: result.quiz };
    });
  };

  /** 퀴즈를 처음 도전에서 다 맞히면 배지 (같은 퀴즈로는 한 번만) */
  const rewardQuiz = (messageId: string) => {
    const message = useHeroStore.getState().messages.find((m) => m.id === messageId);
    if (!message || message.solved) return;
    updateMessage(messageId, { solved: true });
    celebrate();
  };

  const pickUnit = (unit: UnitId) => {
    void ask(missionRequest(unit, getRecent("mission", unit)), { hidden: true, wordProblem: true, missionUnit: unit });
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
          onShowSolution={() => void showSolution()}
          onQuizPerfect={rewardQuiz}
          pendingLabel={pendingLabel}
        />
      </main>

      <footer className="border-t-2 border-grid bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-3">
          <ModeSelector
            mode={mode}
            onModeChange={setMode}
            onPickUnit={pickUnit}
            onPickQuiz={startQuiz}
            disabled={isThinking}
          />
          <ChatInput onSend={sendStudentMessage} allowImage={mode === "own_problem"} disabled={isThinking} />
        </div>
      </footer>

      {toastKey !== null && <BadgeToast key={toastKey} character={character} badges={badges} onDone={hideToast} />}
    </div>
  );
}
