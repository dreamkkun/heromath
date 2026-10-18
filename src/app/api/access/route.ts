import { accessCodeFrom, accessDenied, isAccessAllowed } from "@/lib/server/accessCode";
import { cleanEnv } from "@/lib/server/env";

/** 접속 코드 확인. 코드가 필요 없는 환경이면 required: false를 돌려준다. */
export async function POST(req: Request) {
  const required = Boolean(cleanEnv(process.env.ACCESS_CODE));
  if (!isAccessAllowed(accessCodeFrom(req))) {
    // 무작정 대입하는 속도를 늦춘다
    await new Promise((r) => setTimeout(r, 800));
    return accessDenied();
  }
  return Response.json({ ok: true, required });
}
