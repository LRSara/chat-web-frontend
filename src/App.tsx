import { TooltipProvider } from "@/components/ui/tooltip";
import { useChatStore } from "@/chat/useChatStore";
import { RoomList } from "@/room/RoomList";
import { ChatView } from "@/chat/ChatView";

function App() {
  const currentRoomId = useChatStore((s) => s.currentRoomId);

  return (
    <TooltipProvider>
      {currentRoomId ? <ChatView /> : <RoomList />}
    </TooltipProvider>
  );
}

export default App;
