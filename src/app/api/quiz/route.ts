import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CHARACTERS, pickTheme, unitById } from "@/data/characters";
import { accessCodeFrom, accessDenied, isAccessAllowed } from "@/lib/server/accessCode";
import { errorText, FALLBACK_BETA, getClient, MODEL } from "@/lib/server/claude";
import type { Character, Quiz } from "@/types/chat";

/** 아이에게 보여줄 문제 수. 검산에서 몇 개 빠질 걸 대비해 하나 더 만든다. */
const QUESTION_COUNT = 4;
const GENERATE_COUNT = QUESTION_COUNT + 1;
/** 검산을 통과한 문제가 이보다 적으면 한 번 더 만든다 */
const MIN_QUESTIONS = 3;
const MAX_AVOID = 30;

const QuizSchema = z.object({
  title: z.string().describe("퀴즈 제목, 20자 이내 (예: 삼각형 각도 탐험 퀴즈)"),
  intro: z.string().describe("히어로 말투의 시작 인사 1문장"),
  questions: z
    .array(
      z.object({
        lesson: z.string().describe("'알아두기': 이 문제를 풀 때 필요한 개념을 4학년 눈높이로 1~2문장 설명"),
        question: z.string().describe("알아두기를 안 봐도 혼자 풀 수 있는 객관식 질문 1문장"),
        answer: z.string().describe("정답 보기 (짧게)"),
        wrongChoices: z.array(z.string()).describe("오답 보기 2~3개. 아이들이 자주 하는 실수에서 나온 값"),
        explanation: z.string().describe("정답인 이유 1~2문장. 틀리기 쉬운 점이 있으면 짚어 준다"),
      }),
    )
    .describe(`문제 ${GENERATE_COUNT}개, 쉬운 것부터 차례로`),
});

/** 검산: 정답을 모르는 상태에서 각 문제를 따로 풀어 보게 한다 */
const CheckSchema = z.object({
  results: z.array(
    z.object({
      number: z.number().int().describe("문제 번호 (1부터)"),
      pick: z.number().int().describe("정답이라고 생각하는 보기 번호 (1부터)"),
      valid: z.boolean().describe("정답이 정확히 하나이고, 문제가 분명하며, 4학년 범위이면 true"),
    }),
  ),
});

function quizPrompt(character: Character) {
  return `You are ${character.name}, a math tutor hero for a 4th grader in South Korea (age 10-11).
Make a short concept quiz, in Korean, that teaches the ideas of one unit in an easy, friendly way.

Persona (light touch: one short hero phrase in the intro, plain clear language elsewhere):
${character.personaDetail}

Rules:
- Each question first teaches with a 1-2 sentence "lesson", then checks that idea with a multiple-choice question.
- Every question must be fully answerable on its own, without reading the lesson (never write "이 규칙에 따라" without stating the rule).
- Stay strictly inside the listed topics of the South Korean 4th-grade curriculum. No algebra (x, y), no negative numbers.
- Use concrete, kid-friendly situations from the given story setting, and small numbers.
- "answer" is the single correct choice. "wrongChoices" are plain values or short phrases that come from
  common mistakes. Never write explanations inside a choice, never use impossible values (e.g. a denominator of 0),
  and never make a wrong choice equal in value to the answer (e.g. $\\dfrac{2}{4}$ vs $\\dfrac{1}{2}$).
- Write large numbers the way Korean textbooks do: with commas (204,000,000) or with units (2억 400만). Never put spaces between digit groups.
- Write math in LaTeX wrapped in $...$ (e.g. $\\dfrac{3}{8}$, $60^\\circ$, $1.25$).
- Calculate every answer carefully and double-check it.`;
}

/** 같은 단원이라도 매번 다른 퀴즈가 나오도록 주제 두 개를 골라 중심으로 삼게 한다 */
function pickFocus(topics: readonly string[]) {
  return [...topics].sort(() => Math.random() - 0.5).slice(0, 2);
}

/** 겹침 비교용: 공백·$·LaTeX 장식을 걷어낸다 */
const normalize = (s: string) => s.replace(/\$|\\,|\s/g, "").replace(/\\dfrac|\\frac/g, "frac");

/** 분모가 0인 분수처럼 말이 안 되는 보기 */
const IMPOSSIBLE = /\{0\}|\/0(?!\d)/;
/** 보기가 이보다 길면 해설이 섞인 것으로 본다 */
const MAX_CHOICE_CHARS = 40;

type Draft = z.infer<typeof QuizSchema>;

/** 정답 값과 오답들로 보기를 만들고 섞는다. 정답 위치는 서버가 정하므로 '정답 번호'가 어긋날 일이 없다. */
function buildQuestions(draft: Draft): Quiz["questions"] {
  return draft.questions.flatMap((q) => {
    const answer = q.answer.trim();
    if (!answer || IMPOSSIBLE.test(answer) || answer.length > MAX_CHOICE_CHARS) return [];
    const seen = new Set([normalize(answer)]);
    const wrongs = q.wrongChoices
      .map((w) => w.trim())
      .filter((w) => {
        const key = normalize(w);
        if (!w || seen.has(key) || IMPOSSIBLE.test(w) || w.length > MAX_CHOICE_CHARS) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 3);
    if (wrongs.length < 2) return [];
    const choices = [answer, ...wrongs].sort(() => Math.random() - 0.5);
    return [{ lesson: q.lesson, question: q.question, choices, answerIndex: choices.indexOf(answer), explanation: q.explanation }];
  });
}

/** 다른 호출에서 정답을 모른 채 다시 풀어 보고, 답이 다르거나 애매한 문제는 뺀다 */
async function verify(questions: Quiz["questions"]) {
  const listing = questions
    .map((q, i) => `${i + 1}. ${q.question}\n${q.choices.map((c, j) => `   (${j + 1}) ${c}`).join("\n")}`)
    .join("\n\n");
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: "low", format: betaZodOutputFormat(CheckSchema) },
    system:
      "You check multiple-choice math questions for South Korean 4th graders. Solve each question yourself, carefully, " +
      "and report the number of the correct choice. Mark valid=false if no choice or more than one choice is correct, " +
      "if the question is unclear or needs information it does not give, or if it goes beyond the 4th-grade curriculum.",
    messages: [{ role: "user", content: listing }],
    betas: [FALLBACK_BETA],
    fallbacks: "default",
  });
  const results = response.parsed_output?.results ?? [];
  return questions.filter((q, i) => {
    const r = results.find((x) => x.number === i + 1);
    return r !== undefined && r.valid && r.pick - 1 === q.answerIndex;
  });
}

async function generate(character: Character, unitLabel: string, topics: readonly string[], avoid: string[]) {
  const focus = pickFocus(topics);
  const theme = pickTheme();
  const avoidText =
    avoid.length > 0
      ? `\n최근에 이미 낸 문제들이야. 이것과 같거나 숫자만 바꾼 문제는 내지 말고, 다른 상황·다른 숫자·다른 질문 방식으로 내 줘:\n${avoid.map((a) => `- ${a}`).join("\n")}`
      : "";
  const response = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // medium은 27초쯤 걸려 아이가 기다리기 길었다. 정확도는 아래 검산 단계에서 따로 챙긴다
    output_config: { effort: "low", format: betaZodOutputFormat(QuizSchema) },
    system: quizPrompt(character),
    messages: [
      {
        role: "user",
        content: `단원: ${unitLabel}
이 단원의 주제: ${topics.join(", ")}
이번 퀴즈는 특히 이 주제를 중심으로: ${focus.join(", ")}
이야기 소재: ${theme}${avoidText}
문제 ${GENERATE_COUNT}개짜리 개념 퀴즈를 만들어 줘.`,
      },
    ],
    betas: [FALLBACK_BETA],
    fallbacks: "default",
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) return null;
  const draft = response.parsed_output;
  const built = buildQuestions(draft);
  const checked = await verify(built);
  // 검산에서 몇 문제가 빠지는지 배포 로그로 지켜볼 수 있게 남긴다
  console.info(`[api/quiz] ${unitLabel}: made ${draft.questions.length}, well-formed ${built.length}, verified ${checked.length}`);
  return { title: draft.title, intro: draft.intro, questions: checked.slice(0, QUESTION_COUNT) } satisfies Quiz;
}

export async function POST(req: Request) {
  if (!isAccessAllowed(accessCodeFrom(req))) return accessDenied();

  const body = (await req.json().catch(() => null)) as { characterId?: string; unit?: string; avoid?: unknown } | null;
  const unit = body?.unit ? unitById(body.unit) : undefined;
  if (!body || !body.characterId || !(body.characterId in CHARACTERS) || !unit) {
    return Response.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }
  const character = CHARACTERS[body.characterId as keyof typeof CHARACTERS];
  const avoid = Array.isArray(body.avoid)
    ? body.avoid
        .filter((a): a is string => typeof a === "string")
        .slice(-MAX_AVOID)
        .map((a) => a.slice(0, 200))
    : [];

  try {
    // 검산을 통과한 문제가 너무 적으면 한 번 더 만든다
    let quiz = await generate(character, unit.label, unit.topics, avoid);
    if (!quiz || quiz.questions.length < MIN_QUESTIONS) {
      quiz = await generate(character, unit.label, unit.topics, avoid);
    }
    if (!quiz || quiz.questions.length === 0) {
      return Response.json({ error: "퀴즈를 만들다가 꼬였어. 한 번 더 눌러 줄래?" }, { status: 502 });
    }
    return Response.json({ quiz });
  } catch (error) {
    console.error("[api/quiz]", error);
    return Response.json({ error: errorText(error) }, { status: 502 });
  }
}
