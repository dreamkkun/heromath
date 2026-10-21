import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CHARACTERS, unitById } from "@/data/characters";
import { accessCodeFrom, accessDenied, isAccessAllowed } from "@/lib/server/accessCode";
import { errorText, FALLBACK_BETA, getClient, MODEL } from "@/lib/server/claude";
import type { Character, Quiz } from "@/types/chat";

const QUESTION_COUNT = 4;

const QuizSchema = z.object({
  title: z.string().describe("퀴즈 제목, 20자 이내 (예: 삼각형 각도 탐험 퀴즈)"),
  intro: z.string().describe("히어로 말투의 시작 인사 1문장"),
  questions: z
    .array(
      z.object({
        lesson: z.string().describe("'알아두기': 이 문제를 풀 때 필요한 개념을 4학년 눈높이로 1~2문장 설명"),
        question: z.string().describe("알아두기 내용을 확인하는 객관식 질문 1문장"),
        choices: z.array(z.string()).describe("보기 3~4개, 짧게. 정답은 하나뿐"),
        answerIndex: z.number().int().describe("정답 보기의 0부터 시작하는 번호"),
        explanation: z.string().describe("정답인 이유 1~2문장. 틀리기 쉬운 점이 있으면 짚어 준다"),
      }),
    )
    .describe(`문제 ${QUESTION_COUNT}개, 쉬운 것부터 차례로`),
});

function quizPrompt(character: Character) {
  return `You are ${character.name}, a math tutor hero for a 4th grader in South Korea (age 10-11).
Make a short concept quiz, in Korean, that teaches the ideas of one unit in an easy, friendly way.

Persona (light touch: one short hero phrase in the intro, plain clear language elsewhere):
${character.personaDetail}

Rules:
- Each question first teaches with a 1-2 sentence "lesson", then checks that exact idea with a multiple-choice question.
- Stay strictly inside the listed topics of the South Korean 4th-grade curriculum. No algebra (x, y), no negative numbers.
- Use concrete, kid-friendly examples (사탕, 피자, 히어로 기지 등) and small numbers.
- Exactly one choice is correct. Wrong choices should be common mistakes, not silly ones
  (never impossible values such as a denominator of 0).
- Vary which position holds the correct choice.
- Write math in LaTeX wrapped in $...$ (e.g. $\\dfrac{3}{8}$, $60^\\circ$, $1.25$).
- Double-check every fact and calculation.`;
}

/** 같은 단원이라도 매번 다른 퀴즈가 나오도록 주제 두 개를 골라 중심으로 삼게 한다 */
function pickFocus(topics: readonly string[]) {
  return [...topics].sort(() => Math.random() - 0.5).slice(0, 2);
}

/** 모델 출력에서 형식이 어긋난 문제(정답 번호가 보기 범위 밖 등)는 버린다 */
function sanitize(quiz: Quiz): Quiz {
  return {
    ...quiz,
    questions: quiz.questions.filter(
      (q) =>
        q.choices.length >= 2 &&
        q.choices.length <= 5 &&
        Number.isInteger(q.answerIndex) &&
        q.answerIndex >= 0 &&
        q.answerIndex < q.choices.length,
    ),
  };
}

export async function POST(req: Request) {
  if (!isAccessAllowed(accessCodeFrom(req))) return accessDenied();

  const body = (await req.json().catch(() => null)) as { characterId?: string; unit?: string } | null;
  const unit = body?.unit ? unitById(body.unit) : undefined;
  if (!body || !body.characterId || !(body.characterId in CHARACTERS) || !unit) {
    return Response.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  const character = CHARACTERS[body.characterId as keyof typeof CHARACTERS];
  const focus = pickFocus(unit.topics);

  try {
    const response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // medium은 27초쯤 걸려 아이가 기다리기 길었다. low(약 13초)도 내용이 정확해서 low로 둔다
      output_config: { effort: "low", format: betaZodOutputFormat(QuizSchema) },
      system: quizPrompt(character),
      messages: [
        {
          role: "user",
          content: `단원: ${unit.label}
이 단원의 주제: ${unit.topics.join(", ")}
이번 퀴즈는 특히 이 주제를 중심으로: ${focus.join(", ")}
문제 ${QUESTION_COUNT}개짜리 개념 퀴즈를 만들어 줘.`,
        },
      ],
      betas: [FALLBACK_BETA],
      fallbacks: "default",
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "퀴즈를 만들다가 꼬였어. 한 번 더 눌러 줄래?" }, { status: 502 });
    }
    const quiz = sanitize(response.parsed_output);
    if (quiz.questions.length === 0) {
      return Response.json({ error: "퀴즈를 만들다가 꼬였어. 한 번 더 눌러 줄래?" }, { status: 502 });
    }
    return Response.json({ quiz });
  } catch (error) {
    console.error("[api/quiz]", error);
    return Response.json({ error: errorText(error) }, { status: 502 });
  }
}
