/**
 * 학생이 스스로 정답을 말했을 때 Claude가 답변 맨 끝에 붙이는 숨은 표식.
 * 화면에는 절대 보이지 않게 지우고, 있으면 축하 효과를 터뜨린다.
 */
export const CORRECT_MARKER = "[[CORRECT]]";

/**
 * 스트리밍 중인 원문에서 표식을 지운 표시용 텍스트를 만든다.
 * 끝부분이 표식의 앞부분("[[COR")일 수 있으면 다음 조각이 올 때까지 잠시 숨긴다.
 */
export function cleanStreamText(raw: string): { text: string; solved: boolean } {
  const solved = raw.includes(CORRECT_MARKER);
  let text = raw.replaceAll(CORRECT_MARKER, "");
  for (let len = Math.min(CORRECT_MARKER.length - 1, text.length); len > 0; len--) {
    if (text.endsWith(CORRECT_MARKER.slice(0, len))) {
      text = text.slice(0, -len);
      break;
    }
  }
  return { text: text.trimEnd(), solved };
}
