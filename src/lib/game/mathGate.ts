/**
 * 게임 단계 관문 문제. Claude를 부르지 않고 브라우저에서 바로 만든다 (기다림·요금 없음).
 * 4학년 교육과정 범위에서 숫자만 무작위로 바꾼다. 오답 보기는 아이들이 자주 하는 실수로 만든다.
 */

export interface GateQuestion {
  topic: string;
  question: string;
  choices: string[];
  answerIndex: number;
  hint: string;
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

/** 정답 + 오답 후보로 보기 4개를 만든다. 겹치거나 말이 안 되는 오답은 버리고, 모자라면 채운다. */
function build(
  topic: string,
  question: string,
  answer: string,
  wrongs: string[],
  hint: string,
  filler: () => string,
): GateQuestion {
  const set = new Set<string>([answer]);
  for (const w of wrongs) if (w && !set.has(w) && set.size < 4) set.add(w);
  for (let guard = 0; set.size < 4 && guard < 50; guard++) set.add(filler());
  const choices = [...set].sort(() => Math.random() - 0.5);
  return { topic, question, choices, answerIndex: choices.indexOf(answer), hint };
}

const fmt = (n: number) => n.toLocaleString("ko-KR");
const frac = (a: number, b: number) => `$\\dfrac{${a}}{${b}}$`;
const dec = (n: number) => String(Math.round(n * 100) / 100);

/** 규칙 찾기: 일정하게 커지는 수 배열의 다음 수 */
function pattern(): GateQuestion {
  const start = rand(2, 30);
  const step = rand(3, 12);
  const seq = Array.from({ length: 4 }, (_, i) => start + step * i);
  const answer = start + step * 4;
  return build(
    "규칙 찾기",
    `규칙을 찾아 다음 수를 구해 봐. ${seq.join(", ")}, □`,
    String(answer),
    [String(answer + 1), String(answer - step), String(answer + step)],
    `이웃한 두 수의 차이를 구해 봐. 계속 ${step}씩 커지고 있어!`,
    () => String(answer + rand(-9, 9)),
  );
}

/** 큰 수: 여덟 자리 수에서 한 숫자가 나타내는 값 */
function placeValue(): GateQuestion {
  // 맨 앞(천만)부터 0, 1, 2, 3번 자리
  const places = [
    { index: 0, name: "천만" },
    { index: 1, name: "백만" },
    { index: 2, name: "십만" },
    { index: 3, name: "만" },
  ] as const;
  const place = pick(places);
  const digit = rand(2, 9);
  // 다른 자리에는 같은 숫자를 쓰지 않아 어느 자리를 묻는지 헷갈리지 않게 한다
  const digits = Array.from({ length: 8 }, (_, i) => {
    if (i === place.index) return digit;
    let d = rand(i === 0 ? 1 : 0, 9);
    while (d === digit) d = rand(i === 0 ? 1 : 0, 9);
    return d;
  });
  const number = digits.reduce((acc, d) => acc * 10 + d, 0);
  const answer = digit * 10 ** (7 - place.index);
  return build(
    "큰 수",
    `${fmt(number)}에서 숫자 ${digit}이(가) 나타내는 값은 얼마일까?`,
    fmt(answer),
    [fmt(answer / 10), fmt(answer * 10), fmt(digit * 1000)],
    `뒤에서부터 네 자리씩 끊으면 만의 자리를 찾기 쉬워. ${digit}은(는) ${place.name}의 자리에 있어!`,
    () => fmt(digit * 10 ** rand(2, 8)),
  );
}

/** 각도: 삼각형·사각형의 모르는 각 */
function angle(): GateQuestion {
  if (Math.random() < 0.6) {
    const a = rand(30, 80);
    const b = rand(30, 80);
    const answer = 180 - a - b;
    return build(
      "각도",
      `삼각형의 두 각이 $${a}^\\circ$와 $${b}^\\circ$야. 나머지 한 각은 몇 도일까?`,
      `$${answer}^\\circ$`,
      [`$${360 - a - b}^\\circ$`, `$${a + b}^\\circ$`, `$${answer + 10}^\\circ$`],
      "삼각형의 세 각을 모두 더하면 $180^\\circ$야!",
      () => `$${answer + rand(-25, 25)}^\\circ$`,
    );
  }
  const a = rand(60, 120);
  const b = rand(60, 120);
  const c = rand(60, 110);
  const answer = 360 - a - b - c;
  if (answer <= 20 || answer >= 170) return angle();
  return build(
    "각도",
    `사각형의 세 각이 $${a}^\\circ$, $${b}^\\circ$, $${c}^\\circ$야. 나머지 한 각은 몇 도일까?`,
    `$${answer}^\\circ$`,
    [`$${180 - ((a + b + c) % 180)}^\\circ$`, `$${answer + 20}^\\circ$`, `$${answer - 10}^\\circ$`],
    "사각형의 네 각을 모두 더하면 $360^\\circ$야!",
    () => `$${answer + rand(-30, 30)}^\\circ$`,
  );
}

/** 분수: 분모가 같은 분수의 덧셈·뺄셈 */
function fraction(): GateQuestion {
  const n = pick([5, 6, 7, 8, 9, 10, 12]);
  if (Math.random() < 0.5) {
    const a = rand(1, n - 2);
    const b = rand(1, n - 1 - a);
    return build(
      "분수",
      `${frac(a, n)} $+$ ${frac(b, n)} 은 얼마일까?`,
      frac(a + b, n),
      [frac(a + b, n + n), frac(a + b + 1, n), frac(Math.abs(a - b) || 1, n)],
      "분모가 같으면 분모는 그대로 두고 분자끼리만 더해!",
      () => frac(rand(1, n), n),
    );
  }
  const a = rand(3, n - 1);
  const b = rand(1, a - 1);
  return build(
    "분수",
    `${frac(a, n)} $-$ ${frac(b, n)} 은 얼마일까?`,
    frac(a - b, n),
    [frac(a - b, n * 2), frac(a + b, n), frac(a - b + 1, n)],
    "분모가 같으면 분모는 그대로 두고 분자끼리만 빼!",
    () => frac(rand(1, n - 1), n),
  );
}

/** 소수: 소수 두 자리의 덧셈·뺄셈 */
function decimal(): GateQuestion {
  const a = rand(110, 480) / 100;
  const b = rand(12, 95) / 100;
  if (Math.random() < 0.5) {
    const answer = a + b;
    return build(
      "소수",
      `$${dec(a)} + ${dec(b)}$ 는 얼마일까?`,
      dec(answer),
      [dec(answer + 0.1), dec(answer - 0.01), dec(a + b * 10)],
      "소수점끼리 줄을 맞춰서 같은 자리 수끼리 더해!",
      () => dec(answer + rand(-30, 30) / 100),
    );
  }
  const answer = a - b;
  return build(
    "소수",
    `$${dec(a)} - ${dec(b)}$ 는 얼마일까?`,
    dec(answer),
    [dec(answer + 0.1), dec(answer - 0.01), dec(Math.abs(a - b * 10))],
    "소수점끼리 줄을 맞춰서 같은 자리 수끼리 빼!",
    () => dec(answer + rand(-30, 30) / 100),
  );
}

const BY_STAGE = [pattern, placeValue, angle, fraction, decimal];

/** 1단계 → 규칙, 2 → 큰 수, 3 → 각도, 4 → 분수, 5 → 소수, 그다음부터는 섞어서 */
export function makeGateQuestion(clearedStage: number): GateQuestion {
  const make = clearedStage <= BY_STAGE.length ? BY_STAGE[clearedStage - 1] : pick(BY_STAGE);
  return make();
}
