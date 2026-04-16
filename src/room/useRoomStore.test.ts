import { describe, it, expect, beforeEach, vi } from "vitest";
import { useRoomStore } from "@/room/useRoomStore";

vi.mock("@/lib/api", () => ({
  api: {
    listRooms: vi.fn(),
    createRoom: vi.fn(),
  },
}));

import { api } from "@/lib/api";

const mockedApi = vi.mocked(api);

describe("useRoomStore", () => {
  beforeEach(() => {
    useRoomStore.setState({ rooms: [], loading: false, error: null });
    vi.clearAllMocks();
  });

  describe("fetchRooms", () => {
    it("deve carregar salas com sucesso", async () => {
      const rooms = [
        { id: 1, name: "Sala 1", created_at: "2026-01-01", online_users_count: 2 },
        { id: 2, name: "Sala 2", created_at: "2026-01-02", online_users_count: 0 },
      ];
      mockedApi.listRooms.mockResolvedValue({ data: rooms });

      await useRoomStore.getState().fetchRooms();

      const state = useRoomStore.getState();
      expect(state.rooms).toEqual(rooms);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("deve tratar erro ao carregar salas", async () => {
      mockedApi.listRooms.mockRejectedValue({ message: "Erro de rede" });

      await useRoomStore.getState().fetchRooms();

      const state = useRoomStore.getState();
      expect(state.rooms).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe("Erro de rede");
    });
  });

  describe("createRoom", () => {
    it("deve criar sala e adicionar à lista", async () => {
      const newRoom = { id: 1, name: "Nova Sala", created_at: "2026-01-01", online_users_count: 0 };
      mockedApi.createRoom.mockResolvedValue({ data: newRoom, message: "Sala criada com sucesso." });

      const result = await useRoomStore.getState().createRoom("Nova Sala", "123");

      expect(result).toEqual(newRoom);
      expect(useRoomStore.getState().rooms).toContainEqual(newRoom);
    });

    it("deve colocar sala nova no início da lista", async () => {
      useRoomStore.setState({
        rooms: [{ id: 1, name: "Existente", created_at: "2026-01-01", online_users_count: 0 }],
      });

      const newRoom = { id: 2, name: "Nova", created_at: "2026-01-02", online_users_count: 0 };
      mockedApi.createRoom.mockResolvedValue({ data: newRoom });

      await useRoomStore.getState().createRoom("Nova", "123");

      expect(useRoomStore.getState().rooms[0].id).toBe(2);
    });
  });
});
