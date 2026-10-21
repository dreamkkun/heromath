"use client";

import { KeyRound, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { CHARACTER_LIST } from "@/data/characters";
import { ACCESS_CODE_HEADER, ACCESS_REVOKED_EVENT, loadAccessCode, saveAccessCode } from "@/lib/accessCode";

type GateState = "checking" | "locked" | "open";

async function verify(code: string) {
  try {
    const res = await fetch("/api/access", { method: "POST", headers: { [ACCESS_CODE_HEADER]: code } });
    return res.ok;
  } catch {
    return false;
  }
}

/** ACCESS_CODE가 설정된 배포에서만 코드를 묻는다. 맞히면 이 브라우저에 기억해 다음부터는 바로 열린다. */
export function AccessGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void verify(loadAccessCode()).then((ok) => {
      if (!cancelled) setState(ok ? "open" : "locked");
    });

    const lock = () => {
      saveAccessCode("");
      setState("locked");
    };
    window.addEventListener(ACCESS_REVOKED_EVENT, lock);
    return () => {
      cancelled = true;
      window.removeEventListener(ACCESS_REVOKED_EVENT, lock);
    };
  }, []);

  if (state === "open") return <>{children}</>;

  if (state === "checking") {
    return (
      <div className="flex h-dvh items-center justify-center bg-paper" role="status" aria-label="확인 중">
        <LoaderCircle className="h-8 w-8 animate-spin text-ink-soft motion-reduce:animate-none" aria-hidden />
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError("");
    const ok = await verify(trimmed);
    setSubmitting(false);
    if (ok) {
      saveAccessCode(trimmed);
      setState("open");
    } else {
      setError("코드가 맞지 않아. 어른에게 코드를 다시 확인해 줘.");
    }
  };

  return (
    <main className="graph-paper flex min-h-dvh items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-sm space-y-6 rounded-3xl border-2 border-grid bg-white p-6 sm:p-8">
        <div className="space-y-3 text-center">
          <p className="flex justify-center gap-1.5 text-3xl" aria-hidden>
            {CHARACTER_LIST.map((c) => (
              <span key={c.id} className="flex h-12 w-12 items-center justify-center rounded-full border-[2.5px] bg-white" style={{ borderColor: c.themeColor }}>
                {c.emblem}
              </span>
            ))}
          </p>
          <h1 className="font-display text-3xl text-ink">히어로 매스</h1>
          <p className="text-[17px] leading-relaxed text-ink-soft">히어로 본부에 들어가려면 비밀 작전 코드를 입력해 줘.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="access-code" className="block font-display text-base text-ink">
            비밀 작전 코드
          </label>
          <input
            id="access-code"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "access-error" : undefined}
            className="h-12 w-full rounded-2xl border-2 border-grid bg-white px-4 text-[17px] text-ink focus:border-[var(--hero)] focus:outline-none aria-[invalid=true]:border-red-500"
          />
          {error && (
            <p id="access-error" role="alert" className="text-[15px] text-red-600">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !code.trim()}
          className="btn-press flex h-13 w-full items-center justify-center gap-2 rounded-2xl border-2 bg-[var(--hero)] font-display text-xl text-white disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
          style={{ borderColor: "color-mix(in srgb, var(--hero) 65%, black)" }}
        >
          {submitting ? (
            <LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <KeyRound className="h-5 w-5" aria-hidden />
          )}
          본부로 들어가기
        </button>
      </form>
    </main>
  );
}
