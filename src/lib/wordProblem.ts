import { UNITS, WORD_PROBLEM_STEPS } from "@/data/characters";
import type { UnitId } from "@/types/chat";

/** 숫자와 한글 문장이 함께 있으면 문장제로 본다 */
export function looksLikeWordProblem(text: string) {
  return /\d/.test(text) && /[가-힣]{2,}/.test(text) && text.length >= 15;
}

/** 퀵 액션 칩을 눌러서 보낸 메시지인지 */
export function isStepChip(text: string) {
  return WORD_PROBLEM_STEPS.some((s) => s.label === text);
}

/** 모드 B: 화면에는 숨기고 API에만 보내는 미션 출제 요청 문장 */
export function missionRequest(unit: UnitId) {
  const label = UNITS.find((u) => u.id === unit)?.label ?? unit;
  return `[미션 요청] "${label}" 단원에서 초등 4학년 수준의 히어로 스토리 문장제 문제를 딱 하나 내 줘. 정답이나 풀이는 말하지 말고, 문제만 내고 내가 먼저 생각해 보도록 질문으로 끝내 줘.`;
}
