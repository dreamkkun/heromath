import { AccessGate } from "@/components/AccessGate";
import { GalagaGame } from "@/components/game/GalagaGame";

// 제목은 레이아웃의 "히어로 매스"를 그대로 쓴다 (링크 공유 미리보기에 같은 이름이 나오도록)

export default function GamePage() {
  return (
    <AccessGate>
      <GalagaGame />
    </AccessGate>
  );
}
