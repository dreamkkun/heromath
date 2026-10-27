import { pickTheme, UNITS, WORD_PROBLEM_STEPS } from "@/data/characters";
import type { Difficulty, UnitId } from "@/types/chat";

/** 숫자와 한글 문장이 함께 있으면 문장제로 본다 */
export function looksLikeWordProblem(text: string) {
  return /\d/.test(text) && /[가-힣]{2,}/.test(text) && text.length >= 15;
}

/** 퀵 액션 칩을 눌러서 보낸 메시지인지 */
export function isStepChip(text: string) {
  return WORD_PROBLEM_STEPS.some((s) => s.label === text);
}

/** 모드 B: 화면에는 숨기고 API에만 보내는 미션 출제 요청 문장 */
const MISSION_LEVEL: Record<Difficulty, string> = {
  basic: "교과서 기본 문제 수준으로, 한 번의 계산으로 풀리는",
  challenge: "수학 익힘책 '도전' 문제 수준으로, 두 단계 이상 생각해야 풀리는",
};

export function missionRequest(unit: UnitId, difficulty: Difficulty, recent: string[] = []) {
  const info = UNITS.find((u) => u.id === unit);
  if (!info) return `[미션 요청] 초등 4학년 수준의 히어로 스토리 문장제 문제를 딱 하나 내 줘.`;
  // 매번 같은 문제가 나오지 않도록 단원 주제와 이야기 소재를 골라 주고, 최근 문제는 피하게 한다
  const topic = info.topics[Math.floor(Math.random() * info.topics.length)];
  const avoid =
    recent.length > 0
      ? ` 최근에 이미 낸 문제들과 같거나 숫자만 바꾼 문제는 피해서, 다른 상황과 다른 숫자로 내 줘: ${recent.map((r) => `「${r}」`).join(" ")}`
      : "";
  return `[미션 요청] "${info.label}" 단원의 "${topic}" 주제로, "${pickTheme()}"을(를) 배경으로 한 초등 4학년 히어로 스토리 문장제 문제를 ${MISSION_LEVEL[difficulty]} 문제로 딱 하나 내 줘. 숫자와 계산을 꼼꼼히 확인해서 답이 하나로 정해지는 문제로 내 줘. 정답이나 풀이는 말하지 말고, 문제만 내고 내가 먼저 생각해 보도록 질문으로 끝내 줘.${avoid}`;
}
