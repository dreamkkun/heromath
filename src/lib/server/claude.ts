import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { CHARACTERS } from "@/data/characters";
import type { ApiChatMessage, CharacterId } from "@/types/chat";
import { cleanEnv } from "./env";

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";
/** 안전 분류기가 거절하면 서버에서 다른 모델로 자동 재시도 */
export const FALLBACK_BETA = "server-side-fallback-2026-07-01";

const MAX_HISTORY = 40;
/** 사진은 크기가 커서 최근 것만 다시 보낸다 (그 전 사진은 '[사진]' 글자로 대신) */
const MAX_IMAGES = 2;
/** 줄인 JPEG 한 장은 보통 수백 KB. 넉넉히 잡아도 이보다 크면 거절한다 (Vercel 요청 한도 4.5MB) */
const MAX_IMAGE_CHARS = 2_000_000;
const IMAGE_DATA_URL = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/;

let client: Anthropic | null = null;
export const getClient = () => (client ??= new Anthropic({ apiKey: cleanEnv(process.env.ANTHROPIC_API_KEY) }));

export interface ChatRequestBody {
  characterId: CharacterId;
  messages: ApiChatMessage[];
}

export function isValidBody(body: unknown): body is ChatRequestBody {
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
        typeof m.content === "string" &&
        (m.image === undefined ||
          (typeof m.image === "string" && m.image.length <= MAX_IMAGE_CHARS && IMAGE_DATA_URL.test(m.image))),
    )
  );
}

/** 화면용 메시지(student/hero)를 API 형식(user/assistant)으로 바꾼다. 첫 메시지는 반드시 user여야 한다. */
export function toApiMessages(messages: ApiChatMessage[]): Anthropic.Beta.BetaMessageParam[] {
  const recent = messages.slice(-MAX_HISTORY);
  const firstUser = recent.findIndex((m) => m.role === "student");
  if (firstUser === -1) return [];

  const kept = recent.slice(firstUser).filter((m) => m.content.trim() || m.image);
  const imageIndexes = kept.flatMap((m, i) => (m.image ? [i] : []));
  const sendImage = new Set(imageIndexes.slice(-MAX_IMAGES));

  return kept.map((m, i): Anthropic.Beta.BetaMessageParam => {
    if (m.role === "hero") return { role: "assistant", content: m.content };
    const text = m.content.trim() || "이 문제를 같이 풀어 줘!";
    if (!m.image) return { role: "user", content: text };
    if (!sendImage.has(i)) return { role: "user", content: `[사진] ${text}` };

    const [, mediaType, data] = m.image.match(IMAGE_DATA_URL)!;
    return {
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType as "image/jpeg", data },
        },
        { type: "text", text },
      ],
    };
  });
}

export const MISSING_KEY_TEXT = "⚠️ 히어로 통신기가 연결되지 않았어요. (.env.local의 ANTHROPIC_API_KEY를 확인해 주세요)";

export function errorText(error: unknown) {
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
