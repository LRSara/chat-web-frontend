# CLAUDE.md -- Chat Web Frontend

Chat em tempo real no browser. Frontend React que consome API REST e WebSocket do backend Laravel.

---

## Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| UI | React | 19 |
| Linguagem | TypeScript | 5.8+ |
| Build | Vite | 6 |
| Styling | Tailwind CSS | 4 |
| Componentes | shadcn/ui (Radix) | latest |
| Estado | Zustand | latest |
| WebSocket | Laravel Echo + Pusher | latest |

---

## Comandos

```bash
npm run dev          # Dev server (Vite)
npm run build        # Build produção (tsc -b && vite build)
npm run preview      # Preview do build
npx vitest           # Rodar testes
npx tsc --noEmit     # Type-check
npx vite build       # Verificar build limpo
```

---

## Estrutura de Diretórios

```
chat-web/
├── src/
│   ├── components/
│   │   ├── ui/          ← shadcn/ui (não modificar manualmente)
│   ├── hooks/           ← hooks customizados (useAudioRecorder, useWebSocket, etc.)
│   ├── lib/             ← utilitários (cn, api client, echo config)
│   ├── room/            ← domínio: salas (lista, criação, entrada)
│   ├── chat/            ← domínio: chat (mensagens, histórico, envio)
│   ├── upload/          ← domínio: upload (imagem, áudio)
│   ├── identity/        ← domínio: identidade (nick, sessão)
│   ├── App.tsx          ← roteamento principal
│   ├── main.tsx         ← entry point
│   └── index.css        ← Tailwind + tokens
├── index.html
├── vite.config.ts
├── tsconfig.json
├── components.json      ← shadcn/ui config
└── CLAUDE.md
```

Organização por domínio (room/, chat/, upload/, identity/), nunca por tipo genérico (pages/, services/).

---

## API Backend (Contrato)

Backend Laravel em `http://localhost:8000`. Proxy Vite: `/api` → `localhost:8000`.

### REST

| Método | URL | Body | Resposta |
|--------|-----|------|----------|
| POST | `/api/rooms` | `{ name, password }` | 201: `{ data: Room, message }` |
| GET | `/api/rooms` | - | `{ data: Room[] }` |
| POST | `/api/rooms/{id}/join` | `{ password, nick }` | `{ data: UserSession, message }` |
| POST | `/api/rooms/{id}/leave/{nick}` | - | `{ message }` |
| GET | `/api/rooms/{id}/messages?page=&per_page=` | - | `{ data: Message[], meta }` |
| POST | `/api/rooms/{id}/messages` | `{ nick, type, content?, file? }` | 201: `{ data: Message, message }` |
| POST | `/api/upload/image` | multipart `{ file }` | 201: `{ data: { path, url }, message }` |
| POST | `/api/upload/audio` | multipart `{ file }` | 201: `{ data: { path, url }, message }` |

### Códigos de Erro

| Código | Significado |
|--------|-------------|
| 403 | Senha incorreta |
| 404 | Sala não encontrada |
| 409 | Nick já em uso na sala |
| 413 | Arquivo excede limite |
| 422 | Validação falhou (erros em `errors`) |

### WebSocket (Laravel Reverb)

Canal: `room.{room_id}` (público, sem autenticação)

| Evento | Payload |
|--------|---------|
| `MessageSent` | `{ type, nick, content, file_url, created_at }` |
| `UserJoined` | `{ nick, users_online: string[] }` |
| `UserLeft` | `{ nick, users_online: string[] }` |

### Tipos

```typescript
interface Room {
  id: number;
  name: string;
  created_at: string;
  online_users_count: number;
}

interface Message {
  id: number;
  room_id: number;
  nick: string;
  type: "text" | "image" | "audio";
  content: string | null;
  file_path: string | null;
  created_at: string;
}

interface UserSession {
  id: number;
  room_id: number;
  nick: string;
  connected_at: string;
  disconnected_at: string | null;
}
```

### Limites Backend

| Regra | Valor |
|-------|-------|
| Imagem: formatos | jpg, jpeg, png, gif, webp |
| Imagem: tamanho máximo | 5MB |
| Áudio: formatos | webm, mp3, ogg |
| Áudio: duração máxima | 2 minutos (120s) |
| Paginação mensagens | 50 por vez, created_at DESC |
| Nick | 3-50 caracteres |
| Nome sala | 3-100 caracteres |

---

## Tailwind 4

### Erros que o Modelo Comete

| Errado (v3) | Correto (v4) |
|-------------|-------------|
| `shadow-sm` | `shadow-xs` |
| `shadow` | `shadow-sm` |
| `rounded-sm` | `rounded-xs` |
| `outline-none` | `outline-hidden` |
| `ring` (3px) | `ring-3` |
| `bg-[--var]` (colchetes) | `bg-(--var)` (parênteses) |
| `first:*:pt-0` | `*:first:pt-0` |
| `bg-opacity-50 bg-black` | `bg-black/50` |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| `tailwind.config.js` | `@theme` em CSS |

### Regras

- Tokens via `@theme` em `index.css`. NUNCA `tailwind.config.js`.
- Utilitários em linha: até 8 classes, uso único. Reutilizado 3+ vezes → extrair para CSS com tokens.
- `@apply` desencorajado. Preferir CSS explícito com variáveis do `@theme`.
- Zero inline styles. Zero `!important`. Zero cores hardcoded.
- Container queries para componentes reutilizáveis. Media queries só para layout de página.
- `clamp()` para tipografia e spacing fluidos.

---

## React 19

- `ref` como prop. NUNCA `forwardRef`.
- `use()` para contextos (substitui `useContext`). Pode ser condicional.
- `useActionState` para forms (substitui `onSubmit` + `useState` + `setIsPending`).
- React Compiler memoiza automaticamente. NUNCA `React.memo`, `useMemo` ou `useCallback` manual (exceto dependências de `useEffect` com controle preciso).
- `key={item.id}` (identificador estável). NUNCA `key={index}`.

### Padrões

- Estado mínimo. Derivados no render, não em `useState`.
- Early returns para conditional rendering. Sem ternários aninhados.
- Props tipadas, sem `any`. Tipos literais com `satisfies`.
- Extrair componente apenas quando reutilizado 3+ vezes OU complexidade interna justifica.

---

## shadcn/ui

- Componentes em `src/components/ui/`. Instalar via CLI (`npx shadcn add button`).
- Não modificar componentes shadcn manualmente. Estender via composição.
- `cn()` de `@/lib/utils` para merge de classes.
- Aliases: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`.

---

## Zustand

- Stores separados por domínio (room, chat, identity). NÃO store único.
- Selectors específicos para evitar re-render: `useStore((s) => s.user)`.
- Persist apenas para dados que sobrevivem refresh (sessão/nick).

---

## Princípios Estruturais (Invioláveis)

- **SSOT:** uma fonte de verdade por informação. Nunca duplicar estado ou lógica.
- **SRP:** uma responsabilidade por unidade. Se faz duas coisas, dividir.
- **SoC:** domínios coesos. Lógica de upload separada de UI de chat. WebSocket isolado da lógica de mensagens.
- **DRY:** reutilizar antes de criar. Pesquisar equivalente existente é obrigatório.
- **Desacoplamento:** hooks de WebSocket não conhecem componentes de UI. Serviço de mensagens não sabe que WebSocket existe.

---

## Idioma e Comunicação

Português do Brasil com acentuação correta em TODA string, label, placeholder, mensagem de erro e texto visível ao usuário. Nomes de variáveis e funções em inglês.

---

## Workflow

Fases: Explore > Plan > Gate > Implement > Review > Commit.

Planos autocontidos em `.md` seguindo `plano-execucao-template.md`. Implementação parte do `.md`, não de memória conversacional.

---

## Verificação

```
[ ] Mínimo de arquivos alterados?        [ ] Sem código parcial/morto?
[ ] Código existente reutilizado?         [ ] Apenas mudanças solicitadas?
[ ] End-to-end funcional?                 [ ] Acentuação correta em todo texto pt-BR?
[ ] Frontend-backend sincronizados?       [ ] Tailwind v4 correto?
```

---

## Commits

- Só commitar quando o usuário autorizar.
- Conventional Commits (feat, fix, refactor). Linha única, 2-3 frases curtas.
- Trailer: `Assisted-by: Claude Code`. NUNCA `Co-authored-by`.
- UM commit = UMA mudança lógica.

---

## Erros Mais Frequentes do Modelo

| Erro | Correção |
|------|----------|
| Gera `forwardRef` | `ref` como prop (React 19) |
| Gera `shadow-sm` (v3) | `shadow-xs` (v4) |
| Assume `border` gray | v4 usa `currentColor`, especificar cor |
| Enche de `React.memo`/`useMemo` | React Compiler faz automaticamente |
| `useContext` | `use()` |
| Estado derivado em useState | Derivar no render |
| Componente para 1 uso | Inline JSX |
| `key={index}` | `key={item.id}` |

---

## Checklist Pré-Commit

- [ ] Reutilizou componente existente?
- [ ] Componente novo é usado 3+ vezes? (senão, inline)
- [ ] Props tipadas, sem `any`?
- [ ] Estado mínimo, derivados no render?
- [ ] Sem `forwardRef`, sem `useEffect` para fetch, sem `as`?
- [ ] Tailwind: utilitários v4 corretos?
- [ ] Tailwind: cores via tokens `@theme`? Zero hardcoded?
- [ ] Sem memoização manual desnecessária?
- [ ] Acentuação correta em todo texto pt-BR?
- [ ] Build limpo (`npx vite build`)?
