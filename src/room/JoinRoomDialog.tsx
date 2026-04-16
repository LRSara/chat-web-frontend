import { useState } from "react";
import type { Room } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChatStore } from "@/chat/useChatStore";

interface JoinRoomDialogProps {
  room: Room;
  onClose: () => void;
  onJoined: () => void;
}

export function JoinRoomDialog({ room, onClose, onJoined }: JoinRoomDialogProps) {
  const [password, setPassword] = useState("");
  const [nick, setNick] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const joinRoom = useChatStore((s) => s.joinRoom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nick.trim().length < 3) {
      setError("Nick deve ter pelo menos 3 caracteres");
      return;
    }
    if (nick.trim().length > 50) {
      setError("Nick deve ter no máximo 50 caracteres");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await joinRoom(room.id, password, nick.trim());
      onJoined();
    } catch (err: any) {
      if (err.message?.includes("Senha") || err.message?.includes("403")) {
        setError("Senha incorreta");
      } else if (err.message?.includes("Usuário") || err.message?.includes("409")) {
        setError("Usuário online já existente com esse nick, tente outro");
      } else {
        setError(err.message ?? "Erro ao entrar na sala");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entrar em {room.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="join-nick">Seu nick</Label>
            <Input
              id="join-nick"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="Como você será identificado"
              minLength={3}
              maxLength={50}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="join-password">Senha da sala</Label>
            <Input
              id="join-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha da sala"
              required
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="rounded-full bg-wa-green text-white hover:bg-wa-teal">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
