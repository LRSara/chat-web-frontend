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

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <div className="flex items-center justify-between bg-wa-header px-4 py-3">
        <h1 className="text-lg font-semibold text-wa-header-foreground">Conversas</h1>
        <CreateRoomForm />
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <p className="px-4 py-3 text-destructive text-sm">{error}</p>
        )}

        {loading && rooms.length === 0 ? (
          <p className="px-4 py-8 text-center text-wa-time text-sm">
            Carregando salas...
          </p>
        ) : rooms.length === 0 ? (
          <p className="px-4 py-8 text-center text-wa-time text-sm">
            Nenhuma sala encontrada. Crie uma para começar.
          </p>
        ) : (
          <div>
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={setSelectedRoom}
              />
            ))}
          </div>
        )}
      </div>

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
