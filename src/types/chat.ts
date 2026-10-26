export type CharacterId = "web_hero" | "iron_brain" | "thunder_hammer" | "captain_shield" | "mystic_sorcerer";

export interface Character {
  id: CharacterId;
  name: string;
  title: string;
  themeColor: string;
  /** 아바타로 쓰는 이모지 (오리지널 페르소나 — 실제 캐릭터 이미지 미사용) */
  emblem: string;
  greeting: string;
  /** 시스템 프롬프트의 {character_persona_detail}에 들어갈 성격·비유 설명 */
  personaDetail: string;
  /** 짧은 감탄사 대사 (오프라인 목업 응답, 축하 메시지 등에 사용) */
  sampleLines: string[];
  /** personaDetail로 만든 최종 시스템 프롬프트 */
  systemPrompt: string;
}

export type Role = "hero" | "student";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** 히어로 메시지일 때 어떤 히어로가 말했는지 (대화 중 히어로 변경 대비) */
  characterId?: CharacterId;
  /** 문장제로 감지되면 3단계 퀵 액션 칩을 노출 */
  showWordProblemSteps?: boolean;
  /** 화면에는 안 보이고 API 대화 기록에만 들어가는 메시지 (예: 미션 출제 요청) */
  hidden?: boolean;
  /** 이 답변에서 학생이 정답을 맞혀 배지를 받았는지 */
  solved?: boolean;
  /** 학생이 올린 문제 사진 (줄인 JPEG data URL) */
  image?: string;
  /** 히어로가 보여주는 단계별 풀이 카드 */
  solution?: Solution;
  /** 히어로가 내는 개념 퀴즈 카드 */
  quiz?: Quiz;
}

/** 개념 퀴즈. 문제마다 짧은 '알아두기' 설명을 먼저 보여주고 객관식으로 확인한다. */
export interface Quiz {
  title: string;
  intro: string;
  questions: {
    lesson: string;
    question: string;
    choices: string[];
    answerIndex: number;
    explanation: string;
  }[];
}

/** 단계별 풀이. 단계는 하나씩 펼쳐 보고, 정답은 마지막에 확인한다. */
export interface Solution {
  /** 히어로가 이해한 문제 (사진 문제를 제대로 읽었는지 확인용) */
  problem: string;
  steps: { title: string; explanation: string }[];
  answer: string;
}

/** API로 보내는 메시지 형태 (화면 전용 필드는 뺀다) */
export interface ApiChatMessage {
  role: Role;
  content: string;
  image?: string;
}

export type LearningMode = "own_problem" | "hero_mission";

export type UnitId = "big_numbers" | "angles" | "fractions" | "decimals" | "patterns";
