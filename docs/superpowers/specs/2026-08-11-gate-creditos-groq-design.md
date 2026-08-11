# HubSabia — Gate de Login + Créditos Funcionais + Providers Groq/Gemini + Passe Visual

Data: 2026-08-11
Status: Aprovado ("bota pra torar")
Base: estabilização (fase 1) concluída; este é o escopo da fase 2a.

## 1. Objetivos (do usuário)

1. Chat IA de editais exige conta: anônimo vê modal "crie uma conta ou entre" e **não pode** usar a IA.
2. Contador de créditos **deve diminuir** (20 → 19 → …); em 0, bloqueia perguntas e **obriga** a usar chave própria.
3. Providers: **apenas Groq e Gemini** — usados com chave do sistema OU chave própria do usuário. OpenAI removido.
4. Passe de design nas telas: Home, Login/Registro, Chat (+ modais), Perfil — conciso/objetivo com toque criativo (não "morto").

## 2. Decisões

- Chat: **Groq ou Gemini** (sistema ou chave própria). Padrão: **Gemini**.
- Embeddings RAG: **apenas Gemini** (Groq não tem API de embeddings).
- Extração de pontos e resumo de edital (admin): Gemini (provider padrão).
- OpenAI removido por completo (código, chaves, UI). Campo `openai_api_key` renomeado para `groq_api_key` (chaves OpenAI existentes ficam órfãs — aceito, sem migração).
- Gate: `/api/chat/pergunta` e `/pergunta/stream` exigem `authMiddleware`; anônimo → 401.
- Créditos: `decrementCredit` retorna documento atualizado; resposta da API inclui `creditStatus.remaining` **pós-débito**; em 0 → `403 { code: 'CREDITS_EXHAUSTED' }`.
- Frontend: interceptor do axios preserva `status`/`code` no erro rejeitado (hoje converte 403 em "Acesso negado" genérico, quebrando os modais).
- Gate visual: shell do chat visível com overlay bloqueando input (sem redirecionar).

## 3. Backend

### 3.1 Providers

- **Novo** `backend/src/services/providers/groq.provider.js` (BaseProvider):
  - `GROQ_MODELS = { CHAT: 'llama-3.3-70b-versatile', FAST: 'llama-3.1-8b-instant' }`
  - `generateResponse`, `streamResponse` via `groq-sdk` (`client.chat.completions.create`, `stream: true`).
  - `validateApiKey` com chamada mínima.
  - `generateEmbedding`/`extractMainPoints`/`generateEditalSummary` → `{ success: false, errorCategory: 'INVALID_REQUEST', error: 'não suportado pelo Groq' }`.
  - `withTimeout` com `clearTimeout`; erros via `normalizeProviderError` (sanitizado).
- **Deletar** `backend/src/services/providers/openai.provider.js`.
- `provider-manager.js`: `providers = { gemini, groq }`; fallback bidirecional (Gemini ⇄ Groq) em TIMEOUT/RATE_LIMIT/QUOTA_EXCEEDED, **sem repassar userApiKey** do provider de origem; `getProvider` retorna `null` p/ inexistente; métodos com try/catch.
- `UsageLog` enum: adicionar `'groq'`.

### 3.2 Modelo e serviços

- `User.js`: `openai_api_key` → `groq_api_key` (select:false); `preferred_provider` enum `['gemini','groq']`, default `'gemini'`.
- `auth.service.js`:
  - `updateProviderConfig`: aceita `gemini` | `groq`; seta `usingOwnApiKey = { active, provider, configuredAt }`.
  - Todos os retornos (`registerUser`, `login`, `getUserById`, `updateUserProfile`, `listAllUsers`): `has_openai_key` → `has_groq_key`; selects `+openai_api_key` → `+groq_api_key`.
- `credits.service.js`: `decrementCredit(userId)` → `findOneAndUpdate(..., { new: true })` retornando doc atualizado (ou `null`); guarda de userId.

### 3.3 Rotas

- `chat.routes.js`:
  - `/pergunta` e `/pergunta/stream`: `authMiddleware` (sem caminho anônimo); selects `+gemini_api_key +groq_api_key`; `userApiKey` por provider (`gemini` → `gemini_api_key`, `groq` → `groq_api_key`).
  - `/pergunta`: resposta com `creditStatus` pós-débito: `remaining = updatedDoc?.remainingCredits ?? creditStatus.creditsRemaining - (usedAI ? 1 : 0)`.
  - 403 com `code: 'CREDITS_EXHAUSTED'` quando `canProceed === false`.
  - Remover import não usado (`User` continua usado; `UsageLog` segue).
- `auth.routes.js`: whitelists `/provider-config` e `/provider-preference` → `['gemini','groq']`.

### 3.4 Env/docs

- `backend/.env.example`: `OPENAI_API_KEY=` → `GROQ_API_KEY=` (comentada como opcional).
- `README.md`/`RESUMO.txt`: OpenAI → Groq nos providers.

## 4. Frontend

### 4.1 Interceptor (api.js)

Erro rejeitado preserva metadados:
```js
const err = new Error(message);
err.status = status;
err.code = error.response?.data?.code || null;
err.reason = error.response?.data?.reason || null;
return Promise.reject(err);
```
(para 403 e demais com corpo; 401 continua limpando storage).

### 4.2 Chat.vue — gate de login

- `v-if="!isLoggedIn"` sobre a área de input: overlay "Crie uma conta ou entre para usar o Chat IA" com CTAs **Entrar** (`/login`) e **Criar Conta** (`/login?tab=register`); input desabilitado.
- Qualquer erro `status === 401` na pergunta → re-exibe o gate (sessão expirada).
- Header público já existente (Entrar/Criar Conta) permanece.

### 4.3 Chat.vue — créditos

- Catch: `error.code === 'CREDITS_EXHAUSTED'` → `isExhaustedModalVisible = true`.
- Novo modal de créditos esgotados (padrão visual do PlanSelectionModal): "Você usou os 20 créditos de hoje" + CTA **"Usar minha chave de IA"** (`/perfil`) + nota de renovação automática (24h).
- Contador vivo: após resposta OK, `userData.remainingCredits = creditStatus.remaining`; `localStorage.user` atualizado; `CurrentPlanCard` reflete na hora.

### 4.4 ProfilePage.vue — chaves Groq/Gemini

- Formulário Gemini + formulário Groq (remove OpenAI).
- `hasOpenAIKey` → `hasGroqKey`.
- Seletor de provider preferido (Gemini/Groq) via `POST /auth/provider-preference` (existe no backend).

### 4.5 Passe de design (Home, Login, Chat, Perfil, modais)

Direção: limpo/objetivo com personalidade (gradientes sutis, hierarquia tipográfica forte, micro-interações; nada "morto"). Usar o skill `frontend-design` na execução. Escopo aprovado: Home, Login/Registro, Chat (+ modais de gate/créditos/planos), Perfil. Tema dark/light preservado.

## 5. Verificação

1. Anônimo em `/chat`: gate visível, input bloqueado; `POST /pergunta` sem token → 401.
2. Login: 20 créditos; pergunta → 19 (UI atualiza); … → 0 → modal de chave própria; pergunta bloqueada.
3. Configurar chave Groq no perfil → uso ilimitado (contador vira ∞).
4. Pergunta com provider Groq selecionado responde via Groq (modelo no metadata).
5. Chave OpenAI: não aparece mais na UI; `POST /provider-config` com `openai` → 400.
6. Build + `node --test` + conferência visual dark/light nas 5 telas.

## 6. Fora de escopo

Rate limiting, testes abrangentes, chat entre alunos, cobrança/planos pagos, Claude, migração de chaves OpenAI (órfãs).
