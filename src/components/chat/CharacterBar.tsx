"use client";

import { CHARACTER_LIST } from "@/data/characters";
import type { CharacterId } from "@/types/chat";

interface CharacterBarProps {
  activeId: CharacterId;
  onSelect: (id: CharacterId) => void;
}

export function CharacterBar({ activeId, onSelect }: CharacterBarProps) {
  return (
    <nav aria-label="튜터 히어로 선택" className="border-b-[3px] border-ink bg-paper">
      <ul className="mx-auto flex max-w-3xl gap-3 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
        {CHARACTER_LIST.map((c) => {
          const active = c.id === activeId;
          return (
            <li key={c.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-pressed={active}
                className={`flex min-h-11 items-center gap-2 rounded-2xl border-[3px] border-ink px-3 py-2 text-left transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                  active ? "text-white shadow-[4px_4px_0_var(--ink)]" : "bg-white text-ink shadow-[2px_2px_0_var(--ink)]"
                }`}
                style={active ? { backgroundColor: c.themeColor } : undefined}
              >
                <span className="text-2xl" aria-hidden>
                  {c.emblem}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="font-display text-base">{c.name}</span>
                  <span className={`text-xs ${active ? "text-white/90" : "text-ink-soft"}`}>{c.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
