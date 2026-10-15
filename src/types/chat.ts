export type CharacterId = "web_hero" | "iron_brain" | "thunder_hammer" | "captain_shield";

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
}

export type LearningMode = "own_problem" | "hero_mission";

export type UnitId = "big_numbers" | "angles" | "fractions" | "decimals" | "patterns";
