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

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const align = isOwn ? "items-end" : "items-start";
  const bg = isOwn ? "bg-primary text-primary-foreground" : "bg-muted";
  const fileUrl = resolveFileUrl(message.file_path);

  return (
    <div className={`flex flex-col gap-0.5 ${align}`}>
      <div className="flex items-baseline gap-2">
        <span className="text-muted-foreground text-xs font-medium">
          {message.nick}
        </span>
        <span className="text-muted-foreground text-xs">
          {formatTime(message.created_at)}
        </span>
      </div>

      <div
        className={`${bg} max-w-[85%] rounded-lg px-3 py-2 text-sm sm:max-w-[70%]`}
      >
        {message.type === "text" && <p>{message.content}</p>}

        {message.type === "image" && fileUrl && (
          <ImagePreview src={fileUrl} alt={`Imagem de ${message.nick}`} />
        )}

        {message.type === "audio" && fileUrl && (
          <AudioPlayer src={fileUrl} />
        )}
      </div>
    </div>
  );
}
