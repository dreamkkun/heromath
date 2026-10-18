import { AccessGate } from "@/components/AccessGate";
import { ChatRoom } from "@/components/chat/ChatRoom";

export default function Home() {
  return (
    <AccessGate>
      <ChatRoom />
    </AccessGate>
  );
}
