# Plano de Execução -- Chat Web Frontend

> Autocontido. Sessão nova, sem histórico, executa do início ao fim.

## Contexto

Frontend React consome backend Laravel (API REST + WebSocket Reverb). Projeto já tem Vite + Tailwind 4 + shadcn/ui configurado. Falta: dependências (zustand, echo), tipagem da API, cliente HTTP, stores, hooks, componentes por domínio (room, chat, upload, identity) e roteamento.

Backend roda em `localhost:8000` (API) e `localhost:8080` (WebSocket Reverb). Proxy Vite já redireciona `/api` para o backend.

## Escopo

**Dentro:** Frontend completo -- listar/criar/entrar salas, chat de texto/imagem/áudio em tempo real, histórico paginado, usuários online.
**Fora:** Autenticação, testes unitários (separado), tema dark, deploy.

## Decisões

| Decisão | Justificativa | Alternativa descartada | Por que não |
|---------|---------------|----------------------|-------------|
| `fetch` nativo | Zero dependência extra, suficiente para REST simples | axios | Overhead para 8 endpoints |
| Zustand | Leve, sem boilerplate, persist built-in | Context + useReducer | Boilerplate excessivo para múltiplos domínios |
| Laravel Echo + Pusher | Backend usa Reverb (protocolo Pusher), sem alternativa real | Socket.IO puro | Protocolo incompatível com Reverb |
| shadcn/ui já configurado | Componentes acessíveis, Tailwind nativo | Chakra UI | Peso de runtime, menos integrado ao Tailwind 4 |
| Organização por domínio | SoC claro, cada feature independente | Por tipo (components/, services/) | Acoplamento, difícil de manter |
| Componentes shadcn via CLI | Código no projeto, editável | npm install component library | Não editável, dependência de versão |

## Arquivos Para Ler

- `CLAUDE.md` -- contrato da API, tipos, limites, eventos WebSocket
- `src/index.css` -- tokens de tema (cores, raios)
- `src/lib/utils.ts` -- função `cn()`
- `src/components/ui/button.tsx` -- exemplo de componente shadcn

## Cobertura

- Componentes: 12 novos (RoomList, RoomCard, CreateRoomForm, JoinRoomDialog, ChatView, MessageList, MessageBubble, MessageInput, AudioPlayer, ImagePreview, UserList, Notification)
- Hooks: 3 novos (useAudioRecorder, useWebSocket, useInfiniteScroll)
- Stores: 2 novos (useRoomStore, useChatStore)
- Lib: 2 novos (api.ts types + fetch client, echo.ts WebSocket config)
- Domínios: 4 (room/, chat/, upload/, identity/)
- shadcn/ui: 6 componentes adicionais (input, dialog, card, scroll-area, avatar, tooltip)

## Implementação

---

### Fase 1: Dependências

**Instalar:**
```bash
npm install zustand laravel-echo pusher-js
npm install -D @types/pusher-js
```

**shadcn/ui componentes:**
```bash
npx shadcn add input dialog card scroll-area avatar tooltip label
```

**Verificação:**
```bash
npx vite build
# Esperado: build sem erros
```

---

### Fase 2: Tipos e Cliente API

#### 2a: `src/lib/types.ts`

Tipos derivados do contrato backend:

```typescript
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
```

#### 2b: `src/lib/api.ts`

Cliente fetch com helpers tipados. Proxy Vite redireciona `/api` para backend.

```typescript
import type {
  Room, Message, UserSession,
  ApiResponse, PaginatedResponse, ApiError
} from "./types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error: ApiError = await res.json();
    throw error;
  }

  return res.json();
}

// Rooms
export const api = {
  listRooms: () =>
    request<ApiResponse<Room[]>>("/rooms"),

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

  getMessages: (roomId: number, page: number = 1, perPage: number = 50) =>
    request<PaginatedResponse<Message>>(
      `/rooms/${roomId}/messages?page=${page}&per_page=${perPage}`
    ),

  sendMessage: (roomId: number, nick: string, type: string, content?: string, file?: File) => {
    if (file) {
      const formData = new FormData();
      formData.append("nick", nick);
      formData.append("type", type);
      formData.append("file", file);
      if (content) formData.append("content", content);
      return request<ApiResponse<Message>>(`/rooms/${roomId}/messages`, {
        method: "POST",
        body: formData,
        headers: {}, // sem Content-Type para FormData
      });
    }
    return request<ApiResponse<Message>>(`/rooms/${roomId}/messages`, {
      method: "POST",
      body: JSON.stringify({ nick, type, content }),
    });
  },

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ApiResponse<{ path: string; url: string }>>("/upload/image", {
      method: "POST",
      body: formData,
      headers: {},
    });
  },

  uploadAudio: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<ApiResponse<{ path: string; url: string }>>("/upload/audio", {
      method: "POST",
      body: formData,
      headers: {},
    });
  },
};
```

**Verificação:**
```bash
npx tsc --noEmit
# Esperado: zero erros
```

---

### Fase 3: WebSocket

#### `src/lib/echo.ts`

```typescript
import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY ?? "app-key",
  wsHost: import.meta.env.VITE_REVERB_HOST ?? "localhost",
  wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
  wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
  forceTLS: false,
  enabledTransports: ["ws", "wss"],
});

export default echo;
```

#### `src/hooks/useWebSocket.ts`

Hook que escuta eventos de uma sala. Não conhece componentes de UI -- apenas atualiza stores.

```typescript
import { useEffect, useRef } from "react";
import echo from "@/lib/echo";
import type { MessageSentEvent, UserJoinedEvent, UserLeftEvent } from "@/lib/types";

interface UseWebSocketOptions {
  roomId: number | null;
  onMessage: (event: MessageSentEvent) => void;
  onUserJoined: (event: UserJoinedEvent) => void;
  onUserLeft: (event: UserLeftEvent) => void;
}

export function useWebSocket({ roomId, onMessage, onUserJoined, onUserLeft }: UseWebSocketOptions) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId) return;

    const channel = echo.channel(`room.${roomId}`);
    channelRef.current = channel;

    channel.listen("MessageSent", onMessage);
    channel.listen("UserJoined", onUserJoined);
    channel.listen("UserLeft", onUserLeft);

    return () => {
      echo.leaveChannel(`room.${roomId}`);
      channelRef.current = null;
    };
  }, [roomId, onMessage, onUserJoined, onUserLeft]);
}
```

---

### Fase 4: Stores Zustand

#### `src/room/useRoomStore.ts`

```typescript
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
    set((s) => ({ rooms: [res.data, ...s.rooms] }));
    return res.data;
  },
}));
```

#### `src/chat/useChatStore.ts`

Responsável por: sala atual, nick, mensagens, usuários online, histórico paginado.

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Message, PaginatedMeta } from "@/lib/types";
import { api } from "@/lib/api";

interface ChatState {
  // Sessão
  currentRoomId: number | null;
  currentNick: string | null;

  // Mensagens
  messages: Message[];
  meta: PaginatedMeta | null;
  loadingHistory: boolean;

  // Usuários online
  usersOnline: string[];

  // Ações
  joinRoom: (roomId: number, password: string, nick: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  loadHistory: () => Promise<void>;
  addMessage: (message: Message) => void;
  setUsersOnline: (users: string[]) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentRoomId: null,
      currentNick: null,
      messages: [],
      meta: null,
      loadingHistory: false,
      usersOnline: [],

      joinRoom: async (roomId, password, nick) => {
        await api.joinRoom(roomId, password, nick);
        const res = await api.getMessages(roomId, 1);
        // Backend retorna created_at DESC, inverter para exibir cronológico
        set({
          currentRoomId: roomId,
          currentNick: nick,
          messages: res.data.reverse(),
          meta: res.meta,
          usersOnline: [],
        });
      },

      leaveRoom: async () => {
        const { currentRoomId, currentNick } = get();
        if (currentRoomId && currentNick) {
          await api.leaveRoom(currentRoomId, currentNick);
        }
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
        set((s) => ({ messages: [...s.messages, message] }));
      },

      setUsersOnline: (users) => set({ usersOnline: users }),
    }),
    {
      name: "chat-session",
      partialize: (s) => ({
        currentRoomId: s.currentRoomId,
        currentNick: s.currentNick,
      }),
    }
  )
);
```

---

### Fase 5: Hook de Gravação de Áudio

#### `src/hooks/useAudioRecorder.ts`

Encapsula MediaRecorder. Limite: 2 minutos. Retorna: estado, iniciar, parar, blob, duração.

```typescript
import { useState, useRef, useCallback } from "react";

const MAX_DURATION_MS = 120_000; // 2 minutos

interface AudioRecorderState {
  isRecording: boolean;
  duration: number; // segundos
  blob: Blob | null;
  error: string | null;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    duration: 0,
    blob: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        setState((s) => ({ ...s, isRecording: false, blob }));
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start(100);
      startTimeRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState((s) => ({ ...s, duration: elapsed }));
        if (Date.now() - startTimeRef.current >= MAX_DURATION_MS) {
          stopRecording();
        }
      }, 100);

      setState({ isRecording: true, duration: 0, blob: null, error: null });
    } catch {
      setState((s) => ({ ...s, error: "Permissão de microfone negada" }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setState({ isRecording: false, duration: 0, blob: null, error: null });
  }, []);

  return { ...state, startRecording, stopRecording, reset };
}
```

---

### Fase 6: Hook de Scroll Infinito

#### `src/hooks/useInfiniteScroll.ts`

Detecta scroll no topo para carregar histórico.

```typescript
import { useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll(onLoadMore: () => void, loading: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || loading) return;

    if (el.scrollTop <= 50) {
      prevScrollHeightRef.current = el.scrollHeight;
      onLoadMore();
    }
  }, [onLoadMore, loading]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Manter posição após prepend de mensagens antigas
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !prevScrollHeightRef.current) return;
    const newScrollHeight = el.scrollHeight;
    el.scrollTop = newScrollHeight - prevScrollHeightRef.current;
    prevScrollHeightRef.current = 0;
  });

  // Scroll para o final na primeira carga
  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  return { containerRef, scrollToBottom };
}
```

---

### Fase 7: Domínio Room

#### 7a: `src/room/RoomList.tsx`

Lista salas. Cards com nome, quantidade de online, data. Botão criar sala.

```tsx
// Props: nenhuma (usa useRoomStore)
// Usa: RoomCard, CreateRoomForm, shadcn Card, Button
// useEffect chama fetchRooms no mount
// Loading: skeleton. Empty: mensagem "Nenhuma sala encontrada"
```

#### 7b: `src/room/RoomCard.tsx`

Card individual de sala.

```tsx
// Props: room: Room, onJoin: (room: Room) => void
// Mostra: nome, "X online", data criação
// Botão "Entrar" chama onJoin
```

#### 7c: `src/room/CreateRoomForm.tsx`

Formulário com shadcn Dialog + Input.

```tsx
// Props: onClose: () => void, onCreated: (room: Room) => void
// Campos: nome (3-100 chars), senha
// Validação client-side antes de enviar
// Erro de API exibido inline
```

#### 7d: `src/room/JoinRoomDialog.tsx`

Dialog para entrar em sala existente.

```tsx
// Props: room: Room, onClose: () => void, onJoined: () => void
// Campos: senha, nick (3-50 chars)
// Chama api.joinRoom. Erros: 403 "Senha incorreta", 409 "Nick em uso"
```

---

### Fase 8: Domínio Chat

#### 8a: `src/chat/ChatView.tsx`

Tela principal do chat. Orquestra tudo.

```tsx
// Usa: useChatStore, useWebSocket, MessageList, MessageInput, UserList
// Layout: sidebar (UserList) + área principal (MessageList + MessageInput)
// Botão "Sair da sala" no header
// WebSocket conecta no mount, desconecta no unmount/leave
```

#### 8b: `src/chat/MessageList.tsx`

Lista de mensagens com scroll infinito.

```tsx
// Usa: useChatStore, useInfiniteScroll, MessageBubble
// Scroll para topo carrega mais (loadHistory)
// Scroll automático para baixo em mensagem nova
// Loading spinner no topo ao carregar histórico
// Estado vazio: "Nenhuma mensagem ainda"
```

#### 8c: `src/chat/MessageBubble.tsx`

Renderiza uma mensagem individual.

```tsx
// Props: message: Message, isOwn: boolean
// text: renderiza texto
// image: renderiza ImagePreview (thumbnail clicável)
// audio: renderiza AudioPlayer
// Mostra: nick, horário formatado
// Alinhamento: próprias mensagens à direita, outras à esquerda
```

#### 8d: `src/chat/MessageInput.tsx`

Input de mensagem com botões de ação.

```tsx
// Input de texto + botão enviar
// Botão de imagem: abre file picker (accept: image/*)
// Botão de áudio: toggle gravação (useAudioRecorder)
// Preview de imagem antes de enviar (com botão cancelar)
// Preview de áudio antes de enviar (com player e botão cancelar)
// Validação: imagem <= 5MB, áudio <= 2min
// Estados: digitando, enviando, erro
```

#### 8e: `src/chat/AudioPlayer.tsx`

Player de áudio inline.

```tsx
// Props: src: string, autoPlay?: boolean
// Botão play/pause, barra de progresso, duração formatada
// Usa <audio> element com ref para controle
// Estilizado com Tailwind, sem dependência externa
```

#### 8f: `src/chat/ImagePreview.tsx`

Preview/visualização de imagem.

```tsx
// Props: src: string, alt?: string
// Modo thumbnail: tamanho fixo, object-cover, rounded
// Clique abre Dialog com imagem em tamanho real
// Loading state com skeleton
```

#### 8g: `src/chat/UserList.tsx`

Lista de usuários online na sala.

```tsx
// Props: users: string[]
// Usa shadcn Avatar (inicial do nick)
// "Você" destacado se nick == currentNick
// Scroll se muitos usuários
```

#### 8h: `src/chat/Notification.tsx`

Toast/notificação para entrada/saída de usuário.

```tsx
// Props: message: string, type: "join" | "leave"
// Aparece por 3s, desaparece com fade
// Stack de notificações (máximo 3 visíveis)
```

---

### Fase 9: Roteamento (App.tsx)

#### `src/App.tsx`

Duas "telas" sem router:

```tsx
// Estado: se currentRoomId existe no useChatStore → ChatView
// Senão → RoomList
// Transição: joinRoom sucesso → ChatView
// leaveRoom → RoomList
```

---

### Fase 10: Variáveis de Ambiente

#### `.env` (criar)

```env
VITE_REVERB_APP_KEY=app-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
```

---

## Arquivos Criados (Resumo)

```
src/
├── lib/
│   ├── types.ts          (Fase 2a)
│   ├── api.ts            (Fase 2b)
│   └── echo.ts           (Fase 3)
├── hooks/
│   ├── useWebSocket.ts   (Fase 3)
│   ├── useAudioRecorder.ts (Fase 5)
│   └── useInfiniteScroll.ts (Fase 6)
├── room/
│   ├── useRoomStore.ts   (Fase 4)
│   ├── RoomList.tsx      (Fase 7a)
│   ├── RoomCard.tsx      (Fase 7b)
│   ├── CreateRoomForm.tsx (Fase 7c)
│   └── JoinRoomDialog.tsx (Fase 7d)
├── chat/
│   ├── useChatStore.ts   (Fase 4)
│   ├── ChatView.tsx      (Fase 8a)
│   ├── MessageList.tsx   (Fase 8b)
│   ├── MessageBubble.tsx (Fase 8c)
│   ├── MessageInput.tsx  (Fase 8d)
│   ├── AudioPlayer.tsx   (Fase 8e)
│   ├── ImagePreview.tsx  (Fase 8f)
│   ├── UserList.tsx      (Fase 8g)
│   └── Notification.tsx  (Fase 8h)
├── components/ui/        (shadcn, Fase 1)
├── App.tsx               (Fase 9, modificado)
└── index.css             (já existe)
```

Total: ~25 arquivos novos/modificados.

---

## Verificação Final

```bash
# Type-check
npx tsc --noEmit

# Build
npx vite build

# Funcional (requer backend rodando)
# 1. Abrir http://localhost:5173
# 2. Criar sala "Teste" com senha "123"
# 3. Entrar na sala com nick "user1"
# 4. Enviar mensagem de texto → aparece instantaneamente
# 5. Abrir segunda aba, entrar com nick "user2"
# 6. user2 vê histórico de user1
# 7. user2 envia mensagem → user1 vê em tempo real
# 8. Enviar imagem (jpg < 5MB) → aparece inline, clicável
# 9. Gravar áudio (2s) → preview, enviar, player funciona
# 10. Sair e entrar novamente → histórico íntegro
```

## Critérios de Pronto

- [ ] Cada artefato: existe, conteúdo real, importado e usado
- [ ] `npx tsc --noEmit` zero erros
- [ ] `npx vite build` sucesso
- [ ] Zero TODOs, placeholders ou stubs
- [ ] Acentuação correta em todo texto pt-BR visível
- [ ] Responsivo: funciona em 375px (mobile) e desktop
- [ ] Zero inline styles
- [ ] Zero `forwardRef`, zero `useContext`
- [ ] Tailwind v4 correto (shadow-xs, outline-hidden, ring-3)
- [ ] WebSocket conecta e recebe eventos em tempo real
- [ ] Histórico paginado (scroll infinito no topo)
- [ ] Upload de imagem com validação (tipo, tamanho)
- [ ] Gravação de áudio com limite de 2 minutos
- [ ] Nick único por sala (erro 409 tratado)
- [ ] Senha incorreta (erro 403 tratado)

## Desvios

- Bug pontual ou dependência faltante → auto-fix (max 3 tentativas)
- Conflito com decisão já tomada → PARAR e reportar
- Tarefa maior que o esperado → completar o possível, documentar o resto
