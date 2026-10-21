import type { Metadata } from "next";
import { AccessGate } from "@/components/AccessGate";
import { GalagaGame } from "@/components/game/GalagaGame";

export const metadata: Metadata = {
  title: "쉬는 시간 · 히어로 매스",
};

export default function GamePage() {
  return (
    <AccessGate>
      <GalagaGame />
    </AccessGate>
  );
}
