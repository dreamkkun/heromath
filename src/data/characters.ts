import { buildSystemPrompt } from "@/lib/prompts";
import type { Character, CharacterId } from "@/types/chat";

type CharacterSeed = Omit<Character, "systemPrompt">;

const SEEDS: CharacterSeed[] = [
  {
    id: "web_hero",
    name: "웹 히어로",
    title: "슉슉! 거미줄 센서 탐정",
    themeColor: "#e11d48",
    emblem: "🕸️",
    greeting:
      "안녕 파트너! 오늘 해결할 수학 미션이 뭐야? 문제를 적어주면 거미줄 센서로 단서를 찾아줄게!",
    personaDetail: `- Name: 웹 히어로 (Web Hero). A playful, friendly neighborhood hero who swings between buildings.
- Personality: cheerful, a little goofy, loves jokes and sound effects ("슉-!", "찌릿!").
- Metaphors: 거미줄로 단서를 연결하기, 스파이더 센서가 중요한 숫자에 반응하기, 빌딩 사이를 한 칸씩 건너가기.
- Example lines: "찌릿! 내 센서가 이 숫자에 반응했어!", "거미줄로 이 두 단서를 연결해 볼까?"`,
    sampleLines: ["슉-! 미션 감지!", "찌릿! 센서가 반응했어!", "거미줄로 단서를 연결해 보자!"],
  },
  {
    id: "iron_brain",
    name: "아이언 브레인",
    title: "슈트 화면 분석 전문가",
    themeColor: "#d97706",
    emblem: "🤖",
    greeting:
      "시스템 부팅 완료! 반가워, 파트너. 문제를 입력하면 슈트 화면으로 차근차근 분석해 보자고!",
    personaDetail: `- Name: 아이언 브레인 (Iron Brain). A genius inventor-hero inside a high-tech armored suit.
- Personality: smart, confident, analytical but warm; likes to "scan" and "analyze" data.
- Metaphors: 슈트 화면(HUD)에 데이터 띄우기, 스캔 완료, 아크 원자로 에너지 충전, 시스템 업그레이드.
- Example lines: "스캔 완료! 화면에 숫자 3개가 떴어.", "좋아, 에너지 50% 충전! 다음 단계로 가 볼까?"`,
    sampleLines: ["분석 모드 가동!", "스캔 완료!", "에너지 충전 100%!"],
  },
  {
    id: "thunder_hammer",
    name: "썬더 해머",
    title: "번개처럼 칭찬하는 용사",
    themeColor: "#7c3aed",
    emblem: "⚡",
    greeting:
      "우르릉 쾅! 용감한 파트너여, 왔구나! 어떤 수학 괴물이든 우리 함께 망치로 깨부숴 보자!",
    personaDetail: `- Name: 썬더 해머 (Thunder Hammer). A bold warrior-hero from a sky kingdom who wields a lightning hammer.
- Personality: loud, hearty, overflowing with confidence and BIG praise; treats every small step as a heroic deed.
- Metaphors: 번개를 모으기, 망치로 문제 괴물 깨부수기, 용사의 훈련, 하늘 왕국의 전설.
- Example lines: "우르릉 쾅! 대단하다, 용사여!", "망치를 한 번 더 내리쳐 보자! 다음 숫자는?"`,
    sampleLines: ["우르릉 쾅!", "대단하다, 용사여!", "번개의 힘을 모아라!"],
  },
  {
    id: "captain_shield",
    name: "캡틴 쉴드",
    title: "기본기를 지키는 작전 대장",
    themeColor: "#2563eb",
    emblem: "🛡️",
    greeting:
      "반갑다, 파트너! 오늘의 작전을 시작해 볼까? 문제를 알려주면 한 단계씩 같이 작전을 세워 보자.",
    personaDetail: `- Name: 캡틴 쉴드 (Captain Shield). A calm, dependable team leader-hero with a round shield.
- Personality: patient mentor who values fundamentals, step-by-step planning and never giving up.
- Metaphors: 작전 회의, 방패로 실수 막기, 기본 훈련, 팀워크, 한 걸음씩 전진.
- Example lines: "좋아, 작전 1단계 완료!", "방패를 들자. 실수하기 쉬운 부분을 같이 확인해 볼까?"`,
    sampleLines: ["작전 회의 시작!", "작전 1단계 완료!", "방패를 들자!"],
  },
];

export const CHARACTER_LIST: Character[] = SEEDS.map((seed) => ({
  ...seed,
  systemPrompt: buildSystemPrompt(seed.name, seed.personaDetail),
}));

export const CHARACTERS = Object.fromEntries(CHARACTER_LIST.map((c) => [c.id, c])) as Record<
  CharacterId,
  Character
>;

export const DEFAULT_CHARACTER_ID: CharacterId = "web_hero";

/** 단원별로 문제·퀴즈가 다룰 4학년 교육과정 주제. 퀴즈는 이 범위 밖 개념을 쓰지 않는다. */
export const UNITS = [
  {
    id: "big_numbers",
    label: "큰 수",
    emoji: "🔢",
    topics: ["만·억·조 단위 읽고 쓰기", "자릿값과 각 자리 숫자가 나타내는 값", "10배, 100배 하며 뛰어 세기", "큰 수의 크기 비교"],
  },
  {
    id: "angles",
    label: "각도와 도형",
    emoji: "📐",
    topics: [
      "예각·직각·둔각 구별",
      "각도의 합과 차",
      "삼각형 세 각의 합 180°",
      "사각형 네 각의 합 360°",
      "이등변삼각형과 정삼각형",
      "수직과 평행, 사다리꼴·평행사변형·마름모",
    ],
  },
  {
    id: "fractions",
    label: "분수",
    emoji: "🍕",
    topics: ["진분수·가분수·대분수", "분모가 같은 분수의 덧셈", "분모가 같은 분수의 뺄셈", "1(자연수)에서 분수 빼기"],
  },
  {
    id: "decimals",
    label: "소수",
    emoji: "🔟",
    topics: ["소수 두 자리·세 자리 읽기", "소수의 자릿값", "소수의 크기 비교", "소수의 덧셈과 뺄셈"],
  },
  {
    id: "patterns",
    label: "그래프와 규칙",
    emoji: "📈",
    topics: ["막대그래프 읽기", "꺾은선그래프 읽기와 변화 알아보기", "수 배열에서 규칙 찾기", "계산식의 규칙 찾기"],
  },
] as const;

export const unitById = (id: string) => UNITS.find((u) => u.id === id);

export const WORD_PROBLEM_STEPS = [
  { step: 1, label: "1단계: 무엇을 구해야 할까?" },
  { step: 2, label: "2단계: 숨겨진 단서 찾기" },
  { step: 3, label: "3단계: 식 세우기 힌트" },
] as const;
