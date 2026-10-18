/** 브라우저와 서버가 함께 쓰는 접속 코드 상수·저장 도우미 */

export const ACCESS_CODE_HEADER = "x-access-code";
/** 코드가 틀렸거나 바뀌어서 다시 물어봐야 할 때 브라우저에 보내는 이벤트 */
export const ACCESS_REVOKED_EVENT = "hero-access-revoked";

const STORAGE_KEY = "hero-math-access";

export function loadAccessCode() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveAccessCode(code: string) {
  try {
    if (code) localStorage.setItem(STORAGE_KEY, code);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장을 못 해도 이번 방문 동안은 메모리의 코드로 동작한다
  }
}
