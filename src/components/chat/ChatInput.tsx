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
        문제나 질문 입력
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
        placeholder="문제를 입력하거나 질문하세요..."
        className="field-sizing-content max-h-40 min-h-12 flex-1 resize-none rounded-2xl border-2 border-ink bg-white px-4 py-3 text-base text-ink placeholder:text-ink-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero)]"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="보내기"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-[var(--hero)] text-white shadow-[3px_3px_0_var(--ink)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <SendHorizontal className="h-5 w-5" aria-hidden />
      </button>
    </form>
  );
}
