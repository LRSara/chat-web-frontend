export interface Room {
  id: number;
  name: string;
  created_at: string;
  online_users_count: number;
}

export interface Message {
  id: number;
  room_id: number;
  nick: string;
  type: "text" | "image" | "audio";
  content: string | null;
  file_path: string | null;
  created_at: string;
}

export interface UserSession {
  id: number;
  room_id: number;
  nick: string;
  connected_at: string;
  disconnected_at: string | null;
}

export interface PaginatedMeta {
  current_page: number;
  per_page: number;
  has_more: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface MessageSentEvent {
  type: "text" | "image" | "audio";
  nick: string;
  content: string | null;
  file_url: string | null;
  created_at: string;
}

export interface UserJoinedEvent {
  nick: string;
  users_online: string[];
}

export interface UserLeftEvent {
  nick: string;
  users_online: string[];
}
