import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRoomStore } from "./useRoomStore";
import { HiOutlinePlus } from "react-icons/hi2";

export function CreateRoomForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const createRoom = useRoomStore((s) => s.createRoom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim().length < 3) {
      setError("Nome deve ter pelo menos 3 caracteres");
      return;
    }
    if (name.trim().length > 100) {
      setError("Nome deve ter no máximo 100 caracteres");
      return;
    }
    if (!password) {
      setError("Senha é obrigatória");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createRoom(name.trim(), password);
      setName("");
      setPassword("");
      setOpen(false);
    } catch (err: any) {
      setError(err.message ?? "Erro ao criar sala");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 rounded-full bg-wa-green text-white hover:bg-wa-teal">
          <HiOutlinePlus className="size-4" />
          Nova sala
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova sala</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="room-name">Nome da sala</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mínimo 3 caracteres"
              minLength={3}
              maxLength={100}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="room-password">Senha</Label>
            <Input
              id="room-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha da sala"
              required
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="rounded-full bg-wa-green text-white hover:bg-wa-teal">
            {loading ? "Criando..." : "Criar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
