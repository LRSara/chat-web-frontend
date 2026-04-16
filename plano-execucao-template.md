# [Nome descritivo da mudança]

> Autocontido. Sessão nova, sem histórico, executa do início ao fim.

## Contexto

[Estado atual do sistema na área afetada. Por que essa mudança é necessária.
Incluir evidência concreta: dados, fluxo real, código que comprova o problema.
Não descrever -- demonstrar.]

## Escopo

**Dentro:** [o que este plano faz]
**Fora:** [o que este plano NÃO faz -- previne expansão]

## Decisões

[Escolhas já tomadas e alternativas descartadas. Cada decisão com justificativa
e razão de descarte da alternativa.]

| Decisão | Justificativa | Alternativa descartada | Por que não |
|---------|---------------|----------------------|-------------|
| [usar X] | [razão concreta] | [usar Y] | [razão concreta] |

## Arquivos Para Ler

[Lista explícita. Ler TODOS antes de qualquer edição.]

- `caminho/arquivo` -- [por que ler: o que contém de relevante]

## Cobertura

[Identificar todas as camadas afetadas. Frontend e integração com backend
devem estar cobertos -- feature parcial não funciona.]

- Componentes: [quais componentes são criados/modificados]
- Hooks: [quais hooks customizados são afetados]
- Stores: [quais stores Zustand são afetados]
- API: [quais endpoints do backend são consumidos]
- WebSocket: [quais eventos são tratados]
- Testes: [quais cenários precisam ser cobertos]

## Implementação

[Organizar por componente, módulo ou item. Cada bloco é independente quando possível.
Usar APENAS APIs, métodos e sintaxe da versão atual da stack -- zero deprecações.]

### [Componente/Item 1]: [Nome]

**Arquivo:** `caminho/arquivo:linhas`
**Problema:** [o que está errado, com evidência]
**Risco:** [nenhum | baixo | médio -- com justificativa]

**Antes:**
```tsx
// código atual real, com linhas do arquivo
```

**Depois:**
```tsx
// código modificado, completo
```

**Verificação:**
```bash
[comando exato]
# Esperado: [output concreto]
```

---

### [Componente/Item 2]: [Nome]

[Mesmo padrão. Repetir quantas vezes necessário.]

---

## Verificação Final

```bash
# Type-check
npx tsc --noEmit

# Build
npx vite build

# Testes (se existirem)
npx vitest run

# Verificação funcional manual
# [passos concretos para testar no browser]
```

## Critérios de Pronto

- [ ] Cada artefato: existe, conteúdo real, importado e usado
- [ ] Type-check limpo (`npx tsc --noEmit`)
- [ ] Build limpo (`npx vite build`)
- [ ] Zero TODOs, placeholders ou stubs
- [ ] Acentuação correta em todo texto pt-BR visível
- [ ] [critério específico desta mudança]

## Desvios

- Bug pontual ou dependência faltante → auto-fix (max 3 tentativas)
- Conflito com decisão já tomada → PARAR e reportar
- Tarefa maior que o esperado → completar o possível, documentar o resto
