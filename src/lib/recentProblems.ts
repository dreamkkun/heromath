/**
 * 최근에 낸 문제를 단원별로 기억해 두고, 다음 출제 때 "이건 피해서 내 줘"라고 같이 보낸다.
 * 그래서 같은 단원을 매일 골라도 같은 문제가 되풀이되지 않는다. (이 브라우저에만 저장)
 */
import type { UnitId } from "@/types/chat";

type Kind = "quiz" | "mission";

const KEY = "hero-math-recent";
/** 단원·종류마다 이만큼만 기억한다 */
const KEEP = 24;
/** 이보다 오래된 문제는 다시 나와도 괜찮다 */
const KEEP_DAYS = 30;
const MAX_CHARS = 140;

interface Entry {
  text: string;
  at: number;
}
type Store = Partial<Record<`${Kind}:${UnitId}`, Entry[]>>;

function read(): Store {
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store) ?? {};
  } catch {
    return {};
  }
}

export function getRecent(kind: Kind, unit: UnitId): string[] {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  return (read()[`${kind}:${unit}`] ?? []).filter((e) => e.at >= cutoff).map((e) => e.text);
}

export function addRecent(kind: Kind, unit: UnitId, texts: string[]) {
  const cleaned = texts.map((t) => t.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS)).filter(Boolean);
  if (cleaned.length === 0) return;
  try {
    const store = read();
    const key = `${kind}:${unit}` as const;
    const now = Date.now();
    store[key] = [...(store[key] ?? []), ...cleaned.map((text) => ({ text, at: now }))].slice(-KEEP);
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // 저장을 못 해도 출제는 계속된다 (그땐 겹칠 수 있다)
  }
}
