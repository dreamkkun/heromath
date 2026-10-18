import Anthropic from "@anthropic-ai/sdk";
import { CHARACTERS } from "@/data/characters";
import type { CharacterId, Role } from "@/types/chat";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";
const MAX_HISTORY = 40;

interface ChatRequestBody {
  characterId: CharacterId;
  messages: { role: Role; content: string }[];
}

/** 대시보드에 붙여 넣을 때 섞여 들어가기 쉬운 앞뒤 공백·따옴표를 걷어낸다 */
const cleanEnv = (value: string | undefined) => value?.trim().replace(/^(["'])(.*)\1$/, "$2").trim() || undefined;

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ apiKey: cleanEnv(process.env.ANTHROPIC_API_KEY) }));

/** 화면용 메시지(student/hero)를 API 형식(user/assistant)으로 바꾼다. 첫 메시지는 반드시 user여야 한다. */
function toApiMessages(messages: ChatRequestBody["messages"]): Anthropic.Beta.BetaMessageParam[] {
  const recent = messages.slice(-MAX_HISTORY);
  const firstUser = recent.findIndex((m) => m.role === "student");
  if (firstUser === -1) return [];
  return recent
    .slice(firstUser)
    .filter((m) => m.content.trim())
    .map((m) => ({ role: m.role === "student" ? "user" : "assistant", content: m.content }));
}

function isValidBody(body: unknown): body is ChatRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.characterId === "string" &&
    b.characterId in CHARACTERS &&
    Array.isArray(b.messages) &&
    b.messages.every(
      (m) =>
        m &&
        typeof m === "object" &&
        (m.role === "student" || m.role === "hero") &&
        typeof m.content === "string",
    )
  );
}

export async function POST(req: Request) {
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
      // 안전 분류기가 거절하면 서버에서 다른 모델로 자동 재시도
      betas: ["server-side-fallback-2026-07-01"],
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
        if (error instanceof Anthropic.AuthenticationError) logKeyShape();
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

/** 키가 거절됐을 때 원인 파악용: 키 값은 남기지 않고 형태만 로그로 남긴다 */
function logKeyShape() {
  const key = cleanEnv(process.env.ANTHROPIC_API_KEY) ?? "";
  console.error("[api/chat] ANTHROPIC_API_KEY shape", {
    length: key.length,
    startsWithSkAnt: key.startsWith("sk-ant-"),
    hasWhitespace: /\s/.test(key),
    hasQuote: /["']/.test(key),
    hasEquals: key.includes("="),
  });
}

const MISSING_KEY_TEXT ="⚠️ 히어로 통신기가 연결되지 않았어요. (.env.local의 ANTHROPIC_API_KEY를 확인해 주세요)";

function errorText(error: unknown) {
  // AuthenticationError: 키가 틀림 / API 호출 전 SDK 오류(APIError가 아닌 AnthropicError): 인증 정보를 못 찾음
  if (
    error instanceof Anthropic.AuthenticationError ||
    (error instanceof Anthropic.AnthropicError && !(error instanceof Anthropic.APIError))
  ) {
    return MISSING_KEY_TEXT;
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "⚠️ 지금 히어로 본부가 너무 바빠요. 잠시 후 다시 물어봐 줄래?";
  }
  if (error instanceof Anthropic.APIError) {
    return `⚠️ 히어로 통신에 문제가 생겼어요. (${error.status ?? "연결 오류"})`;
  }
  return "⚠️ 히어로 통신에 문제가 생겼어요. 다시 시도해 줄래?";
}
