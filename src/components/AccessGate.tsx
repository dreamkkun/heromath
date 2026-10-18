"use client";

import { KeyRound, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
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
      setError("코드가 달라요. 다시 확인해 줄래?");
    }
  };

  return (
    <main className="halftone flex min-h-dvh items-center justify-center px-4 py-10">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-5 rounded-3xl border-[3px] border-ink bg-white p-6 shadow-[6px_6px_0_var(--ink)]"
      >
        <div className="space-y-2 text-center">
          <p className="text-5xl" aria-hidden>
            🛡️
          </p>
          <h1 className="font-display text-2xl text-ink">HERO MATH ACADEMY</h1>
          <p className="text-sm text-ink-soft">히어로 본부에 들어가려면 비밀 작전 코드가 필요해!</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="access-code" className="block text-sm font-bold text-ink">
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
            className="h-12 w-full rounded-2xl border-2 border-ink bg-white px-4 text-base text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero)]"
          />
          {error && (
            <p id="access-error" role="alert" className="text-sm font-bold text-red-600">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !code.trim()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-[var(--hero)] font-display text-lg text-white shadow-[3px_3px_0_var(--ink)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {submitting ? (
            <LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <KeyRound className="h-5 w-5" aria-hidden />
          )}
          출동!
        </button>
      </form>
    </main>
  );
}
