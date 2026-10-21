import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CHARACTERS } from "@/data/characters";
import { accessCodeFrom, accessDenied, isAccessAllowed } from "@/lib/server/accessCode";
import { errorText, FALLBACK_BETA, getClient, isValidBody, MODEL, toApiMessages } from "@/lib/server/claude";
import type { Character, Solution } from "@/types/chat";

const SolutionSchema = z.object({
  problem: z.string().describe("풀이 대상 문제를 한두 문장으로 다시 쓴 것. 사진 문제라면 읽어 낸 내용."),
  steps: z
    .array(
      z.object({
        title: z.string().describe("단계 제목, 15자 이내 (예: 구해야 할 것 찾기)"),
        explanation: z.string().describe("이 단계 설명 1~3문장. 수식은 $...$ LaTeX"),
      }),
    )
    .describe("2~5개 단계. 문제를 찾지 못하면 빈 배열"),
  answer: z.string().describe("최종 정답 한 문장 (예: 한 명이 8개씩 받고 3개가 남아.)"),
});

function solutionPrompt(character: Character) {
  return `You are ${character.name}, a math tutor hero for a 4th grader in South Korea (age 10-11).
Write a step-by-step worked solution, in Korean, for the most recent math problem in the conversation
(the problem may be in a photo the student sent).

Persona (use this voice lightly, one short hero phrase at most per step):
${character.personaDetail}

Rules:
- Use only methods from the South Korean 4th-grade curriculum. No algebra (x, y), no negative numbers.
- 2 to 5 steps. Each step does one thing: find what to solve, pick out the numbers, set up the expression, calculate, check.
- The final answer appears ONLY in "answer", never inside the steps, so the student can try before revealing it.
- Write math in LaTeX wrapped in $...$ (e.g. $35 \\div 4$, $\\dfrac{3}{8}$, $60^\\circ$).
- Be correct. Double-check every calculation.
- If no math problem can be identified (or a photo is unreadable), return an empty "steps" array and use
  "problem" to say briefly what you need (e.g. 사진이 흐려서 문제를 읽을 수 없어. 다시 찍어 줄래?).`;
}

export async function POST(req: Request) {
  if (!isAccessAllowed(accessCodeFrom(req))) return accessDenied();

  const body: unknown = await req.json().catch(() => null);
  if (!isValidBody(body)) {
    return Response.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const character = CHARACTERS[body.characterId];
  const history = toApiMessages(body.messages);
  if (history.length === 0) {
    return Response.json({ error: "먼저 풀 문제를 알려 줘!" }, { status: 400 });
  }

  try {
    const response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // 풀이는 정확해야 하니 대화보다 한 단계 깊게 생각한다
      output_config: { effort: "medium", format: betaZodOutputFormat(SolutionSchema) },
      system: solutionPrompt(character),
      // 마지막이 히어로(assistant) 말이면 이어 쓰기로 처리되므로, 풀이 요청을 user 차례로 덧붙인다
      messages: [...history, { role: "user", content: "지금 문제의 단계별 풀이를 보여 줘." }],
      betas: [FALLBACK_BETA],
      fallbacks: "default",
    });

    if (response.stop_reason === "refusal") {
      return Response.json({ error: "앗, 이 문제는 풀이를 만들 수 없어. 수학 문제를 다시 보여 줄래?" }, { status: 422 });
    }
    const solution: Solution | null = response.parsed_output;
    if (!solution) {
      return Response.json({ error: "풀이를 만들다가 꼬였어. 한 번 더 눌러 줄래?" }, { status: 502 });
    }
    if (solution.steps.length === 0) {
      return Response.json({ error: solution.problem || "어떤 문제의 풀이인지 모르겠어. 문제를 먼저 알려 줘!" }, { status: 422 });
    }
    return Response.json({ solution });
  } catch (error) {
    console.error("[api/solution]", error);
    return Response.json({ error: errorText(error) }, { status: 502 });
  }
}
