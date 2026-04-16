import type { Room } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RoomCardProps {
  room: Room;
  onJoin: (room: Room) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function RoomCard({ room, onJoin }: RoomCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{room.name}</p>
          <p className="text-muted-foreground text-sm">
            {room.online_users_count}{" "}
            {room.online_users_count === 1 ? "online" : "online"} · Criada em{" "}
            {formatDate(room.created_at)}
          </p>
        </div>
        <Button onClick={() => onJoin(room)}>Entrar</Button>
      </CardContent>
    </Card>
  );
}
