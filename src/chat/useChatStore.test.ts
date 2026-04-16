import { describe, it, expect, beforeEach, vi } from "vitest";
import { useChatStore } from "@/chat/useChatStore";

vi.mock("@/lib/api", () => ({
  api: {
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    getOnlineUsers: vi.fn(),
  },
}));

import { api } from "@/lib/api";

const mockedApi = vi.mocked(api);

describe("useChatStore", () => {
  beforeEach(() => {
    useChatStore.setState({
      currentRoomId: null,
      currentNick: null,
      messages: [],
      meta: null,
      loadingHistory: false,
      usersOnline: [],
    });
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("joinRoom", () => {
    it("deve entrar na sala e carregar mensagens", async () => {
      const messages = [
        { id: 1, room_id: 1, nick: "user1", type: "text" as const, content: "Olá", file_path: null, created_at: "2026-01-01T12:00:00Z" },
      ];
      mockedApi.joinRoom.mockResolvedValue({ data: { id: 1, room_id: 1, nick: "user1", connected_at: "2026-01-01", disconnected_at: null } });
      mockedApi.getMessages.mockResolvedValue({
        data: messages,
        meta: { current_page: 1, per_page: 50, has_more: false },
      });
      mockedApi.getOnlineUsers.mockResolvedValue({ data: ["user1"] });

      await useChatStore.getState().joinRoom(1, "123", "user1");

      const state = useChatStore.getState();
      expect(state.currentRoomId).toBe(1);
      expect(state.currentNick).toBe("user1");
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].content).toBe("Olá");
      expect(state.usersOnline).toEqual(["user1"]);
    });

    it("deve inverter ordem das mensagens (backend retorna DESC)", async () => {
      const messages = [
        { id: 2, room_id: 1, nick: "user1", type: "text" as const, content: "Segunda", file_path: null, created_at: "2026-01-01T12:01:00Z" },
        { id: 1, room_id: 1, nick: "user1", type: "text" as const, content: "Primeira", file_path: null, created_at: "2026-01-01T12:00:00Z" },
      ];
      mockedApi.joinRoom.mockResolvedValue({ data: { id: 1, room_id: 1, nick: "user1", connected_at: "2026-01-01", disconnected_at: null } });
      mockedApi.getMessages.mockResolvedValue({
        data: messages,
        meta: { current_page: 1, per_page: 50, has_more: false },
      });
      mockedApi.getOnlineUsers.mockResolvedValue({ data: ["user1"] });

      await useChatStore.getState().joinRoom(1, "123", "user1");

      expect(useChatStore.getState().messages[0].content).toBe("Primeira");
      expect(useChatStore.getState().messages[1].content).toBe("Segunda");
    });
  });

  describe("leaveRoom", () => {
    it("deve sair da sala e limpar estado", async () => {
      useChatStore.setState({
        currentRoomId: 1,
        currentNick: "user1",
        messages: [{ id: 1, room_id: 1, nick: "user1", type: "text" as const, content: "msg", file_path: null, created_at: "2026-01-01" }],
        usersOnline: ["user1"],
      });
      mockedApi.leaveRoom.mockResolvedValue({ data: null });

      await useChatStore.getState().leaveRoom();

      const state = useChatStore.getState();
      expect(state.currentRoomId).toBeNull();
      expect(state.currentNick).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.usersOnline).toEqual([]);
    });
  });

  describe("addMessage", () => {
    it("deve adicionar mensagem ao final da lista", () => {
      useChatStore.setState({
        currentRoomId: 1,
        messages: [{ id: 1, room_id: 1, nick: "user1", type: "text" as const, content: "Primeira", file_path: null, created_at: "2026-01-01" }],
      });

      useChatStore.getState().addMessage({
        id: 2, room_id: 1, nick: "user2", type: "text" as const, content: "Segunda", file_path: null, created_at: "2026-01-01",
      });

      expect(useChatStore.getState().messages).toHaveLength(2);
      expect(useChatStore.getState().messages[1].content).toBe("Segunda");
    });

    it("deve aceitar mensagem de imagem com file_path", () => {
      useChatStore.setState({ currentRoomId: 1, messages: [] });

      useChatStore.getState().addMessage({
        id: 1, room_id: 1, nick: "user1", type: "image" as const, content: null, file_path: "/uploads/img.webp", created_at: "2026-01-01",
      });

      const msg = useChatStore.getState().messages[0];
      expect(msg.type).toBe("image");
      expect(msg.file_path).toBe("/uploads/img.webp");
    });

    it("deve aceitar mensagem de áudio com file_path", () => {
      useChatStore.setState({ currentRoomId: 1, messages: [] });

      useChatStore.getState().addMessage({
        id: 1, room_id: 1, nick: "user1", type: "audio" as const, content: null, file_path: "/uploads/audio.webm", created_at: "2026-01-01",
      });

      const msg = useChatStore.getState().messages[0];
      expect(msg.type).toBe("audio");
      expect(msg.file_path).toBe("/uploads/audio.webm");
    });
  });

  describe("loadHistory", () => {
    it("deve carregar mais mensagens (prepend)", async () => {
      useChatStore.setState({
        currentRoomId: 1,
        messages: [{ id: 3, room_id: 1, nick: "user1", type: "text" as const, content: "Atual", file_path: null, created_at: "2026-01-03" }],
        meta: { current_page: 1, per_page: 50, has_more: true },
      });

      const olderMessages = [
        { id: 2, room_id: 1, nick: "user1", type: "text" as const, content: "Antiga 2", file_path: null, created_at: "2026-01-02" },
        { id: 1, room_id: 1, nick: "user1", type: "text" as const, content: "Antiga 1", file_path: null, created_at: "2026-01-01" },
      ];
      mockedApi.getMessages.mockResolvedValue({
        data: olderMessages,
        meta: { current_page: 2, per_page: 50, has_more: false },
      });

      await useChatStore.getState().loadHistory();

      const msgs = useChatStore.getState().messages;
      expect(msgs).toHaveLength(3);
      expect(msgs[0].content).toBe("Antiga 1");
      expect(msgs[2].content).toBe("Atual");
    });

    it("não deve carregar se não há mais páginas", async () => {
      useChatStore.setState({
        currentRoomId: 1,
        messages: [],
        meta: { current_page: 1, per_page: 50, has_more: false },
      });

      await useChatStore.getState().loadHistory();

      expect(mockedApi.getMessages).not.toHaveBeenCalled();
    });
  });

  describe("usersOnline", () => {
    it("deve atualizar lista de usuários online", () => {
      useChatStore.getState().setUsersOnline(["user1", "user2"]);
      expect(useChatStore.getState().usersOnline).toEqual(["user1", "user2"]);
    });

    it("deve adicionar usuário online", () => {
      useChatStore.setState({ usersOnline: ["user1"] });
      useChatStore.getState().addUserOnline("user2", ["user1", "user2"]);
      expect(useChatStore.getState().usersOnline).toEqual(["user1", "user2"]);
    });

    it("deve remover usuário online", () => {
      useChatStore.setState({ usersOnline: ["user1", "user2"] });
      useChatStore.getState().removeUserOnline("user2", ["user1"]);
      expect(useChatStore.getState().usersOnline).toEqual(["user1"]);
    });
  });
});
