import { create } from "zustand";
import type { Message, PaginatedMeta } from "@/lib/types";
import { api } from "@/lib/api";

const STORAGE_KEY = "chat-session";

function loadSession(): { currentRoomId: number | null; currentNick: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { currentRoomId: null, currentNick: null };
    const data = JSON.parse(raw);
    return {
      currentRoomId: data.currentRoomId ?? null,
      currentNick: data.currentNick ? data.currentNick.trim().toLowerCase() : null,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { currentRoomId: null, currentNick: null };
  }
}

function saveSession(roomId: number | null, nick: string | null) {
  if (roomId && nick) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentRoomId: roomId, currentNick: nick }));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

const saved = loadSession();

interface ChatState {
  currentRoomId: number | null;
  currentNick: string | null;
  messages: Message[];
  meta: PaginatedMeta | null;
  loadingHistory: boolean;
  usersOnline: string[];

  joinRoom: (roomId: number, password: string, nick: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  loadHistory: () => Promise<void>;
  addMessage: (message: Message) => void;
  setUsersOnline: (users: string[]) => void;
  addUserOnline: (nick: string, users: string[]) => void;
  removeUserOnline: (nick: string, users: string[]) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  currentRoomId: saved.currentRoomId,
  currentNick: saved.currentNick,
  messages: [],
  meta: null,
  loadingHistory: false,
  usersOnline: [],

  joinRoom: async (roomId, password, nick) => {
    const normalizedNick = nick.trim().toLowerCase();
    await api.joinRoom(roomId, password, normalizedNick);
    const [msgRes, onlineRes] = await Promise.all([
      api.getMessages(roomId, 1),
      api.getOnlineUsers(roomId),
    ]);
    saveSession(roomId, normalizedNick);
    set({
      currentRoomId: roomId,
      currentNick: normalizedNick,
      messages: msgRes.data.reverse(),
      meta: msgRes.meta,
      usersOnline: onlineRes.data,
    });
  },

  leaveRoom: async () => {
    const { currentRoomId, currentNick } = get();
    if (currentRoomId && currentNick) {
      await api.leaveRoom(currentRoomId, currentNick);
    }
    saveSession(null, null);
    set({
      currentRoomId: null,
      currentNick: null,
      messages: [],
      meta: null,
      usersOnline: [],
    });
  },

  loadHistory: async () => {
    const { currentRoomId, meta, messages } = get();
    if (!currentRoomId || (meta && !meta.has_more)) return;

    set({ loadingHistory: true });
    const nextPage = meta ? meta.current_page + 1 : 1;
    const res = await api.getMessages(currentRoomId, nextPage);
    set({
      messages: [...res.data.reverse(), ...messages],
      meta: res.meta,
      loadingHistory: false,
    });
  },

  addMessage: (message) => {
    set((s) => {
      const msgTime = new Date(message.created_at).getTime();
      const exists = s.messages.some(
        (m) =>
          m.nick === message.nick &&
          m.type === message.type &&
          Math.abs(new Date(m.created_at).getTime() - msgTime) < 1000
      );
      if (exists) return s;
      return { messages: [...s.messages, message] };
    });
  },

  setUsersOnline: (users) => set({ usersOnline: users }),

  addUserOnline: (_nick, users) => set({ usersOnline: users }),

  removeUserOnline: (_nick, users) => set({ usersOnline: users }),
}));
