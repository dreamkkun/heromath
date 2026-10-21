/**
 * 쉬는 시간 타이머 저장. 새로고침해도 시간이 처음부터 다시 시작되지 않게 브라우저에 남겨 둔다.
 * 공부 화면으로 돌아가거나, 마지막으로 게임한 지 오래 지나면 새 쉬는 시간으로 본다.
 */

export const BREAK_MS = 5 * 60 * 1000;
/** "1분만 더"는 한 번만 */
export const EXTRA_MS = 60 * 1000;
/** 이만큼 게임을 안 했으면 다음 방문은 새 쉬는 시간 */
const FRESH_AFTER_MS = 30 * 60 * 1000;

const KEY = "hero-math-break";

export interface BreakState {
  usedMs: number;
  extended: boolean;
}

export function loadBreak(): BreakState {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as (BreakState & { updatedAt: number }) | null;
    if (!saved || Date.now() - saved.updatedAt > FRESH_AFTER_MS) return { usedMs: 0, extended: false };
    return { usedMs: saved.usedMs, extended: saved.extended };
  } catch {
    return { usedMs: 0, extended: false };
  }
}

export function saveBreak(state: BreakState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, updatedAt: Date.now() }));
  } catch {
    // 저장을 못 해도 이번 방문 동안은 메모리의 시간으로 동작한다
  }
}

/** 공부 화면으로 돌아가면 다음 쉬는 시간은 다시 5분 */
export function resetBreak() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}

export const limitOf = (state: BreakState) => BREAK_MS + (state.extended ? EXTRA_MS : 0);

/** 남은 시간을 "4:05" 형태로 */
export function formatRemaining(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
