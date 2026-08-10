# HubSabia — Plano de Estabilização (Fase 1)

Data: 2026-08-10
Status: Aprovado pelo usuário ("bota pra funcionar")
Escopo: Corrigir bugs CRÍTICOS/ALTOS que quebram funcionalidades existentes; consolidar infra; NÃO inclui features em andamento (créditos/planos completos, Claude, rate limiting, testes automatizados, chat entre alunos).

## 1. Contexto

- Monorepo npm workspaces: `frontend/` (Vue 3 + Vite 5, porta 5173) e `backend/` (Express 4 + Mongoose 8 ESM, porta 3001).
- Deploy alvo: **Render (backend, `server.js`) + Vercel (frontend)**. `server-vercel.js` e `api/index.js` são mortos no deploy atual → remover.
- Último commit antes do snapshot: `cde8bba` "commit com 3 ias, não funcional ainda". Snapshot do trabalho em andamento: `e9cc02b`.
- Auditoria (2026-08-10): 6 scouts paralelos + leitura direta; ~100 achados consolidados (9 CRÍTICOS, 16 ALTOS, ~35 MÉDIOS, ~40 BAIXOS).

## 2. Decisões explícitas

- Provider padrão: **Gemini**; fallback **OpenAI** (apenas quando provider primário falha com TIMEOUT/RATE_LIMIT/QUOTA_EXCEEDED). Claude permanece desabilitado.
- Embeddings: Gemini-preferred com fallback local (Xenova). **Dimensão deve ser validada e registrada** por edital; buscas vetoriais filtram por dimensão.
- Créditos: correções apenas no que afeta comportamento atual (guard anônimo, reset diário, débito sem chamada de IA, ativação do bypass por chave própria). Fluxo completo de planos (UI, planAcknowledged ponta-a-ponta) fica para a fase 2.
- Sistema de créditos continua: limite diário 20, reset 24h, `usingOwnApiKey.active` → uso livre.
- Verificação manual dirigida (sem framework de testes nesta fase; `jest` não instalado e será resolvido).

## 3. Achados consolidados (referência)

### CRÍTICOS

| # | Problema | Local |
|---|---|---|
| C1 | Upload de edital sempre falha: `editalId` declarado `null` e nunca atribuído → `storeEditalChunks(null)` falha após todo o processamento | `backend/src/routes/edital.routes.js:50,253` + `rag.service.js:328` |
| C2 | Chat público/anônimo sempre 500: `checkAndConsumeCredit(req.user)` com `req.user` undefined → TypeError | `chat.routes.js:84,103` + `credits.service.js:24` |
| C3 | JWT_SECRET com fallback hardcoded público no código → forja de tokens (admin) | `auth.service.js:11` |
| C4 | Streaming Gemini quebrado: SDK v2.6 retorna `AsyncGenerator` direto; código acessa `stream.stream` (undefined) | `gemini.provider.js:154-159` |
| C5 | `/perfil` em tela branca: import de `updatePreferredProvider` inexistente em api.js (erro ESM link-time) | `ProfilePage.vue:274` |
| C6 | Wrapper `{success, data}` tratado como usuário em ProfilePage/Chat → corrompe `localStorage.user` → guard nega admin; modal de plano reaparece; plan card "Carregando..." | `ProfilePage.vue:328-334`, `Chat.vue:427-433` |
| C7 | Interceptor de erro: `JSON.parse(error.config.data)` em objeto/FormData → SyntaxError mascara erro real | `frontend/src/services/api.js:54` |
| C8 | Dois índices `text` na mesma coleção Edital → MongoDB rejeita criação | `backend/src/models/Edital.js:35-38` |
| C9 | XSS stored via `v-html` sem sanitização na resposta da IA (re-exibida no histórico) | `frontend/src/components/MessageBubble.vue:32` |

### ALTOS

- Senha de 1 caractere aceita via `/profile` (sem validação; `minlength` do schema aplica-se ao hash).
- Middleware auth sem try/catch em Express 4 (não captura async rejections) → CastError/hang com token forjado.
- Vazamento de mensagens cruas do provider ao cliente (pode incluir API key).
- Fallback OpenAI→Gemini repassa userApiKey OpenAI como chave Gemini → falha garantida.
- `/pergunta/stream`: sem RAG (contexto sempre `[]`) e sem checagem/consumo de crédito.
- Crédito debitado sem chamada de IA (sem chunks → `success:true` sem provider).
- Resumo de edital em background quebra: `providerManager`/`preferredProvider` indefinidos em edital.routes.
- Reset diário de créditos nunca dispara: `lastCreditReset` ausente de `req.user` (`getUserById`).
- Bypass de chave própria nunca ativado: `updateProviderConfig` grava chave mas não seta `usingOwnApiKey.active`.
- `npm test` quebra (jest não instalado) e `npm run create-admin` quebra (scripts/create-admin.js não existe).
- Credenciais de admin expostas no HTML público do Login.vue (`admin@hubsabia.com / admin123` — confirmadas no seed.js).
- Rota `/editais` duplicada em main.js (pública vs `UserEditais`) → UserEditais inalcançável; guard sombreado.
- ToastContainer duplicado (App.vue + DashboardLayout) → toasts em dobro.
- Botão "Ver PDF" nunca aparece (`edital.arquivo_url` vs resposta `arquivoUrl`).
- `/dashboard/editais` (lista) inexistente → navegação pós-exclusão/voltar do EditalView quebra.
- server-vercel.js: não monta `/logs/error`; CORS libera qualquer origem sem FRONTEND_URL; `/api/debug` expõe headers (Authorization); `uncaughtException` sem exit.
- errorHandler grava `req.body` (senhas/chaves) no ErrorLog; classes APIError/asyncHandler mortas (rotas respondem 500 manualmente).

### MÉDIOS selecionados

- `updateGeminiKey` → `POST /auth/gemini-key` inexistente (404).
- `getProvider('claude')` cai silenciosamente no Gemini (enum permite `claude`; provider desabilitado).
- Dimensões de embedding mistas (local 384 / Gemini 768) → `buscarGlobal` calcula cosseno entre vetores de tamanhos diferentes → 0.
- `estimateCost` bugado: `gpt-4o-mini` casa com `gpt-4o` (custo ~33× errado); preços desatualizados.
- `withTimeout` sem `clearTimeout` (timer mantém event loop 15-20s).
- `/feedback` sem auth — voto em qualquer logId; sem índice em `conversation_id`.
- `/historico` sem teto de `limit`; `parseInt` de não-numérico → NaN → 500.
- Erros 500 devolvem `error.message` cru em 5+ rotas.
- `seed.js`: schema User inline incompleto (usuários sem campos de crédito) + `MONGO_URI` divergente + senhas hardcoded.
- Conversa órfã criada antes do cheque de crédito (403 deixa conversa sem mensagens).
- `autoDiscoverModels` muta estado global via `setTimeout` no load → corrida com primeiras requests; API privada do SDK.
- `@google/genai@2.6.0` exige Node ≥20; projeto alvo Node 18 (documentar no README; manter por ora).
- Frontend: `checkHealth`/`updateProfile`/`getEditalChunks` exportados sem uso; filtro de status do ChatLogsPage ignorado pelo backend; ref `credits` não declarado no Chat.vue; Tailwind instalado e nunca usado; proxy do Vite redundante.
- Contratos de resposta inconsistentes entre `login`/`registerUser`/`getUserById`/`updateUserProfile`.

### BAIXOS (agrupados)

- Código morto: `isValidIFEmail`, `getUserByEmail`, `updateGeminiKey`, `User.autenticar`, `forceReset`, `mergeSmallChunks`, `rerankChunks`, `utils/chunkText.js` inteiro, `normalizeEditalData`, `validatePDF`, `EditalQuickView.vue`, `truncatedTitle`, `handleSearch`, `handleEdit` stub, `isChatUnlocked`, `tutorialSteps`.
- `console.log` DEBUG em produção (chat.routes, gemini.provider, Chat.vue, ProfilePage, Edital.vue).
- `edital.routes.js.bak` e `gemini.provider.js.bak` corrompidos (remover — gitignored, mas poluem o working tree).
- RESUMO.txt desatualizado (menciona Groq, vercel.json removido, Transformers.js, `create-admin` inexistente); README.md vazio (11 bytes); DEPLOY.md/COMECE_AQUI.md citados e inexistentes.
- `.env.example` sem OPENAI_API_KEY/ANTHROPIC_API_KEY; backend/.env com GROQ_API_KEY órfã.
- favicon.svg inexistente; FOUC no tema escuro; `<main>` aninhado; `confirm()`/`alert()` nativos; `relevance.toLowerCase()` sem guarda; `emit('success', response.data)` com data undefined; setInterval do upload não limpo no catch.
- `checkHealth` aponta `/health` (backend expõe `/api/health`).
- Prompt injection (conteúdo de edital interpolado sem delimitação) — mitigação mínima nesta fase.
- `test-credits.js` com assert sempre falso (`decrementCredit(user)` mock sem `_id`).

## 4. Design das correções

### 4.1 Camada de dados (backend/models)

- **Edital.js**: remover `index({ 'chunks.conteudo': 'text' })` (índice text duplicado — C8). Remover `index({ 'chunks.embedding': 1 })` (inútil para similaridade vetorial). Corrigir `buscarGlobal` para filtrar chunks pela **dimensão do embedding da query** (evita cosseno 384×768). Unificar threshold de similaridade em constante única (0.2). Escapar regex em `buscar`/`buscarChunksPorTexto`. Manter `chunks` subdocumento (sem refatoração de coleção nesta fase).
- **User.js**: `senha_hash` com `select: false`. Substituir virtual `senha` com `hashSync` por `pre('save')` async (ou manter virtual mas usar `hashSenha` async no service e remover o setter síncrono). Remover static `autenticar` morto. `usingOwnApiKey`/créditos permanecem `Object` simples (fase 2 define schema formal).
- **ChatLog.js**: adicionar `index({ conversation_id: 1 })`.
- **embedding.service.js**: `generateEmbedding` retorna também `dimension` (já retorna); validação de dimensão homogênea por lote em `generateEmbeddings`; usar `GEMINI_MODELS.EMBEDDING` dinâmico (não congelado no import).

### 4.2 Camada de serviços (backend/services)

- **auth.service.js**:
  - C3: remover fallback do JWT_SECRET — `if (!process.env.JWT_SECRET) throw` no load (fail-fast).
  - Incluir `lastCreditReset` no retorno de `getUserById` (conserta reset diário).
  - Validar senha nova ≥6 em `updateUserProfile`.
  - Unificar contrato de retorno: `login` passa a retornar `currentPlan`, `remainingCredits`, `usingOwnApiKey`, `planAcknowledged` (igual a `registerUser`/`getUserById`).
  - `registerUser`: normalizar email (`trim().toLowerCase()`) antes do findOne; tratar E11000 como "Email já cadastrado".
  - `login`: normalizar email no findOne (case-insensitive).
  - Remover `isValidIFEmail`, `getUserByEmail`, `updateGeminiKey` (mortos) — ou manter `isValidIFEmail` exportado para a fase 2 se desejado; decisão: remover.
- **credits.service.js**:
  - C2: `checkAndConsumeCredit(user)` — se `!user`, retorna `{ canProceed: true, anonymous: true }` (anônimo não passa por crédito).
  - Reset atômico já existente; garantir `lastCreditReset` persistido no próprio user quando faltar (o fix de getUserById cobre a origem).
  - `decrementCredit` retorna resultado (matchedCount) para auditoria.
  - Remover `forceReset` (morto) ou manter para debug; decisão: remover.
- **provider-manager.js**:
  - `getProvider('claude')` → em vez de fallback silencioso, retornar `null` e os chamadores tratam (ou lançar erro claro). Decisão: `getProvider` retorna o provider ou `null`; `generateResponse` com provider inexistente → `{ success:false, errorCategory:'PROVIDER_UNAVAILABLE' }`.
  - Fallback OpenAI→Gemini: **não repassar** `options.userApiKey` (chave OpenAI é inválida p/ Gemini) — usar chave do sistema.
  - `validateApiKey` com try/catch e retorno normalizado.
- **gemini.provider.js**:
  - C4: `streamResponse` — iterar o valor retornado por `generateContentStream()` diretamente (`for await (const chunk of stream)`), sem `.stream`.
  - `withTimeout`: `clearTimeout` no finally (sem timer órfão).
  - Corrigir mensagens de log DEBUG (`generateEmbedding`/`extractMainPoints`/`generateEditalSummary`).
  - `autoDiscoverModels`: manter (funciona), mas não bloquear; evitar dependência de `pageInternal` (usar `response.models` ou array quando disponível).
- **openai.provider.js / claude.provider.js**: manter; `generateResponse` OpenAI retorna erro quando conteúdo vazio (refusal) em vez de `success:true` com string vazia.
- **rag.service.js**:
  - `processQuestion` retorna `usedAI: false` no caso sem chunks → rota não debita.
  - Remover imports/configs mortos (`GEMINI_MODELS`, `keywordFallbackThreshold`, `minChunksForAnswer`).
  - Não propagar `responseResult.error` cru no throw (sanitizar categoria).

### 4.3 Camada de rotas (backend/routes)

- **chat.routes.js**:
  - Guarda `if (req.user)` em todo o fluxo de créditos (check e decrement) — C2.
  - Débito apenas quando `result.success && result.usedAI`.
  - Criar conversa **após** o cheque de crédito (evita conversa órfã em 403).
  - `/pergunta/stream`: consertar minimamente — exportar `retrieveContext(question, editalId, options)` em rag.service (retrieval sem geração) e usar os chunks retornados como `contextChunks` do `providerManager.streamResponse`; adicionar checagem de crédito (igual ao `/pergunta`) e `req.on('close')` para abortar geração. O frontend não consome streaming hoje, mas o endpoint não pode ficar quebrado e sem custo.
  - `/feedback`: exigir `authMiddleware` + verificar propriedade do log (usuario_id === req.user._id) para não-admin.
  - `/historico`: teto de `limit` (max 100), parse seguro (Number + fallback).
  - Remover `console.log` DEBUG; remover import `geminiService` não usado.
  - Tratar `conversationId`/`editalId` malformados → 400 (validação ObjectId) em vez de CastError 500.
- **edital.routes.js**:
  - C1: `editalId = edital._id` após o save.
  - Importar `providerManager` (e definir provider) para o resumo em background.
  - Error handler do multer (rota que trata `err.code === 'LIMIT_FILE_SIZE'` e `LIMIT_UNEXPECTED_FILE`).
  - Remover rotas duplicadas que viram `/api/edital/edital/:id` — rotas GET públicas ficam apenas no server.js; edital.routes mantém `POST /upload` e `DELETE /:id`.
  - `validatePDF` import não usado → remover.
- **auth.routes.js**: `/profile` valida senha; remover DEBUG logs; remover whitelist inconsistente (deixar `['gemini','openai']` coerente com provider-manager).
- **server.js**: manter rotas públicas `/api/editais`, `/api/edital/:id`, `/api/edital/:id/chunks` como fonte única; CORS sem entrada `undefined`; `/api/debug` restrito a `NODE_ENV !== 'production'`; `uncaughtException`/`unhandledRejection` → logar e `process.exit(1)` (estado indefinido é pior); remover `server-vercel.js`/`api/` do repo.
- **middleware/auth.middleware.js**: envolver `getUserById` em try/catch (400/401 em CastError; 500 em falha de DB) nos dois middlewares.
- **middleware/errorHandler.js**: não persistir `req.body` (gravar apenas `{ path, method, status }`); remover classes mortas `APIError`/`NotFoundError`/`ValidationError`/`UnauthorizedError`/`RateLimitError`/`asyncHandler` (as rotas tocadas passam a usar `next(err)` + errorHandler com formato uniforme).

### 4.4 Frontend

- **services/api.js**:
  - C7: corrigir `payload_recebido` — só serializar se `typeof error.config.data === 'string'`, senão omitir (nunca quebrar o interceptor).
  - **Exportar `updatePreferredProvider`** (rota `/auth/provider-preference` existe no backend) — conserta C5.
  - Remover `updateGeminiKey` (rota inexistente) e `checkHealth` (endpoint errado) ou corrigir; decisão: remover `updateGeminiKey`, corrigir `checkHealth` para `/health` ou remover; verificar callers (Chat.vue importa updateGeminiKey — remover do import).
- **ProfilePage.vue** (C5, C6): consumir `response.data` de `getCurrentUser()`; gravar o **objeto usuário real** no localStorage; remover import quebrado corrigido em api.js.
- **Chat.vue** (C6): `refreshUserData` usa `user.data`; remover import morto `updateGeminiKey`; remover ref `credits` não declarado (ou declarar); remover `isChatUnlocked`/`tutorialSteps` mortos; remover DEBUG logs.
- **MessageBubble.vue** (C9): sanitizar o conteúdo antes do `v-html` (função `escapeHtml` + transformação markdown segura, ou usar renderização textual com formatação limitada); guarda em `source.relevance`.
- **main.js**: remover rota duplicada `/editais` (manter pública `Editais`); **adicionar rota `/dashboard/editais`** (name `UserEditais`, `requiresAuth`) — o menu do DashboardLayout já aponta para `/editais`; alinhar menu para `/dashboard/editais`. Decisão: manter path público `/editais` e criar `/dashboard/editais` para o dashboard do usuário.
- **DashboardLayout.vue**: remover `ToastContainer` (fica só no App.vue); menu "Editais" → `/dashboard/editais`; item "Novo Edital" com query — remover duplicação ou ajustar `isActive`.
- **Login.vue**: remover credenciais expostas; `required` no campo nome.
- **Edital.vue**: `arquivoUrl` (camelCase) no botão "Ver PDF".
- **EditalView.vue**: navegação pós-exclusão/voltar → `/dashboard/editais` (user) ou `/admin/editais` (admin) — agora existe a rota.
- **EditalUploadModal.vue**: limpar `setInterval` no catch; `emit('success', response.data)` → `emit('success', response)` (se caller espera o body).

### 4.5 Segurança

- C3 (JWT fail-fast), C9 (XSS), credenciais expostas (Login.vue + seed.js — trocar senha padrão para senha gerada/aleatória e instruir troca), errorHandler sem payload sensível, `/api/debug` restrito, CORS sem wildcard.

### 4.6 Infra/scripts/docs

- Restaurar `backend/scripts/create-admin.js` (cria admin a partir de env vars ADMIN_EMAIL/ADMIN_PASSWORD com defaults seguros ou geração aleatória; usar models/User real).
- `seed.js`: reescrever usando `models/User.js` real (sem schema inline), ler senhas de env (sem `admin123` hardcoded), usar `MONGODB_URI` consistente.
- `npm test`: instalar `jest` + `supertest` e adicionar 1-2 testes de fumaça (health, auth) OU remover o script; decisão: **instalar jest + smoke tests mínimos** (health + register/login) — barato e valida o pipeline.
- Remover `server-vercel.js`, `api/index.js`, `*.bak`.
- `backend/scripts/test-credits.js`: corrigir (passar `_id` real) ou remover; decisão: corrigir para espelhar o contrato real.
- README.md reescrito (estrutura, como rodar, variáveis de ambiente); RESUMO.txt atualizado ou removido (decisão: atualizar para refletir estado real); `.env.example` alinhado (remover GROQ_API_KEY órfã se não usada; adicionar OPENAI_API_KEY/ANTHROPIC_API_KEY documentadas como opcionais).
- Verificar `@google/genai` engines (Node ≥20): documentar requisito Node 20+ no README.

## 5. Fluxos pós-correção (referência)

```
Chat /pergunta:
  optionalAuth → [se logado: checkCredit → 403 se esgotado] → processQuestion (RAG)
  → sem chunks: 200 "não encontrei", usedAI:false, sem débito
  → com chunks: provider (Gemini/OpenAI), erro sanitizado
  → [se logado e usedAI: decrementCredit atômico] → ChatLog + UsageLog

Upload edital (admin):
  multer (com error handler) → savePDF → extractText
  → extractMainPoints (enriquece) → chunks → embeddings (dimensão validada)
  → edital.chunks = [...] com edital._id → summary background (providerManager OK)
```

## 6. Verificação (critérios de aceite)

1. **Chat anônimo**: `POST /api/chat/pergunta` sem token → 200 com resposta IA.
2. **Upload**: admin sobe PDF → `chunkCount > 0`; `GET /api/edital/:id` e `/chunks` OK; sem rotas `/api/edital/edital/`.
3. **JWT**: boot sem `JWT_SECRET` falha com mensagem clara; token assinado com o secret antigo → 401.
4. **Stream**: `POST /api/chat/pergunta/stream` entrega tokens (ou endpoint desativado explicitamente se inviável nesta fase).
5. **/perfil**: renderiza dados reais; admin mantém `/admin/*` após refresh; modal de plano não reaparece indevidamente.
6. **Reset de créditos**: usuário com lastCreditReset 25h atrás → 20 créditos.
7. **XSS**: mensagem com `<script>`/`<img onerror>` não executa.
8. **Scripts**: `npm run create-admin` e `npm test` funcionam.
9. **Builds**: `npm run build` (frontend) OK; backend boota; `git status` limpo (sem arquivos novos inesperados).
10. Erros de API: formato uniforme `{ success:false, error }` sem `error.message` cru.

## 7. Fora de escopo (fase 2)

Fluxo completo de planos/créditos (UI, planAcknowledged ponta-a-ponta, cobrança), habilitar Claude, rate limiting (login/chat), testes automatizados abrangentes, chat entre alunos, remoção do Tailwind, migração de embeddings para Atlas Vector Search, prompt injection hardening profundo, schema formal de `usingOwnApiKey`.
