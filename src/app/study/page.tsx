import { AccessGate } from "@/components/AccessGate";
import { ChatRoom } from "@/components/chat/ChatRoom";

export default function StudyPage() {
  return (
    <AccessGate>
      <ChatRoom />
    </AccessGate>
  );
}
