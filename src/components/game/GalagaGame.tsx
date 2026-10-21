"use client";

import { ArrowLeft, BookOpen, Clock, Heart, Play, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MathText } from "@/components/chat/MathText";
import {
  BREAK_MS,
  type BreakState,
  EXTRA_MS,
  formatRemaining,
  limitOf,
  loadBreak,
  resetBreak,
  saveBreak,
} from "@/lib/game/breakTimer";
import { Game, HEIGHT, type Input, type Status, WIDTH } from "@/lib/game/engine";
import { type GateQuestion, makeGateQuestion } from "@/lib/game/mathGate";
import { useActiveCharacter, useHeroStore } from "@/store/heroStore";

const BEST_KEY = "hero-math-game-best";
const STAGE_BONUS = 500;
const COLORS = { ink: "#1c2b4b", grid: "#d5e3f5", marker: "#ffe45c" };

function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score: number) {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // 저장을 못 해도 게임은 계속된다
  }
}

/** 화면에 보여줄 게임 상태 (게임 객체에서 바뀔 때마다 복사해 온다) */
interface View {
  status: Status;
  stage: number;
  score: number;
  lives: number;
}

const INITIAL_VIEW: View = { status: "ready", stage: 1, score: 0, lives: 3 };

// 최고 점수는 localStorage에서 읽는다. 서버 렌더링 때는 0
const subscribeBest = () => () => {};
const readBest = () => loadBest();
const serverBest = () => 0;

/** 갤러그풍 쉬는 시간 게임. 외계인을 다 물리치면 수학 관문을 통과해야 다음 단계로 간다. */
export function GalagaGame() {
  const character = useActiveCharacter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const inputRef = useRef<Input>({ left: false, right: false, targetX: null });
  const heroRef = useRef({ emblem: character.emblem, color: character.themeColor });
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const [gate, setGate] = useState<{ question: GateQuestion; picked: number | null } | null>(null);
  const best = useSyncExternalStore(subscribeBest, readBest, serverBest);
  // 쉬는 시간 타이머: 시간 계산은 그리기 루프에서, 화면에는 초 단위로만 반영한다
  const breakRef = useRef<BreakState | null>(null);
  const timeUpRef = useRef(false);
  /** 공부로 돌아가면 타이머를 비우고, 화면을 떠날 때 다시 저장하지 않는다 */
  const leavingForStudyRef = useRef(false);
  const [remainingMs, setRemainingMs] = useState(BREAK_MS);
  const [timeUp, setTimeUp] = useState(false);
  const [extended, setExtended] = useState(false);

  useEffect(() => {
    void useHeroStore.persist.rehydrate();
  }, []);

  // 히어로를 바꾸면 게임 속 내 비행기 모양·색도 바뀐다
  useEffect(() => {
    heroRef.current = { emblem: character.emblem, color: character.themeColor };
    gameRef.current?.setHeroEmblem(character.emblem);
  }, [character.emblem, character.themeColor]);

  // 게임 객체를 만들고 그리기 루프를 돌린다
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const game = new Game(heroRef.current.emblem, () => {
      setView({ status: game.status, stage: game.stage, score: game.score, lives: game.lives });
      // 단계를 깨면 관문 문제를 내고, 게임이 끝나면 최고 점수를 저장한다
      if (game.status === "gate") {
        setGate((current) => current ?? { question: makeGateQuestion(game.stage), picked: null });
      }
      if (game.status === "over" && game.score > loadBest()) saveBest(game.score);
    });
    gameRef.current = game;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      // 탭이 가려졌다 돌아와도 한 번에 크게 움직이지 않도록 시간 간격을 제한한다
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      // 쉬는 시간이 끝나면 게임은 멈춘 채로 둔다
      if (!document.hidden && !timeUpRef.current) game.update(dt, inputRef.current);
      ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
      game.draw(ctx, { ...COLORS, hero: heroRef.current.color });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      gameRef.current = null;
    };
  }, []);

  // 쉬는 시간 타이머. 그리기와 따로 실제 시계로 0.5초마다 세고, 다른 탭을 보고 있을 땐 세지 않는다.
  useEffect(() => {
    const br = loadBreak();
    breakRef.current = br;
    let last = Date.now();
    let lastSave = last;

    const tick = () => {
      const now = Date.now();
      // 컴퓨터가 잠들었다 깨어나도 한꺼번에 많이 빠지지 않게 한 번에 최대 2초만 센다
      const elapsed = Math.min(now - last, 2000);
      last = now;
      if (timeUpRef.current || document.visibilityState !== "visible") return;

      br.usedMs += elapsed;
      const left = limitOf(br) - br.usedMs;
      setRemainingMs(left);
      setExtended(br.extended);
      if (now - lastSave > 5000 && !leavingForStudyRef.current) {
        saveBreak(br);
        lastSave = now;
      }
      if (left <= 0) {
        timeUpRef.current = true;
        inputRef.current = { left: false, right: false, targetX: null };
        saveBreak(br);
        setTimeUp(true);
      }
    };
    const timer = window.setInterval(tick, 500);
    // 첫 화면부터 실제 남은 시간이 보이도록 바로 한 번 센다
    const first = window.setTimeout(tick, 0);
    const saveOnLeave = () => {
      if (!leavingForStudyRef.current) saveBreak(br);
    };
    window.addEventListener("pagehide", saveOnLeave);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(first);
      window.removeEventListener("pagehide", saveOnLeave);
      saveOnLeave();
    };
  }, []);

  const goStudy = () => {
    leavingForStudyRef.current = true;
    resetBreak();
  };

  /** "1분만 더"는 한 번만 */
  const extendBreak = () => {
    const br = breakRef.current;
    if (!br || br.extended) return;
    br.extended = true;
    saveBreak(br);
    timeUpRef.current = false;
    setExtended(true);
    setRemainingMs(limitOf(br) - br.usedMs);
    setTimeUp(false);
  };

  const start = useCallback(() => {
    setGate(null);
    gameRef.current?.start();
  }, []);

  // 키보드: ← → (또는 A D)로 이동, Enter/Space로 시작
  useEffect(() => {
    const setKey = (e: KeyboardEvent, down: boolean) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") inputRef.current.left = down;
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") inputRef.current.right = down;
      else return;
      e.preventDefault();
    };
    const onDown = (e: KeyboardEvent) => {
      const status = gameRef.current?.status;
      if (timeUpRef.current) return;
      if ((e.key === "Enter" || e.key === " ") && (status === "ready" || status === "over")) {
        if (e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        start();
        return;
      }
      setKey(e, true);
    };
    const onUp = (e: KeyboardEvent) => setKey(e, false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [start]);

  // 터치·마우스: 누른 채 좌우로 끌면 그쪽으로 따라간다
  const pointerX = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return ((e.clientX - rect.left) / rect.width) * WIDTH;
  };

  const answer = (i: number) => {
    const game = gameRef.current;
    if (!game || !gate || gate.picked !== null) return;
    setGate({ ...gate, picked: i });
    if (i === gate.question.answerIndex) {
      game.score += STAGE_BONUS;
      setView((v) => ({ ...v, score: game.score }));
    }
  };

  const nextStage = () => {
    setGate(null);
    gameRef.current?.nextStage();
  };

  const retryGate = () => setGate({ question: makeGateQuestion(view.stage), picked: null });

  const passed = gate !== null && gate.picked !== null && gate.picked === gate.question.answerIndex;

  return (
    <div
      className="flex min-h-dvh flex-col bg-ink text-white"
      style={{ "--hero": character.themeColor } as React.CSSProperties}
    >
      <header className="mx-auto flex w-full max-w-md items-center gap-2 px-4 pt-3">
        <Link
          href="/"
          onClick={goStudy}
          className="flex h-11 items-center gap-1.5 rounded-full px-3 text-[15px] whitespace-nowrap text-white/85 hover:bg-white/10 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          공부로 돌아가기
        </Link>
        <span
          className={`ml-auto flex items-center gap-1 text-[15px] whitespace-nowrap tabular-nums ${remainingMs <= 60_000 ? "text-marker" : "text-white/70"}`}
          title="남은 쉬는 시간"
        >
          <Clock className="h-4 w-4" aria-hidden />
          <span className="sr-only">남은 쉬는 시간</span>
          {formatRemaining(remainingMs)}
        </span>
        <span className="flex items-center gap-1 pl-2 text-[15px] text-white/70" title="최고 점수">
          <Trophy className="h-4 w-4 text-marker" aria-hidden />
          <span className="sr-only">최고 점수</span>
          <span className="tabular-nums">{best.toLocaleString("ko-KR")}</span>
        </span>
      </header>

      <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-2 font-display text-lg">
        <span>{view.stage}단계</span>
        <span className="tabular-nums">{view.score.toLocaleString("ko-KR")}점</span>
        <span className="flex gap-0.5" aria-label={`생명 ${view.lives}개`}>
          {Array.from({ length: 3 }, (_, i) => (
            <Heart
              key={i}
              className={`h-5 w-5 ${i < view.lives ? "fill-red-400 text-red-400" : "text-white/25"}`}
              aria-hidden
            />
          ))}
        </span>
      </div>

      <main className="flex flex-1 items-start justify-center px-2 pb-4">
        <div className="relative w-[min(100%,calc((100dvh-130px)*2/3))]">
          <canvas
            ref={canvasRef}
            className="block aspect-[2/3] w-full touch-none rounded-2xl border-2 border-white/15"
            aria-label="게임 화면. 화면을 누른 채 좌우로 끌거나 방향키로 움직여. 총알은 자동으로 나가."
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              inputRef.current.targetX = pointerX(e);
            }}
            onPointerMove={(e) => {
              if (inputRef.current.targetX !== null) inputRef.current.targetX = pointerX(e);
            }}
            onPointerUp={() => (inputRef.current.targetX = null)}
            onPointerCancel={() => (inputRef.current.targetX = null)}
          />

          {timeUp && (
            <Overlay>
              <p className="text-5xl" aria-hidden>
                ⏰
              </p>
              <p className="font-display text-2xl">
                쉬는 시간 {extended ? "6" : "5"}분이 끝났어!
              </p>
              <p className="text-[17px] leading-relaxed text-ink">
                {view.score > 0 && `${view.score.toLocaleString("ko-KR")}점, 멋졌어! `}
                이제 공부로 돌아갈까? 히어로가 기다리고 있어.
              </p>
              <Link
                href="/"
                onClick={goStudy}
                autoFocus
                className="btn-press flex h-13 w-full items-center justify-center gap-2 rounded-2xl border-2 bg-[var(--hero)] font-display text-xl text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
                style={{ borderColor: "color-mix(in srgb, var(--hero) 65%, black)" }}
              >
                <BookOpen className="h-5 w-5" aria-hidden />
                공부로 돌아가기
              </Link>
              {!extended && (
                <button
                  type="button"
                  onClick={extendBreak}
                  className="min-h-11 px-3 text-[15px] text-ink-soft underline underline-offset-4 hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  {EXTRA_MS / 60_000}분만 더 할래 (한 번만)
                </button>
              )}
            </Overlay>
          )}

          {!timeUp && view.status === "ready" && (
            <Overlay>
              <p className="text-5xl" aria-hidden>
                {character.emblem}
              </p>
              <h1 className="font-display text-3xl">히어로 우주 방어전</h1>
              <ul className="space-y-1 text-[16px] leading-relaxed text-ink">
                <li>화면을 누른 채 좌우로 끌거나 ← → 키로 움직여.</li>
                <li>총알은 자동으로 나가.</li>
                <li>외계인을 다 물리치면 수학 관문을 통과해야 다음 단계야!</li>
              </ul>
              <PrimaryButton onClick={start} icon={<Play className="h-5 w-5" aria-hidden />}>
                출동하기
              </PrimaryButton>
            </Overlay>
          )}

          {!timeUp && view.status === "gate" && gate && (
            <Overlay>
              <p className="font-display text-xl">
                {view.stage}단계 통과! 다음 단계로 가려면 수학 관문을 풀어야 해.
              </p>
              <p className="text-[18px] leading-relaxed text-ink">
                <MathText text={gate.question.question} />
              </p>
              <div role="group" aria-label="보기" className="grid w-full grid-cols-2 gap-2">
                {gate.question.choices.map((choice, i) => {
                  const revealed = gate.picked !== null;
                  const isAnswer = i === gate.question.answerIndex;
                  const isPicked = i === gate.picked;
                  const tone = !revealed
                    ? "border-grid bg-white hover:border-[var(--hero)]"
                    : isAnswer && passed
                      ? "border-green-600 bg-green-50"
                      : isPicked
                        ? "border-red-500 bg-red-50"
                        : "border-grid bg-white opacity-60";
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => answer(i)}
                      disabled={revealed}
                      className={`min-h-14 rounded-xl border-2 px-2 py-2 text-[17px] text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${tone}`}
                    >
                      <MathText text={choice} />
                    </button>
                  );
                })}
              </div>

              {gate.picked !== null &&
                (passed ? (
                  <>
                    <p className="text-[16px] text-green-700" role="status">
                      정답! 보너스 {STAGE_BONUS}점을 받았어.
                    </p>
                    <PrimaryButton
                      onClick={nextStage}
                      icon={<Play className="h-5 w-5" aria-hidden />}
                    >
                      {view.stage + 1}단계 출발!
                    </PrimaryButton>
                  </>
                ) : (
                  <>
                    <p className="text-[16px] leading-relaxed text-ink" role="status">
                      <span className="font-display text-red-600">아깝다! </span>
                      <MathText text={gate.question.hint} />
                    </p>
                    <PrimaryButton
                      onClick={retryGate}
                      icon={<RotateCcw className="h-5 w-5" aria-hidden />}
                    >
                      다른 문제로 다시 도전
                    </PrimaryButton>
                  </>
                ))}
            </Overlay>
          )}

          {!timeUp && view.status === "over" && (
            <Overlay>
              <p className="font-display text-3xl">게임 끝!</p>
              <p className="text-[17px] text-ink">
                {view.stage}단계까지 와서 <span className="font-display">{view.score.toLocaleString("ko-KR")}점</span>을
                얻었어.
                {view.score > 0 && view.score >= best && " 최고 기록이야!"}
              </p>
              <PrimaryButton onClick={start} icon={<RotateCcw className="h-5 w-5" aria-hidden />}>
                다시 하기
              </PrimaryButton>
              <Link href="/" onClick={goStudy} className="text-[15px] text-ink-soft underline underline-offset-4 hover:text-ink">
                공부로 돌아가기
              </Link>
            </Overlay>
          )}
        </div>
      </main>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-3">
      <div className="flex max-h-full w-full flex-col items-center gap-3 overflow-y-auto rounded-2xl bg-white p-5 text-center text-ink">
        {children}
      </div>
    </div>
  );
}

function PrimaryButton({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      autoFocus
      className="btn-press flex h-13 w-full items-center justify-center gap-2 rounded-2xl border-2 bg-[var(--hero)] font-display text-xl text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
      style={{ borderColor: "color-mix(in srgb, var(--hero) 65%, black)" }}
    >
      {icon}
      {children}
    </button>
  );
}
