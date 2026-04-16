import { useEffect, useRef, useCallback } from "react";
import echo from "@/lib/echo";
import type { MessageSentEvent, UserJoinedEvent, UserLeftEvent } from "@/lib/types";

interface UseWebSocketOptions {
  roomId: number | null;
  onMessage: (event: MessageSentEvent) => void;
  onUserJoined: (event: UserJoinedEvent) => void;
  onUserLeft: (event: UserLeftEvent) => void;
}

export function useWebSocket({
  roomId,
  onMessage,
  onUserJoined,
  onUserLeft,
}: UseWebSocketOptions) {
  const messageRef = useRef(onMessage);
  const joinedRef = useRef(onUserJoined);
  const leftRef = useRef(onUserLeft);

  messageRef.current = onMessage;
  joinedRef.current = onUserJoined;
  leftRef.current = onUserLeft;

  const stableOnMessage = useCallback((e: MessageSentEvent) => messageRef.current(e), []);
  const stableOnJoined = useCallback((e: UserJoinedEvent) => joinedRef.current(e), []);
  const stableOnLeft = useCallback((e: UserLeftEvent) => leftRef.current(e), []);

  useEffect(() => {
    if (!roomId) return;

    const channelName = `room.${roomId}`;
    const channel = echo.channel(channelName);

    channel.listen("MessageSent", stableOnMessage);
    channel.listen("UserJoined", stableOnJoined);
    channel.listen("UserLeft", stableOnLeft);

    return () => {
      echo.leaveChannel(channelName);
    };
  }, [roomId, stableOnMessage, stableOnJoined, stableOnLeft]);
}
