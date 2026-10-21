"use client";

import { Camera, LoaderCircle, SendHorizontal, X } from "lucide-react";
import { useRef, useState } from "react";
import { compressImage, ImageReadError } from "@/lib/image";

interface ChatInputProps {
  onSend: (text: string, image?: string) => void;
  /** '내 문제 풀기'에서만 사진을 올릴 수 있다 */
  allowImage?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, allowImage = false, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canSend = !disabled && !preparing && Boolean(value.trim() || image);

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim(), image ?? undefined);
    setValue("");
    setImage(null);
  };

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    setPreparing(true);
    setImageError("");
    try {
      setImage(await compressImage(file));
    } catch (error) {
      setImageError(error instanceof ImageReadError ? error.message : "사진을 올리지 못했어. 다시 시도해 줄래?");
    } finally {
      setPreparing(false);
      // 같은 사진을 다시 골라도 onChange가 동작하도록 비운다
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {allowImage && (image || preparing) && (
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-grid bg-white">
            {preparing ? (
              <span className="flex h-full items-center justify-center text-ink-soft" role="status" aria-label="사진 준비 중">
                <LoaderCircle className="h-6 w-6 animate-spin motion-reduce:animate-none" aria-hidden />
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- 브라우저에서 만든 data URL 미리보기
              <img src={image!} alt="올릴 문제 사진" className="h-full w-full object-cover" />
            )}
          </div>
          {image && (
            <>
              <p className="flex-1 text-[15px] text-ink-soft">이 사진을 보낼게.</p>
              <button
                type="button"
                onClick={() => setImage(null)}
                aria-label="사진 빼기"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </>
          )}
        </div>
      )}
      {imageError && (
        <p role="alert" className="text-[15px] text-red-600">
          {imageError}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-end gap-2"
      >
        {allowImage && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => void pickImage(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled || preparing}
              aria-label="문제 사진 올리기"
              title="문제 사진 올리기"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-grid bg-white text-ink transition-colors hover:border-[var(--hero)] disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <Camera className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}
        <label htmlFor="chat-input" className="sr-only">
          문제나 내 생각 쓰기
        </label>
        <textarea
          id="chat-input"
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            // 한글 조합 중 Enter는 무시해야 마지막 글자가 중복 전송되지 않는다
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={image ? "궁금한 점 (안 적어도 돼)" : "문제나 생각을 적어 봐"}
          className="field-sizing-content max-h-40 min-h-12 min-w-0 flex-1 resize-none rounded-2xl border-2 border-grid bg-white px-4 py-3 text-[17px] text-ink placeholder:text-ink-soft focus:border-[var(--hero)] focus:outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_srgb,var(--hero)_25%,transparent)]"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="보내기"
          className="btn-press flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 bg-[var(--hero)] text-white disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
          style={{ borderColor: "color-mix(in srgb, var(--hero) 65%, black)" }}
        >
          <SendHorizontal className="h-5 w-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
