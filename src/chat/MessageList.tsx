import { useEffect, useRef } from "react";
import { useChatStore } from "./useChatStore";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { MessageBubble } from "./MessageBubble";

export function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const loadingHistory = useChatStore((s) => s.loadingHistory);
  const meta = useChatStore((s) => s.meta);
  const currentNick = useChatStore((s) => s.currentNick);
  const loadHistory = useChatStore((s) => s.loadHistory);

  const { containerRef, scrollToBottom } = useInfiniteScroll(
    loadHistory,
    loadingHistory
  );

  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      const el = containerRef.current;
      if (el) {
        const isNearBottom =
          el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        if (isNearBottom || prevLengthRef.current === 0) {
          scrollToBottom();
        }
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, containerRef, scrollToBottom]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-3"
    >
      {loadingHistory && (
        <p className="text-muted-foreground mb-3 text-center text-xs">
          Carregando mensagens...
        </p>
      )}

      {meta && !meta.has_more && messages.length > 0 && (
        <p className="text-muted-foreground mb-3 text-center text-xs">
          Início da conversa
        </p>
      )}

      {messages.length === 0 && !loadingHistory ? (
        <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
          Nenhuma mensagem ainda. Envie a primeira!
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.nick === currentNick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
