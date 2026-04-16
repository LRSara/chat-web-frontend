import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { AudioPlayer } from "./AudioPlayer";

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendImage: (file: File) => void;
  onSendAudio: (blob: Blob) => void;
  disabled?: boolean;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MessageInput({
  onSendText,
  onSendImage,
  onSendAudio,
  disabled,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRecording, duration, blob, error, startRecording, stopRecording, reset } =
    useAudioRecorder();

  const handleSendText = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setText("");
  }, [text, onSendText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
      }
    },
    [handleSendText]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert("Imagem deve ter no máximo 5MB");
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Formato não suportado. Use JPG, PNG, GIF ou WebP");
        return;
      }

      setImagePreview({ file, url: URL.createObjectURL(file) });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    []
  );

  const handleSendImage = useCallback(() => {
    if (!imagePreview) return;
    onSendImage(imagePreview.file);
    URL.revokeObjectURL(imagePreview.url);
    setImagePreview(null);
  }, [imagePreview, onSendImage]);

  const handleCancelImage = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url);
      setImagePreview(null);
    }
  }, [imagePreview]);

  const handleSendAudio = useCallback(() => {
    if (!blob) return;
    onSendAudio(blob);
    reset();
  }, [blob, onSendAudio, reset]);

  // Modo gravação ativa
  if (isRecording) {
    return (
      <div className="flex items-center gap-3 border-t border-border p-3">
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-destructive" />
          <span className="text-sm tabular-nums">{formatDuration(duration)}</span>
          <span className="text-muted-foreground text-xs">/ 2:00</span>
        </div>
        <div className="flex-1" />
        <Button variant="destructive" size="sm" onClick={stopRecording}>
          Parar
        </Button>
      </div>
    );
  }

  // Modo preview de áudio
  if (blob) {
    const audioUrl = URL.createObjectURL(blob);
    return (
      <div className="flex flex-col gap-2 border-t border-border p-3">
        <AudioPlayer src={audioUrl} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSendAudio}>
            Enviar áudio
          </Button>
        </div>
      </div>
    );
  }

  // Modo preview de imagem
  if (imagePreview) {
    return (
      <div className="flex flex-col gap-2 border-t border-border p-3">
        <div className="flex items-center gap-3">
          <img
            src={imagePreview.url}
            alt="Preview"
            className="h-16 w-16 rounded-lg object-cover"
          />
          <span className="text-muted-foreground truncate text-sm">
            {imagePreview.file.name}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCancelImage}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSendImage}>
            Enviar imagem
          </Button>
        </div>
      </div>
    );
  }

  // Modo normal: input de texto + ações
  return (
    <div className="flex items-center gap-2 border-t border-border p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        aria-label="Enviar imagem"
      >
        📷
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={startRecording}
        disabled={disabled}
        aria-label="Gravar áudio"
      >
        🎤
      </Button>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite uma mensagem..."
        disabled={disabled}
        className="flex-1"
      />
      <Button
        onClick={handleSendText}
        disabled={disabled || !text.trim()}
      >
        Enviar
      </Button>

      {error && (
        <p className="text-destructive absolute bottom-full mb-1 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
