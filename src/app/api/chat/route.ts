import type Anthropic from "@anthropic-ai/sdk";
import { CHARACTERS } from "@/data/characters";
import { accessCodeFrom, accessDenied, isAccessAllowed } from "@/lib/server/accessCode";
import {
  errorText,
  FALLBACK_BETA,
  getClient,
  isValidBody,
  MISSING_KEY_TEXT,
  MODEL,
  toApiMessages,
} from "@/lib/server/claude";

export async function POST(req: Request) {
  if (!isAccessAllowed(accessCodeFrom(req))) return accessDenied();

  const body: unknown = await req.json().catch(() => null);
  if (!isValidBody(body)) {
    return Response.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const character = CHARACTERS[body.characterId];
  const messages = toApiMessages(body.messages);
  if (messages.length === 0 || messages.at(-1)?.role !== "user") {
    return Response.json({ error: "학생 메시지가 필요해요." }, { status: 400 });
  }

  let anthropic: Anthropic;
  try {
    anthropic = getClient();
  } catch (error) {
    console.error("[api/chat]", error);
    return new Response(MISSING_KEY_TEXT, { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const stream = anthropic.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: 2048,
      // 아이와의 짧은 대화라 응답 속도를 우선한다
      output_config: { effort: "low" },
      system: [{ type: "text", text: character.systemPrompt, cache_control: { type: "ephemeral" } }],
      messages,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
    },
    { signal: req.signal },
  );

  const encoder = new TextEncoder();
  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n앗, 그 이야기는 도와주기 어려워. 우리 수학 미션으로 돌아가 볼까?"));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("…"));
        }
        controller.close();
      } catch (error) {
        if (req.signal.aborted) return controller.close();
        console.error("[api/chat]", error);
        controller.enqueue(encoder.encode(errorText(error)));
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body$, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
