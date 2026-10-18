import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { ACCESS_CODE_HEADER } from "@/lib/accessCode";
import { cleanEnv } from "./env";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** ACCESS_CODE 환경 변수가 없으면 누구나 통과(로컬 개발용). 있으면 같은 코드여야 통과. */
export function isAccessAllowed(provided: string | null | undefined) {
  const expected = cleanEnv(process.env.ACCESS_CODE);
  if (!expected) return true;
  // 길이 차이로 정답을 추측하지 못하도록 해시끼리 상수 시간 비교
  return timingSafeEqual(digest(expected), digest((provided ?? "").trim()));
}

export const accessCodeFrom = (req: Request) => req.headers.get(ACCESS_CODE_HEADER);

export const accessDenied = () =>
  Response.json({ error: "접속 코드가 필요해요.", code: "ACCESS_REQUIRED" }, { status: 401 });
