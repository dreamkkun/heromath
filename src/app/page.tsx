import { AccessGate } from "@/components/AccessGate";
import { Lobby } from "@/components/Lobby";

export default function Home() {
  return (
    <AccessGate>
      <Lobby />
    </AccessGate>
  );
}
