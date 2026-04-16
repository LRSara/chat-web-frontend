import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoomList } from "@/room/RoomList";
import { useRoomStore } from "@/room/useRoomStore";

vi.mock("@/lib/api", () => ({
  api: {
    listRooms: vi.fn(),
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

vi.mock("@/chat/useChatStore", () => ({
  useChatStore: () => null,
}));

describe("RoomList", () => {
  beforeEach(() => {
    useRoomStore.setState({ rooms: [], loading: false, error: null });
    useRoomStore.setState({ fetchRooms: vi.fn() });
  });

  it("deve mostrar estado de carregamento", () => {
    useRoomStore.setState({ loading: true, rooms: [] });
    render(<RoomList />);
    expect(screen.getByText("Carregando salas...")).toBeInTheDocument();
  });

  it("deve mostrar mensagem quando não há salas", () => {
    render(<RoomList />);
    expect(screen.getByText("Nenhuma sala encontrada. Crie uma para começar.")).toBeInTheDocument();
  });

  it("deve renderizar lista de salas", () => {
    useRoomStore.setState({
      loading: false,
      rooms: [
        { id: 1, name: "Sala Teste", created_at: "2026-01-15T10:00:00Z", online_users_count: 3 },
        { id: 2, name: "Outra Sala", created_at: "2026-01-14T08:00:00Z", online_users_count: 0 },
      ],
    });

    render(<RoomList />);

    expect(screen.getByText("Sala Teste")).toBeInTheDocument();
    expect(screen.getByText("Outra Sala")).toBeInTheDocument();
  });

  it("deve mostrar quantidade de usuários online", () => {
    useRoomStore.setState({
      loading: false,
      rooms: [
        { id: 1, name: "Sala", created_at: "2026-01-15T10:00:00Z", online_users_count: 5 },
      ],
    });

    render(<RoomList />);
    expect(screen.getByText(/5.*online/i)).toBeInTheDocument();
  });

  it("deve mostrar erro quando falha ao carregar", () => {
    useRoomStore.setState({ loading: false, rooms: [], error: "Erro de conexão" });
    render(<RoomList />);
    expect(screen.getByText("Erro de conexão")).toBeInTheDocument();
  });

  it("deve ter botão de criar sala", () => {
    render(<RoomList />);
    expect(screen.getByText("Nova sala")).toBeInTheDocument();
  });

  it("deve ter botão entrar em cada sala", () => {
    useRoomStore.setState({
      loading: false,
      rooms: [
        { id: 1, name: "Sala A", created_at: "2026-01-01", online_users_count: 0 },
        { id: 2, name: "Sala B", created_at: "2026-01-01", online_users_count: 0 },
      ],
    });

    render(<RoomList />);
    expect(screen.getByText("Sala A")).toBeInTheDocument();
    expect(screen.getByText("Sala B")).toBeInTheDocument();
    const roomButtons = screen.getAllByRole("button").filter(
      (btn) => btn.textContent?.includes("Sala A") || btn.textContent?.includes("Sala B")
    );
    expect(roomButtons).toHaveLength(2);
  });
});
