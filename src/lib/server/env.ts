import "server-only";

/** 대시보드에 붙여 넣을 때 섞여 들어가기 쉬운 앞뒤 공백·따옴표를 걷어낸다 */
export const cleanEnv = (value: string | undefined) =>
  value?.trim().replace(/^(["'])(.*)\1$/, "$2").trim() || undefined;
