import { ACCESS_CODE_HEADER, ACCESS_REVOKED_EVENT, loadAccessCode } from "@/lib/accessCode";
import type { ApiChatMessage, CharacterId, ChatMessage, Quiz, Solution, UnitId } from "@/types/chat";

/** 사진은 용량이 커서 최근 2장만 보낸다 (서버도 같은 기준으로 자른다) */
const MAX_IMAGES = 2;

function toApiPayload(characterId: CharacterId, messages: ChatMessage[]) {
  const imageIds = messages.filter((m) => m.image).map((m) => m.id);
  const keepImages = new Set(imageIds.slice(-MAX_IMAGES));
  const apiMessages: ApiChatMessage[] = messages.map(({ id, role, content, image }) => ({
    role,
    content,
    // 오래된 사진은 빼되, 사진이 있었다는 표시는 남긴다
    ...(image && keepImages.has(id) ? { image } : image ? { content: `[사진] ${content}` } : {}),
  }));
  return JSON.stringify({ characterId, messages: apiMessages });
}

function post(path: string, body: string, signal?: AbortSignal) {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", [ACCESS_CODE_HEADER]: loadAccessCode() },
    body,
    signal,
  });
}

/** 코드가 바뀌었거나 지워졌으면 접속 코드 화면으로 돌아간다 */
function revokeIfUnauthorized(res: Response) {
  if (res.status !== 401) return false;
  window.dispatchEvent(new Event(ACCESS_REVOKED_EVENT));
  return true;
}

async function errorMessage(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    return (JSON.parse(text) as { error?: string }).error ?? text;
  } catch {
    return text;
  }
}

/** `/api/chat`에 대화를 보내고, 받은 텍스트 조각을 onChunk로 흘려준다. */
export async function streamChat(
  characterId: CharacterId,
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
) {
  const res = await post("/api/chat", toApiPayload(characterId, messages), signal);

  if (revokeIfUnauthorized(res)) {
    onChunk("🔒 비밀 작전 코드를 다시 입력해 줘!");
    return;
  }
  if (!res.ok || !res.body) {
    onChunk((await errorMessage(res)) || "⚠️ 히어로 통신에 문제가 생겼어요. 다시 시도해 줄래?");
    return;
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) onChunk(value);
  }
}

/** `/api/solution`에서 단계별 풀이를 받는다. 실패하면 아이에게 보여줄 문장을 error로 돌려준다. */
export async function fetchSolution(
  characterId: CharacterId,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<{ solution: Solution } | { error: string }> {
  const res = await post("/api/solution", toApiPayload(characterId, messages), signal);
  if (revokeIfUnauthorized(res)) return { error: "🔒 비밀 작전 코드를 다시 입력해 줘!" };
  if (!res.ok) return { error: (await errorMessage(res)) || "⚠️ 풀이를 가져오지 못했어. 다시 눌러 줄래?" };
  return (await res.json()) as { solution: Solution };
}

/** 풀이 카드를 대화 기록용 글로 바꾼다 (히어로가 어떤 풀이를 보여줬는지 기억하도록) */
export function solutionToText(solution: Solution) {
  const steps = solution.steps.map((s, i) => `${i + 1}) ${s.title}: ${s.explanation}`).join("\n");
  return `[단계별 풀이] ${solution.problem}\n${steps}\n정답: ${solution.answer}`;
}

/** `/api/quiz`에서 단원 개념 퀴즈를 받는다. 실패하면 아이에게 보여줄 문장을 error로 돌려준다. */
export async function fetchQuiz(
  characterId: CharacterId,
  unit: UnitId,
  /** 최근에 낸 문제들 (겹치지 않게) */
  avoid: string[],
  signal?: AbortSignal,
): Promise<{ quiz: Quiz } | { error: string }> {
  const res = await post("/api/quiz", JSON.stringify({ characterId, unit, avoid }), signal);
  if (revokeIfUnauthorized(res)) return { error: "🔒 비밀 작전 코드를 다시 입력해 줘!" };
  if (!res.ok) return { error: (await errorMessage(res)) || "⚠️ 퀴즈를 가져오지 못했어. 다시 눌러 줄래?" };
  return (await res.json()) as { quiz: Quiz };
}

/** 퀴즈 카드를 대화 기록용 글로 바꾼다 (퀴즈 뒤에 아이가 질문하면 히어로가 맥락을 알도록) */
export function quizToText(quiz: Quiz) {
  const items = quiz.questions
    .map((q, i) => `${i + 1}) ${q.lesson} 문제: ${q.question} 정답: ${q.choices[q.answerIndex]}`)
    .join("\n");
  return `[개념 퀴즈] ${quiz.title}\n${items}`;
}
