"use client";

import { SendHorizontal } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2"
    >
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
        placeholder="문제나 생각을 적어 봐"
        className="field-sizing-content max-h-40 min-h-12 flex-1 resize-none rounded-2xl border-2 border-grid bg-white px-4 py-3 text-[17px] text-ink placeholder:text-ink-soft focus:border-[var(--hero)] focus:outline-none focus-visible:ring-3 focus-visible:ring-[color-mix(in_srgb,var(--hero)_25%,transparent)]"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="보내기"
        className="btn-press flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 bg-[var(--hero)] text-white disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
        style={{ borderColor: "color-mix(in srgb, var(--hero) 65%, black)" }}
      >
        <SendHorizontal className="h-5 w-5" aria-hidden />
      </button>
    </form>
  );
}
