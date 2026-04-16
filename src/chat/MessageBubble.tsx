import type { Message } from "@/lib/types";
import { AudioPlayer } from "./AudioPlayer";
import { ImagePreview } from "./ImagePreview";
import { resolveFileUrl } from "./ChatView";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(nick: string) {
  return nick.slice(0, 2).toUpperCase();
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const fileUrl = resolveFileUrl(message.file_path);

  return (
    <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      {/* Avatar (apenas para mensagens recebidas) */}
      {!isOwn && (
        <div className="mt-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-wa-teal text-[10px] font-semibold text-white">
          {getInitials(message.nick)}
        </div>
      )}

      <div
        className={`relative max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm shadow-xs sm:max-w-[70%] ${
          isOwn
            ? "bg-wa-sent rounded-br-none"
            : "bg-wa-received rounded-bl-none"
        }`}
      >
        {/* Cauda */}
        {isOwn ? (
          <span className="absolute -right-2 bottom-0 block h-0 w-0 border-l-[8px] border-b-[8px] border-l-wa-sent border-b-transparent" />
        ) : (
          <span className="absolute -left-2 bottom-0 block h-0 w-0 border-r-[8px] border-b-[8px] border-r-wa-received border-b-transparent" />
        )}

        {/* Nick do remetente (apenas recebidas) */}
        {!isOwn && (
          <p className="mb-0.5 text-xs font-semibold text-wa-teal">
            {message.nick}
          </p>
        )}

        {message.type === "text" && (
          <p className="pr-14 break-words">{message.content}</p>
        )}

        {message.type === "image" && fileUrl && (
          <ImagePreview src={fileUrl} alt={`Imagem de ${message.nick}`} />
        )}

        {message.type === "audio" && fileUrl && (
          <AudioPlayer src={fileUrl} />
        )}

        <span className="float-right ml-2 mt-0.5 text-[10px] text-wa-time">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}
