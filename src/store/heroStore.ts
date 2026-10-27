import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CHARACTERS, DEFAULT_CHARACTER_ID } from "@/data/characters";
import type { CharacterId, ChatMessage, LearningMode } from "@/types/chat";

let idSeq = 0;
export const newMessageId = () => `m${idSeq++}`;

function greetingMessage(characterId: CharacterId, id = newMessageId()): ChatMessage {
  return { id, role: "hero", characterId, content: CHARACTERS[characterId].greeting };
}

interface HeroState {
  characterId: CharacterId;
  mode: LearningMode;
  messages: ChatMessage[];
  isThinking: boolean;
  badges: number;
  soundOn: boolean;

  selectCharacter: (id: CharacterId) => void;
  setMode: (mode: LearningMode) => void;
  /** 추가한 메시지의 id를 돌려준다 */
  addMessage: (message: Omit<ChatMessage, "id">) => string;
  updateMessage: (id: string, patch: Partial<Omit<ChatMessage, "id">>) => void;
  setThinking: (thinking: boolean) => void;
  earnBadge: () => void;
  toggleSound: () => void;
  resetChat: () => void;
}

export const useHeroStore = create<HeroState>()(
  persist(
    (set, get) => ({
      characterId: DEFAULT_CHARACTER_ID,
      mode: "own_problem",
      // 서버/클라이언트 첫 렌더가 같도록 고정 id 사용
      messages: [greetingMessage(DEFAULT_CHARACTER_ID, "greeting")],
      isThinking: false,
      badges: 0,
      soundOn: true,

      selectCharacter: (id) => {
        if (id === get().characterId) return;
        set((s) => ({
          characterId: id,
          // 아직 대화를 시작하기 전(첫 인사만 있음)이면 인사말을 바꾸고, 대화 중이면 새 히어로 인사를 이어 붙인다
          messages:
            s.messages.length === 1 && s.messages[0].role === "hero"
              ? [greetingMessage(id, "greeting")]
              : [...s.messages, greetingMessage(id)],
        }));
      },
      setMode: (mode) => set({ mode }),
      addMessage: (message) => {
        const id = newMessageId();
        set((s) => ({ messages: [...s.messages, { ...message, id }] }));
        return id;
      },
      updateMessage: (id, patch) =>
        set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      setThinking: (isThinking) => set({ isThinking }),
      earnBadge: () => set((s) => ({ badges: s.badges + 1 })),
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
      resetChat: () => set((s) => ({ messages: [greetingMessage(s.characterId)], isThinking: false })),
    }),
    {
      name: "hero-math",
      storage: createJSONStorage(() => localStorage),
      // 대화 내용은 저장하지 않고, 고른 히어로·배지·소리 설정만 기억한다
      partialize: (s) => ({ characterId: s.characterId, badges: s.badges, soundOn: s.soundOn }),
      // SSR 하이드레이션 불일치를 피하려고 마운트 후 수동으로 rehydrate
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        // 저장된 히어로가 기본값과 다르면 첫 인사말도 그 히어로로 바꾼다
        if (state && state.messages.length === 1 && state.messages[0].characterId !== state.characterId) {
          useHeroStore.setState({ messages: [greetingMessage(state.characterId, "greeting")] });
        }
      },
    },
  ),
);

export const useActiveCharacter = () => CHARACTERS[useHeroStore((s) => s.characterId)];
