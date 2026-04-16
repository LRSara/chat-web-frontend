import { useCallback, useEffect, useState } from "react";
import { useChatStore } from "./useChatStore";
import { useRoomStore } from "@/room/useRoomStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { api } from "@/lib/api";
import type { MessageSentEvent, UserJoinedEvent, UserLeftEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { UserList } from "./UserList";
import { useNotifications, NotificationStack } from "./Notification";
import { HiOutlineArrowLeft, HiOutlineUserGroup } from "react-icons/hi2";

export function resolveFileUrl(filePath: string | null): string | null {
  if (!filePath) return null;
  if (filePath.startsWith("http://") || filePath.startsWith("https://") || filePath.startsWith("/")) {
    return filePath;
  }
  return `/storage/${filePath}`;
}

export function ChatView() {
  const {
    currentRoomId,
    currentNick,
    messages,
    addMessage,
    addUserOnline,
    removeUserOnline,
    leaveRoom,
  } = useChatStore();
  const { rooms, fetchRooms } = useRoomStore();
  const { items: notifications, notify } = useNotifications();
  const [sending, setSending] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const currentRoom = rooms.find((r) => r.id === currentRoomId);

  useEffect(() => {
    if (!currentRoomId) return;
    if (messages.length > 0 && currentRoom) return;

    setInitialLoading(true);

    const promises: Promise<unknown>[] = [];

    if (messages.length === 0) {
      promises.push(
        api.getMessages(currentRoomId, 1).then((res) => {
          useChatStore.setState({
            messages: res.data.reverse(),
            meta: res.meta,
          });
        })
      );
    }

    if (!currentRoom) {
      promises.push(fetchRooms());
    }

    if (useChatStore.getState().usersOnline.length === 0) {
      promises.push(
        api.getOnlineUsers(currentRoomId).then((res) => {
          useChatStore.setState({ usersOnline: res.data });
        }).catch(() => {})
      );
    }

    Promise.all(promises).finally(() => setInitialLoading(false));
  }, []);

  const onMessage = useCallback(
    (event: MessageSentEvent) => {
      const { messages } = useChatStore.getState();
      const eventTime = new Date(event.created_at).getTime();
      const exists = messages.some(
        (m) =>
          m.nick === event.nick &&
          m.type === event.type &&
          Math.abs(new Date(m.created_at).getTime() - eventTime) < 1000
      );
      if (exists) return;

      addMessage({
        id: Date.now(),
        room_id: currentRoomId!,
        nick: event.nick,
        type: event.type,
        content: event.content,
        file_path: event.file_url,
        created_at: event.created_at,
      });
    },
    [currentRoomId, addMessage]
  );

  const onUserJoined = useCallback(
    (event: UserJoinedEvent) => {
      addUserOnline(event.nick, event.users_online);
      if (event.nick !== currentNick) {
        notify(`${event.nick} entrou na sala`);
      }
    },
    [currentNick, addUserOnline, notify]
  );

  const onUserLeft = useCallback(
    (event: UserLeftEvent) => {
      removeUserOnline(event.nick, event.users_online);
      notify(`${event.nick} saiu da sala`);
    },
    [removeUserOnline, notify]
  );

  useWebSocket({
    roomId: currentRoomId,
    onMessage,
    onUserJoined,
    onUserLeft,
  });

  const handleSendText = useCallback(
    async (text: string) => {
      if (!currentRoomId || !currentNick) return;
      setSending(true);
      try {
        const res = await api.sendMessage(currentRoomId, currentNick, "text", text);
        addMessage(res.data);
      } catch {
        notify("Erro ao enviar mensagem");
      } finally {
        setSending(false);
      }
    },
    [currentRoomId, currentNick, addMessage, notify]
  );

  const handleSendImage = useCallback(
    async (file: File) => {
      if (!currentRoomId || !currentNick) return;
      setSending(true);
      try {
        const res = await api.sendMessage(currentRoomId, currentNick, "image", undefined, file);
        addMessage(res.data);
      } catch {
        notify("Erro ao enviar imagem");
      } finally {
        setSending(false);
      }
    },
    [currentRoomId, currentNick, addMessage, notify]
  );

  const handleSendAudio = useCallback(
    async (blob: Blob) => {
      if (!currentRoomId || !currentNick) return;
      setSending(true);
      try {
        const ext = blob.type.includes("ogg")
          ? "ogg"
          : blob.type.includes("mp4")
            ? "mp4"
            : "webm";
        const file = new File([blob], `audio.${ext}`, { type: blob.type });
        const res = await api.sendMessage(currentRoomId, currentNick, "audio", undefined, file);
        addMessage(res.data);
      } catch {
        notify("Erro ao enviar áudio");
      } finally {
        setSending(false);
      }
    },
    [currentRoomId, currentNick, addMessage, notify]
  );

  const handleLeave = useCallback(async () => {
    await leaveRoom();
  }, [leaveRoom]);

  if (!currentRoomId || !currentNick) return null;

  if (initialLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-wa-chat-bg">
        <p className="text-wa-time">Carregando conversa...</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      {/* Header */}
      <div className="flex items-center justify-between bg-wa-header px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLeave}
            className="text-wa-header-foreground hover:bg-wa-teal/30 hover:text-wa-header-foreground"
          >
            <HiOutlineArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-base font-semibold text-wa-header-foreground">
              {currentRoom?.name ?? "Sala"}
            </h2>
            <p className="text-xs text-wa-header-foreground/70">
              {currentNick}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowUsers(!showUsers)}
          className="text-wa-header-foreground hover:bg-wa-teal/30 hover:text-wa-header-foreground sm:hidden"
        >
          <HiOutlineUserGroup className="size-5" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden bg-wa-chat-bg">
        {/* UserList sidebar */}
        <div
          className={`${
            showUsers ? "block" : "hidden"
          } w-full border-r border-border bg-background p-3 sm:block sm:w-48`}
        >
          <UserList />
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col">
          <MessageList />
          <MessageInput
            onSendText={handleSendText}
            onSendImage={handleSendImage}
            onSendAudio={handleSendAudio}
            disabled={sending}
          />
        </div>
      </div>

      <NotificationStack items={notifications} />
    </div>
  );
}
