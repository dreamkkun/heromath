/** 사진을 Claude가 읽기 좋은 크기로 줄여 JPEG data URL로 만든다 (브라우저 전용). */

/** Claude는 긴 변 1568px 정도면 충분히 읽는다. 더 크면 업로드만 느려진다. */
const MAX_EDGE = 1568;
const JPEG_QUALITY = 0.85;

export class ImageReadError extends Error {}

export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new ImageReadError("사진 파일만 올릴 수 있어.");
  }

  let bitmap: ImageBitmap;
  try {
    // 휴대폰 사진의 회전 정보(EXIF)를 반영해서 읽는다
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageReadError("이 사진은 열 수 없어. 다른 사진으로 다시 올려 줄래?");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageReadError("사진을 준비하지 못했어. 다시 시도해 줄래?");
  // 투명 배경 PNG도 흰 공책 위에 있는 것처럼
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
