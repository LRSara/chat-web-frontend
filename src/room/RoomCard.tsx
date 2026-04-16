import type { Room } from "@/lib/types";
import { HiOutlineChevronRight } from "react-icons/hi2";

interface RoomCardProps {
  room: Room;
  onJoin: (room: Room) => void;
}

export function RoomCard({ room, onJoin }: RoomCardProps) {
  const initials = room.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={() => onJoin(room)}
      className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-wa-input-bg"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-wa-teal text-sm font-semibold text-white">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{room.name}</p>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-wa-green" />
          <p className="text-wa-time text-sm">
            {room.online_users_count}{" "}
            {room.online_users_count === 1 ? "online" : "online"}
          </p>
        </div>
      </div>
      <HiOutlineChevronRight className="size-5 shrink-0 text-wa-time" />
    </button>
  );
}
