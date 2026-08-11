# HubSabia — Relatório Completo de Desenvolvimento

Data do relatório: 2026-08-11
Escopo: todo o trabalho realizado desde o início da parceria (auditoria, estabilização, features, UI/UX, segurança).
Base: monorepo npm workspaces (`frontend/` Vue 3 + Vite · `backend/` Node/Express + MongoDB).

---

## 1. Contexto inicial

- Último commit anterior: `cde8bba` — *"commit com 3 ias, não funcional ainda"* (estado conscientemente quebrado).
- Trabalho não commitado em andamento: sistema de créditos/planos + multi-provedor (Gemini/OpenAI/Claude).
- **Auditoria completa** (6 scouts paralelos + leitura direta): **~100 achados** — 9 CRÍTICOS, 16 ALTOS, ~35 MÉDIOS, ~40 BAIXOS.

### Achados CRÍTICOS originais (todos corrigidos)

| # | Problema | Local |
|---|---|---|
| C1 | Upload de edital sempre falhava: `editalId` nunca atribuído | edital.routes.js + rag.service.js |
| C2 | Chat anônimo sempre 500: `checkAndConsumeCredit(undefined)` | chat.routes.js + credits.service.js |
| C3 | JWT_SECRET com fallback hardcoded público (forja de tokens) | auth.service.js |
| C4 | Streaming Gemini quebrado (SDK v2.6: `stream.stream` inexistente) | gemini.provider.js |
| C5 | `/perfil` em tela branca: import de função inexistente | ProfilePage.vue |
| C6 | Wrapper `{success,data}` corrompia `localStorage.user` (admin perdia acesso) | ProfilePage/Chat |
| C7 | `JSON.parse` no interceptor do axios quebrava todo erro | api.js |
| C8 | Dois índices `text` na mesma coleção (Mongo rejeitava) | Edital.js |
| C9 | XSS stored via `v-html` sem sanitização | MessageBubble.vue |

---

## 2. Fase 1 — Estabilização (spec `2026-08-10-estabilizacao-design.md`)

Decisões: corrigir CRÍTICOS + ALTOS por camada; snapshot do trabalho em andamento (`e9cc02b`); deploy-alvo Render + Vercel (removido entrypoint serverless morto).

### Backend — dados/modelos
- **Edital.js**: índices inválidos removidos (`text` duplicado + multikey inútil), `buscarGlobal` com filtro de dimensão (384 vs 768), threshold de similaridade unificado (0.2), regex de busca escapada.
- **User.js**: `senha_hash` com `select: false`; hash assíncrono em `pre('validate')` (a validação roda antes do `pre('save')`); static `autenticar` removido.
- **ChatLog.js**: índice `conversation_id + createdAt`.
- **embedding.service.js**: modelo Gemini lido dinamicamente (não congelado no import); validação de dimensões mistas em lote.

### Backend — serviços
- **auth.service.js**: JWT **fail-fast** (sem fallback hardcoded — servidor recusa iniciar sem `JWT_SECRET`); emails normalizados (case-insensitive); senha ≥6 no `/profile`; contrato de resposta unificado (login retorna plano/créditos); `lastCreditReset` incluído (conserta o reset diário); `updateProviderConfig` ativa o bypass de chave própria; funções mortas removidas.
- **credits.service.js**: guarda para anônimos (não quebra mais); `decrementCredit` atômico retornando o documento; `forceReset` removido.
- **Providers**: stream Gemini corrigido (`for await` direto no AsyncGenerator); `withTimeout` sem timer órfão; mensagens de erro sanitizadas (`sanitizeProviderMessage` redige `sk-*`/`AIza*`); `getProvider` sem fallback silencioso; fallback OpenAI→Gemini sem repassar chave errada; `estimateCost` com longest-match.
- **rag.service.js**: flag `usedAI` (crédito só debitado quando há chamada de IA); `retrieveContext` exportado (streaming com RAG real); erros sanitizados.

### Backend — rotas/middleware
- **chat.routes.js**: créditos só para logados; conversa criada após cheque de crédito; streaming com RAG + abort no disconnect; `/feedback` autenticado com verificação de propriedade; `/historico` com teto (max 100); validação ObjectId; erros genéricos.
- **edital.routes.js**: **C1 corrigido** (`editalId = edital._id`); multer com error handler; resumo em background com `providerManager` importado; rotas GET duplicadas removidas (server.js é dono das públicas).
- **auth.middleware.js**: try/catch (token forjado → 401, sem pendurar request).
- **errorHandler.js**: sem persistir `req.body` (senhas/chaves); classes mortas removidas.
- **server.js**: CORS limpo; `/api/debug` só em dev; `uncaughtException` → exit(1).
- **Infra**: `server-vercel.js`/`api/`/`.bak` removidos; `create-admin.js` recriado; `seed.js` com modelo real e senhas via env; `test-credits.js` corrigido; testes com **node:test** (`npm test`, 7 testes).

### Frontend
- **api.js**: interceptor nunca mais lança (`JSON.parse` seguro); `updateGeminiKey` morto removido; `setPlanMode`/`updatePreferredProvider` exportados.
- **ProfilePage/Chat**: desembrulho do usuário (`response.data`); `localStorage.user` sempre o objeto real.
- **MessageBubble**: `escapeHtml` antes do markdown (XSS corrigido); guarda em `relevance`.
- **main.js**: rota `/editais` duplicada removida + `/dashboard/editais` criada.
- **DashboardLayout**: ToastContainer duplicado removido; **EditalView** com navegação correta por role.
- **Login.vue**: credenciais de admin expostas REMOVIDAS; nome com `required`.
- Docs alinhados (README, RESUMO, `.env.example`).

---

## 3. Fase 2 — Features (spec `2026-08-11-gate-creditos-groq-design.md`)

### 3.1 Providers: Groq + Gemini (OpenAI removido)
- **`groq.provider.js`** novo (BaseProvider): chat + streaming via `groq-sdk`; modelos `llama-3.3-70b-versatile` / `llama-3.1-8b-instant`; sem embeddings (Groq não oferece); validação de chave.
- **Provider-manager**: `{ gemini, groq }` com fallback bidirecional (sem repassar chave errada).
- **User.js**: `openai_api_key` → `groq_api_key`; enum `preferred_provider: ['gemini','groq']`.
- **Causa raiz do RAG "só pega trechos" encontrada**: `models/gemini-1.5-flash` **descontinuado** (404 na API v1beta). Fix: defaults `gemini-2.5-flash` + fallback de modelos (2.5 → 2.0 → flash-latest) em extração/resumo/chat; `parseJsonText` tolerante a fences; **todos os campos garantidos**; fallback do upload com primeira frase significativa. Extração verificada com todos os campos preenchidos.

### 3.2 Gate de login no chat
- Rotas `/pergunta` e `/pergunta/stream` exigem `authMiddleware` (anônimo → 401).
- Frontend: visitante vê o **gate overlay** ("Entre para usar o Chat IA" com Entrar/Criar Conta), sem input; sessão expirada re-exibe o gate.

### 3.3 Créditos funcionais
- **Contador vivo**: `creditStatus.remaining` **pós-débito** na resposta; card atualiza na hora (20 → 19 → …).
- Em 0 (e sem chave própria): **bloqueio local** no frontend (sem requisição) + aviso no fluxo de mensagens; backend 403 `CREDITS_EXHAUSTED` como salvaguarda.
- **Seletor de modo** (plano da página ⇄ chave própria): endpoint `POST /api/auth/plan-mode`; modal de planos vira seletor real ("Em uso"/alternar); perfil com radio-cards; chat usa o provider da chave ativa (não a preferência).

---

## 4. Fase 3 — UI/UX (iterações)

- **Modal de planos**: redesign minimalista (sem emojis/pílulas, cards limpos, botões alinhados com altura fixa 44px).
- **Ícones**: SVGs oficiais do Groq/Gemini (lobehub) via componente `ProviderLogo` (inline, herda `currentColor`); base global `.btn svg` 18px + `flex-shrink: 0` (ícones sem regra não estouravam mais em 300px).
- **Passe editorial**: Fraunces (display) + Manrope; hero do Home com gradiente mesh + grade + entrada escalonada; Login em painel dividido (marca + formulário).
- **Perfil redesenhado** (agente designer): edição real de nome/senha (`updateProfile`), label dinâmico do provider, reset legível, logos oficiais, seletor de modo.
- **Dashboards redesenhados** (2 designers paralelos): DashboardLayout, UserDashboard, UserEditais, EditalView, AlunosChat, AdminDashboard, UsersPage, ChatLogsPage — tom editorial tokenizado, dark/light. **"Novo Edital" virou sub-item do menu "Editais"** (admin).
- **Cards de edital maiores**: `minmax(340px)` + actions com wrap (rótulo "Excluir" nunca cortado).
- **Contraste de hover corrigido (causa raiz)**: `a:hover` sobrescrevia a cor de botões-âncora (`a:not(.btn):hover`); hovers legíveis nos dois temas.
- **Tema dark harmonizado**: tintas `primary/warning/danger/info/success`-50/100 mais suaves + texto `warning-700` claro (prazos 9.3:1, requisitos 9.6:1).
- **Sidebar ativa corrigida**: itens raiz (`/dashboard`) só no match exato (não ativa em `/dashboard/editais`).
- **Card de plano/creditos movido para a sidebar do chat** (sem sobrepor as mensagens); aviso de créditos no fluxo de mensagens; **footer global**: "Desenvolvido com muito café ☕ por Mateus, Vagner e Daiane".
- **messages-container** com altura limitada (60vh) e scroll interno.

---

## 5. Segurança (hardening — commit `62caff6`)

| Medida | Detalhe | Verificação |
|---|---|---|
| **helmet** | Headers: `X-Frame-Options: SAMEORIGIN`, `nosniff`, HSTS, `X-DNS-Prefetch-Control` | confirmado nos headers |
| **Rate limiting** | Login/registro 20/15min por IP · chat 30/min por IP · log de erro 60/min | 429 após a 20ª tentativa |
| **Magic-bytes do PDF** | Uploads rejeitam arquivos que não começam com `%PDF` | no handler |
| **npm audit fix** | 24 → 8 vulnerabilidades (express 4.22.2, mongoose 8.24.3, axios atualizado) | testes 7/7 + build |

Risco residual documentado (8): `vite` (dev-server), `@xenova/transformers`/`protobufjs` (modelo local fixo, sem entrada do usuário), `uuid` (moderate) — correção exigiria majors quebrados.

---

## 6. Testes e verificação

- `npm test --workspace=backend`: **7/7** (node:test) — guarda anônima de créditos, sanitização de mensagens, parse de JSON.
- `npm run build --workspace=frontend`: OK.
- Verificações ao vivo (browser + API): chat anônimo bloqueado; créditos 20→19→18→0→403; upload com chunks + embeddings; extração com todos os campos; Groq (`llama-3.3-70b-versatile`) e Gemini (`gemini-flash-latest`) respondendo; modais; dark/light; submenu admin; cards; contraste.

---

## 7. Estado atual

- Backend dev na porta 3001 (nodemon do usuário), frontend na 5173 (vite do usuário).
- Admin local: `admin@hubsabia.com` (senha via `npm run create-admin` — sem `ADMIN_PASSWORD`, gera aleatória).
- Dados de teste no banco local: editais de teste e usuários de dev (podem ser deletados pelo admin).

---

## 8. Pendências (próximas fases)

- Upgrade de deps quebradas (vite 5→8, transformers.js) para zerar o audit.
- Rate limit por usuário (além de IP).
- Testes automatizados de rotas (supertest) e E2E.
- Chat entre alunos (página stub "Em breve").
- Planos pagos/cobrança.
- Revisar CSP do helmet para produção (hoje desabilitada por causa do dev).

---

## 9. Anexo — Commits (da parceria, em ordem)

```
e9cc02b snapshot: trabalho em andamento (créditos/planos/multi-provedor)
47cc33e docs: spec de estabilização (fase 1)
2322245 docs: plano de implementação da estabilização
e115b4f chore: remover entrypoints serverless mortos + corrigir scripts
68d29e0 fix: models (índices, hash async, busca por dimensão)
aab54ec fix: auth service (JWT fail-fast, emails, contrato, bypass chave)
b75019a fix: providers (stream Gemini, erros sanitizados, node:test)
0c498e2 fix: credits (guarda anônima, decrement atômico)
43fe8a5 fix: rag (usedAI, retrieveContext, erros sanitizados)
6c88c94 fix: chat routes (créditos só logados, streaming RAG, feedback)
c1d3a3b fix: upload de edital (chunks com id real, rotas consolidadas)
ad2fbc8 fix: middleware/errorHandler/server (segurança, sem payload)
ab2dc31 fix: login seleciona senha_hash (select:false)
bec957a fix: api client (parse seguro, endpoint morto removido)
b78eb6e fix: profile/chat (unwrap do usuário, imports)
f26896e fix: frontend (XSS-safe, rotas, correções de UI)
211db35 docs: README/RESUMO/env alinhados
d8ac416 fix: log do embedding com modelo resolvido
d1da86d fix: hash em pre('validate')
057d845 ui: redesign minimalista do modal de planos
0c0dc89 ui: botões do modal alinhados
54b6ce7 docs: spec — gate, créditos, Groq/Gemini, visual
c1cc080 docs: plano de implementação da fase 2
98d29a2 feat: provider Groq + fallback bidirecional; groq_api_key
51aac6e feat: chat exige auth; créditos pós-débito
bf18acf feat: gate de login, contador vivo, modal de créditos, axios metadata
ad59f98 feat: perfil — chaves Groq/Gemini + preferência
b44e1fd style: passe editorial (Fraunces/Manrope, hero, login dividido)
7511c63 docs: groq nos guias/env
944e83e ui: messages-container com altura limitada
1d90f8c fix: contraste de hover (a:not(.btn))
cc9dc0c feat: perfil redesenhado + logos oficiais + ícones globais
dc33e4a feat: seletor de modo (créditos ⇄ chave), redesign dos dashboards
648bb86 fix: extração Gemini (modelos vigentes, parse robusto, campos completos)
3e60bbb ui: cards de edital maiores + actions com wrap
d5ac348 ui: tema dark harmonizado + botão remover arquivo visível
99d471b fix: sidebar ativa (match exato para raiz)
62caff6 feat: aviso de créditos no chat + hardening (helmet, rate limit, magic-bytes, audit)
a3894b0 ui: mensagem de créditos polida (título, ícone, CTA)
45b458d ui: mensagem do usuário permanece no chat ao bloquear
20d5483 ui: aviso de créditos em barra fixa
e988c6b ui: card de plano/creditos na sidebar (sem sobrepor mensagens)
c80083a feat: aviso de créditos no fluxo + footer dos devs
```

**Total: 43 commits de trabalho** (a partir do snapshot) + documentação em `docs/superpowers/specs/` e `docs/superpowers/plans/`.
