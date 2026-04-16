import { create } from "zustand";
import type { Room } from "@/lib/types";
import { api } from "@/lib/api";

interface RoomState {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  fetchRooms: () => Promise<void>;
  createRoom: (name: string, password: string) => Promise<Room>;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  loading: false,
  error: null,

  fetchRooms: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.listRooms();
      set({ rooms: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.message ?? "Erro ao carregar salas", loading: false });
    }
  },

  createRoom: async (name, password) => {
    const res = await api.createRoom(name, password);
    const room = { ...res.data, online_users_count: res.data.online_users_count ?? 0 };
    set((s) => ({ rooms: [room, ...s.rooms] }));
    return room;
  },
}));
