import type { CharacterId, ChatMessage } from "@/types/chat";

/** `/api/chat`에 대화를 보내고, 받은 텍스트 조각을 onChunk로 흘려준다. */
export async function streamChat(
  characterId: CharacterId,
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      characterId,
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    let message = text;
    try {
      message = (JSON.parse(text) as { error?: string }).error ?? text;
    } catch {}
    onChunk(message || "⚠️ 히어로 통신에 문제가 생겼어요. 다시 시도해 줄래?");
    return;
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) onChunk(value);
  }
}
