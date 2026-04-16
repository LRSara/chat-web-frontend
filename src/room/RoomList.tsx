import { useEffect, useState } from "react";
import type { Room } from "@/lib/types";
import { useRoomStore } from "./useRoomStore";
import { RoomCard } from "./RoomCard";
import { CreateRoomForm } from "./CreateRoomForm";
import { JoinRoomDialog } from "./JoinRoomDialog";

export function RoomList() {
  const { rooms, loading, error, fetchRooms } = useRoomStore();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  if (loading && rooms.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-muted-foreground">Carregando salas...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Salas de chat</h1>
        <CreateRoomForm />
      </div>

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {rooms.length === 0 && !loading ? (
        <p className="text-muted-foreground text-center">
          Nenhuma sala encontrada. Crie uma para começar.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onJoin={setSelectedRoom}
            />
          ))}
        </div>
      )}

      {selectedRoom && (
        <JoinRoomDialog
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onJoined={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
