import type {
  Room,
  Message,
  UserSession,
  ApiResponse,
  PaginatedResponse,
  ApiError,
} from "./types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const error = (await res.json()) as ApiError;
      throw error;
    }
    const text = await res.text();
    throw { message: text || `Erro ${res.status}` } as ApiError;
  }

  return res.json() as Promise<T>;
}

export const api = {
  listRooms: () => request<ApiResponse<Room[]>>("/rooms"),

  createRoom: (name: string, password: string) =>
    request<ApiResponse<Room>>("/rooms", {
      method: "POST",
      body: JSON.stringify({ name, password }),
    }),

  joinRoom: (roomId: number, password: string, nick: string) =>
    request<ApiResponse<UserSession>>(`/rooms/${roomId}/join`, {
      method: "POST",
      body: JSON.stringify({ password, nick }),
    }),

  leaveRoom: (roomId: number, nick: string) =>
    request<ApiResponse<null>>(`/rooms/${roomId}/leave/${nick}`, {
      method: "POST",
    }),

  getOnlineUsers: (roomId: number) =>
    request<ApiResponse<string[]>>(`/rooms/${roomId}/online`),

  getMessages: (roomId: number, page = 1, perPage = 50) =>
    request<PaginatedResponse<Message>>(
      `/rooms/${roomId}/messages?page=${page}&per_page=${perPage}`
    ),

  sendMessage: (
    roomId: number,
    nick: string,
    type: string,
    content?: string,
    file?: File
  ) => {
    const formData = new FormData();
    formData.append("nick", nick);
    formData.append("type", type);
    if (content) formData.append("content", content);
    if (file) formData.append("file", file);

    return request<ApiResponse<Message>>(`/rooms/${roomId}/messages`, {
      method: "POST",
      body: formData,
    });
  },

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ApiResponse<{ path: string; url: string }>>(
      "/upload/image",
      { method: "POST", body: formData }
    );
  },

  uploadAudio: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ApiResponse<{ path: string; url: string }>>(
      "/upload/audio",
      { method: "POST", body: formData }
    );
  },
};
