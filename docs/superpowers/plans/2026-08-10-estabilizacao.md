# HubSabia Estabilização — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o HubSabia funcional de ponta a ponta — corrigir os 9 CRÍTICOS + ALTOS que quebram chat anônimo, upload de edital, perfil, admin, segurança JWT/XSS — e consolidar infra (rotas, scripts, docs) para a fase de features.

**Architecture:** Backend Express 4 (ESM, Mongoose 8) com correções em camadas (dados → serviços → rotas → middleware); frontend Vue 3 com correções no cliente API, páginas e componentes; infra consolidada em `server.js` (Render) com `server-vercel.js`/`api/` removidos.

**Tech Stack:** Node ≥20 (documentado; `@google/genai@2.6.0` exige ≥20), Express 4, Mongoose 8, Vue 3, Vite 5, jest+supertest (smoke tests), bcrypt 6.

## Global Constraints

- Idioma de mensagens de API e UI: português.
- Provider padrão: Gemini; fallback OpenAI; Claude desabilitado.
- Créditos: limite diário 20; reset 24h; `usingOwnApiKey.active` → uso livre; anônimo não passa por créditos.
- Nunca expor `error.message` cru de provider/driver ao cliente; nunca persistir `req.body` (senhas/chaves) em logs.
- Rotas GET públicas de edital vivem APENAS em `server.js`; `edital.routes.js` tem upload/delete.
- Frontend: `localStorage.user` sempre contém o objeto usuário real (nunca o wrapper `{success,data}`).
- Commits frequentes e pequenos; mensagens em inglês.
- Verificação manual dirigida por bug (spec §6); smoke tests jest só para lógica pura sem DB.

---

### Task 1: Remover arquivos mortos e restaurar scripts quebrados

**Files:**
- Delete: `backend/src/server-vercel.js`, `backend/src/api/index.js` (e dir `backend/src/api/`), `backend/src/routes/edital.routes.js.bak`, `backend/src/services/providers/gemini.provider.js.bak`
- Create: `backend/scripts/create-admin.js`
- Modify: `backend/src/scripts/seed.js`, `backend/scripts/test-credits.js`, `backend/package.json`

**Interfaces:**
- Produces: `create-admin.js` (script standalone, usa `models/User.js`, `auth.service.hashSenha`), seed.js reescrito com `models/User.js`, `test-credits.js` corrigido para o contrato `decrementCredit(userId)`.

- [ ] **Step 1: Deletar arquivos mortos**
```bash
git rm backend/src/server-vercel.js backend/src/api/index.js backend/src/routes/edital.routes.js.bak backend/src/services/providers/gemini.provider.js.bak
rmdir backend/src/api 2>/dev/null || true
```
(no Windows: `git rm` para os 4; remover dir se vazio)

- [ ] **Step 2: Criar `backend/scripts/create-admin.js`**

```js
/**
 * Cria (ou atualiza a senha de) um usuário admin.
 * Uso: node scripts/create-admin.js
 * Env: ADMIN_EMAIL (default admin@hubsabia.com), ADMIN_PASSWORD (default: gerada aleatória e impressa)
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import { hashSenha } from "../src/services/auth.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const email = (process.env.ADMIN_EMAIL || "admin@hubsabia.com").trim().toLowerCase();
  let senha = process.env.ADMIN_PASSWORD;
  const generated = !senha;
  if (!senha) senha = Math.random().toString(36).slice(2, 10) + "Aa1!";
  const existing = await User.findOne({ email });
  if (existing) {
    existing.senha_hash = await hashSenha(senha);
    existing.role = "admin";
    await existing.save();
    console.log(`Admin atualizado: ${email}`);
  } else {
    await User.create({ email, role: "admin", senha_hash: await hashSenha(senha) });
    console.log(`Admin criado: ${email}`);
  }
  if (generated) console.log(`SENHA GERADA (troque no próximo login): ${senha}`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Reescrever `backend/src/scripts/seed.js`**

```js
/** Seed de demonstração: cria admin + usuário de teste com o modelo REAL.
 *  Env: SEED_ADMIN_PASSWORD, SEED_USER_PASSWORD (sem hardcode de credenciais). */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../models/User.js";
import { hashSenha } from "../services/auth.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const mk = (email, role) => User.updateOne(
    { email },
    { $setOnInsert: { email, role, nome: role === "admin" ? "Administrador" : "Usuário Teste" } },
    { upsert: true }
  );
  await mk("admin@hubsabia.com", "admin");
  await mk("user@hubsabia.com", "user");
  const admin = await User.findOne({ email: "admin@hubsabia.com" });
  const user = await User.findOne({ email: "user@hubsabia.com" });
  admin.senha_hash = await hashSenha(process.env.SEED_ADMIN_PASSWORD || "troque-esta-senha-1");
  user.senha_hash = await hashSenha(process.env.SEED_USER_PASSWORD || "troque-esta-senha-2");
  await Promise.all([admin.save(), user.save()]);
  console.log("Seed ok: admin@hubsabia.com / user@hubsabia.com (senhas via SEED_*_PASSWORD)");
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Corrigir `backend/scripts/test-credits.js`** — Teste 2 passa a respeitar o contrato real `decrementCredit(userId)` (findOneAndUpdate; não muta o objeto passado):
```js
  // Test 2: Decrement (contrato real: decrementCredit(userId) via findOneAndUpdate)
  const decResult = await creditsService.decrementCredit("000000000000000000000000");
  console.log("Test 2 (Decrement no-op p/ id inexistente):", !decResult || decResult.matchedCount === 0);
```
Ajustar o comentário do teste e remover o assert `user.remainingCredits === 4` (incorreto: a função não muta o objeto; o débito é no banco).

- [ ] **Step 5: Verificar sintaxe**
Run: `node --check backend/scripts/create-admin.js && node --check backend/src/scripts/seed.js && node --check backend/scripts/test-credits.js`
Expected: sem saída de erro.

- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "chore: remove dead serverless entrypoints and fix scripts"
```

---

### Task 2: Smoke tests jest (lógica pura, sem DB) + script test

**Files:**
- Modify: `backend/package.json` (devDeps jest+supertest; script `"test": "jest"` mantido)
- Create: `backend/test/credits.test.js`, `backend/test/provider-utils.test.js`

**Interfaces:**
- Consumes: `creditsService.checkAndConsumeCredit(user)` (Task 6 muda guarda de `undefined`), `normalizeProviderError`/`sanitizeProviderMessage` (Task 5).
- Produces: provas de que o guard anônimo e a sanitização funcionam.

- [ ] **Step 1: Instalar dependências de teste**
Run: `npm install --workspace=backend --save-dev jest supertest`
Expected: OK (ou, sem rede: remover `"test"` do package.json e pular Task 2 — registrar no commit).

- [ ] **Step 2: Escrever `backend/test/credits.test.js`**

```js
import { creditsService } from "../src/services/credits.service.js";

describe("creditsService.checkAndConsumeCredit", () => {
  test("anônimo (user undefined) passa sem crédito", async () => {
    const status = await creditsService.checkAndConsumeCredit(undefined);
    expect(status.canProceed).toBe(true);
    expect(status.anonymous).toBe(true);
  });

  test("usuário com créditos tem canProceed true", async () => {
    const user = { _id: "abc", remainingCredits: 5, lastCreditReset: new Date(), currentPlan: { id: "free" }, usingOwnApiKey: { active: false } };
    const status = await creditsService.checkAndConsumeCredit(user);
    expect(status.canProceed).toBe(true);
    expect(status.creditsRemaining).toBe(5);
  });

  test("usuário com 0 créditos e reset válido é bloqueado", async () => {
    const user = { _id: "abc", remainingCredits: 0, lastCreditReset: new Date(), currentPlan: { id: "free" }, usingOwnApiKey: { active: false } };
    const status = await creditsService.checkAndConsumeCredit(user);
    expect(status.canProceed).toBe(false);
    expect(status.reason).toBe("CREDITS_EXHAUSTED");
  });
});
```

- [ ] **Step 3: Escrever `backend/test/provider-utils.test.js`**

```js
import { sanitizeProviderMessage, normalizeProviderError } from "../src/utils/provider-utils.js";

describe("provider-utils sanitization", () => {
  test("redige API keys em mensagens de erro", () => {
    const msg = sanitizeProviderMessage("Incorrect API key provided: sk-abc123XYZ");
    expect(msg).not.toContain("sk-abc123XYZ");
    expect(msg).toContain("sk-***");
  });

  test("normalizeProviderError classifica rate limit", () => {
    const n = normalizeProviderError(new Error("429 Rate limit exceeded"), "gemini");
    expect(n.category).toBe("RATE_LIMIT");
  });
});
```

- [ ] **Step 4: Rodar testes (serão corrigidos nas Tasks 5-6; por ora registrar o estado)**
Run: `npm test --workspace=backend`
Expected: Task 2 em estado pendente até Tasks 5-6 (o guard anônimo só existe depois); commit só após Tasks 5-6 verdes, OU adiar este commit — ver Step 5.

- [ ] **Step 5: Commit (após Tasks 5-6 verdes)**
```bash
git add backend/test backend/package.json package-lock.json && git commit -m "test: add smoke tests for credits guard and provider error sanitization"
```

---

### Task 3: Modelos — Edital, User, ChatLog, embedding

**Files:**
- Modify: `backend/src/models/Edital.js`, `backend/src/models/User.js`, `backend/src/models/ChatLog.js`, `backend/src/services/embedding.service.js`

**Interfaces:**
- Consumes: `GEMINI_MODELS` de `./gemini.service.js` (referência viva, não valor congelado).
- Produces: `Edital.buscarGlobal(queryEmbedding, topK, dimension)` com filtro por dimensão; `User` sem virtual síncrono; `ChatLog` com índice em `conversation_id`.

- [ ] **Step 1: Edital.js — remover índices text/embedding inválidos**
Remover:
```js
editalSchema.index({ 'chunks.conteudo': 'text' });
editalSchema.index({ 'chunks.embedding': 1 });
```
Manter `titulo/descricao` text + `ano` + `createdAt`.

- [ ] **Step 2: Edital.js — `buscarGlobal` com filtro de dimensão + threshold único**

```js
const SIMILARITY_THRESHOLD = 0.2;

editalSchema.statics.buscarGlobal = async function (queryEmbedding, topK = 5) {
  const dimension = queryEmbedding?.length || 0;
  const editais = await this.find({ 'chunks.embedding': { $exists: true, $ne: null } });
  const todosChunks = [];
  for (const edital of editais) {
    for (const chunk of edital.chunks) {
      if (!chunk.embedding || chunk.embedding.length !== dimension) continue;
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (similarity >= SIMILARITY_THRESHOLD) {
        todosChunks.push({ ...chunk.toObject(), edital_id: edital._id, edital_titulo: edital.titulo, similarity });
      }
    }
  }
  return todosChunks.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
};
```
E em `buscarChunksPorSimilaridade`, trocar `const threshold = 0.3;` por `const threshold = SIMILARITY_THRESHOLD;`.

- [ ] **Step 3: Edital.js — escapar regex em `buscar` e `buscarChunksPorTexto`**

```js
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// em buscar(): { titulo: { $regex: escapeRegex(search), $options: 'i' } } (idem descricao)
// em buscarChunksPorTexto(): { 'chunks.conteudo': { $regex: escapeRegex(searchText), $options: 'i' } }
```

- [ ] **Step 4: User.js — `senha_hash` select:false + hash async**

```js
senha_hash: { type: String, required: [true, 'Senha é obrigatória'], select: false },
```
Remover o virtual `senha` com `hashSync`; adicionar:
```js
userSchema.virtual('senha').set(function (senha) { this._senha = senha; });
userSchema.pre('save', async function () {
  if (this._senha) this.senha_hash = await bcrypt.hash(this._senha, 10);
});
```
Remover static `autenticar`.

- [ ] **Step 5: ChatLog.js — índice de conversa**
```js
chatLogSchema.index({ conversation_id: 1, createdAt: 1 });
```

- [ ] **Step 6: embedding.service.js — modelo Gemini dinâmico + validação de dimensão**

Trocar `const GEMINI_EMBEDDING_MODEL = GEMINI_MODELS.EMBEDDING;` por leitura no call-site:
```js
const GEMINI_EMBEDDING_MODEL = () => GEMINI_MODELS.EMBEDDING;
// no generateEmbedding: const targetModel = model || (useGemini ? GEMINI_EMBEDDING_MODEL() : LOCAL_EMBEDDING_MODEL);
```
Em `generateEmbeddings`, após o batch, validar dimensão homogênea:
```js
const dims = new Set(results.filter((r) => r.success).map((r) => r.dimension));
if (dims.size > 1) console.warn(`[EMBEDDINGS] Dimensões mistas detectadas: ${[...dims].join(', ')}`);
```

- [ ] **Step 7: Verificação + commit**
Run: `node --check backend/src/models/Edital.js && node --check backend/src/models/User.js && node --check backend/src/models/ChatLog.js && node --check backend/src/services/embedding.service.js`
Expected: sem erro.
```bash
git add backend/src/models backend/src/services/embedding.service.js && git commit -m "fix: models — valid indexes, async password hash, dimension-aware vector search"
```

---

### Task 4: auth.service.js — JWT fail-fast, contratos, validações

**Files:**
- Modify: `backend/src/services/auth.service.js`

**Interfaces:**
- Produces: `login()` retorna user com `currentPlan`, `remainingCredits`, `usingOwnApiKey`, `planAcknowledged`; `getUserById` inclui `lastCreditReset`; remove `isValidIFEmail`, `getUserByEmail`, `updateGeminiKey` (verificar imports em `auth.routes.js` antes de remover).

- [ ] **Step 1: Ler imports/uso de `auth.routes.js` para remoção segura**
Run: `grep -n "isValidIFEmail\|getUserByEmail\|updateGeminiKey" backend/src/routes/auth.routes.js`
Expected: nenhum uso → remover funções com segurança.

- [ ] **Step 2: JWT fail-fast (sem fallback hardcoded)**

```js
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "hubsabia-secret-key-change-in-production") {
    throw new Error("JWT_SECRET não configurado. Defina em backend/.env (openssl rand -base64 32).");
  }
  return secret;
};
```
Usar `getJwtSecret()` em `generateToken` e `verifyToken`; remover a constante `JWT_SECRET` com fallback.

- [ ] **Step 3: Normalizar email em registerUser/login**
```js
const normalizedEmail = email.trim().toLowerCase();
// registerUser: const existingUser = await User.findOne({ email: normalizedEmail }); ... email: normalizedEmail
// login: const user = await User.findOne({ email: email.trim().toLowerCase() })
// tratar E11000 no save: catch (e) { if (e.code === 11000) throw new Error('Email já cadastrado'); throw e; }
```

- [ ] **Step 4: Validar senha em updateUserProfile + incluir lastCreditReset e contrato completo**
```js
if (senha !== undefined && (!senha || senha.length < 6)) throw new Error("Senha deve ter pelo menos 6 caracteres");
// no retorno de getUserById/login/registerUser/updateUserProfile/listAllUsers: incluir lastCreditReset
```

- [ ] **Step 5: Remover funções mortas** (`isValidIFEmail`, `getUserByEmail`, `updateGeminiKey`) e seus comentários.

- [ ] **Step 6: Verificação + commit**
Run: `node --check backend/src/services/auth.service.js`
```bash
git add backend/src/services/auth.service.js && git commit -m "fix: auth service — fail-fast JWT secret, normalized emails, unified user contract"
```

---

### Task 5: Provider layer — stream, sanitização, fallback, withTimeout

**Files:**
- Modify: `backend/src/services/provider-manager.js`, `backend/src/services/providers/gemini.provider.js`, `backend/src/services/providers/openai.provider.js`, `backend/src/utils/provider-utils.js`, `backend/src/services/providers/base.provider.js`

**Interfaces:**
- Consumes: `normalizeProviderError` (sanitizada), `getProvider(name)` retorna `null` p/ provider inexistente.
- Produces: `sanitizeProviderMessage(msg)` exportada; `providerManager.getProvider('claude')` → `null`; stream Gemini funcional.

- [ ] **Step 1: provider-utils.js — sanitizar mensagens**

```js
export function sanitizeProviderMessage(message) {
  if (typeof message !== "string") return String(message || "Erro desconhecido");
  return message
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "sk-***")
    .replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, "AIza***")
    .replace(/\bBearer\s+[A-Za-z0-9._-]{10,}\b/gi, "Bearer ***");
}
```
Aplicar em `normalizeProviderError`: `const message = sanitizeProviderMessage(error.message || error.toString());`

- [ ] **Step 2: provider-manager.js — getProvider null + fallback sem userApiKey**

```js
getProvider(name = null) {
  const providerName = name || this.defaultProvider;
  return this.providers[providerName] || null;
}
```
Em `generateResponse`: se `!selectedProvider` → `return { success: false, error: "Provider não suportado", errorCategory: "PROVIDER_UNAVAILABLE" }`.
No fallback OpenAI→Gemini, descartar a userApiKey:
```js
const { userApiKey: _drop, ...fallbackOptions } = options;
return this.getProvider("gemini").generateResponse(question, contextChunks, { ...fallbackOptions, provider: "gemini" });
```
Nos demais métodos (`generateEmbedding`, `extractMainPoints`, `generateEditalSummary`, `validateApiKey`): tratar `!provider` com try/catch e retorno normalizado.

- [ ] **Step 3: gemini.provider.js — corrigir stream (C4)**

```js
  async *streamResponse(question, contextChunks = [], options = {}) {
    const { userApiKey = null, model = DEFAULT_MODEL } = options;
    try {
      const client = this.#getClient(userApiKey);
      const contextText = contextChunks.length > 0
        ? contextChunks.map((c, i) => `[Trecho ${i + 1}]\n${c.conteudo}`).join("\n\n")
        : "Sem contexto.";
      const prompt = `Responda de forma amigável e direta: ${question}\n\nContexto:\n${contextText}`;

      const stream = await client.models.generateContentStream({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      // @google/genai@2.6.0: o valor aguardado JÁ É o AsyncGenerator — iterar direto (sem .stream)
      for await (const chunk of stream) {
        const text = getTextFromResponse(chunk);
        if (text) yield { done: false, text };
      }
      yield { done: true, metadata: { model, provider: "gemini" } };
    } catch (error) {
      const normalized = normalizeProviderError(error, "gemini");
      yield { done: true, error: normalized.originalMessage, errorCategory: normalized.category };
    }
  }
```

- [ ] **Step 4: gemini.provider.js — withTimeout sem timer órfão**

```js
const withTimeout = (promise, timeoutMs = REQUEST_TIMEOUT_MS) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};
```
Aplicar o mesmo em openai.provider.js.

- [ ] **Step 5: gemini.provider.js — logs DEBUG e categoria 503**

- Corrigir as 3 mensagens `".generateResponse:"` nos catch de `generateEmbedding`/`extractMainPoints`/`generateEditalSummary` para o nome real do método e remover `fullError`.
- Após esgotar modelos 503: `errorCategory: 'RATE_LIMIT'` (em vez de `QUOTA_EXCEEDED`).
- `autoDiscoverModels`: manter, mas ler lista de `response.models`/`response.pageInternal` com fallback (já faz); sem mudança funcional.

- [ ] **Step 6: openai.provider.js — sucesso com resposta vazia vira erro**

```js
const content = result.choices[0]?.message?.content || "";
if (!content) return { success: false, error: "O modelo retornou resposta vazia", errorCategory: "INVALID_REQUEST" };
```

- [ ] **Step 7: base.provider.js — streamResponse como generator**
```js
async *streamResponse(question, contextChunks, options) { throw new Error("Method streamResponse must be implemented"); }
```

- [ ] **Step 8: Verificação + commit**
Run: `node --check` nos 5 arquivos + `npm test --workspace=backend` (provider-utils.test.js deve passar agora)
```bash
git add backend/src/services backend/src/utils && git commit -m "fix: providers — working Gemini stream, sanitized errors, no silent fallback"
```

---

### Task 6: credits.service.js — guarda anônimo + contrato de decrement

**Files:**
- Modify: `backend/src/services/credits.service.js`

**Interfaces:**
- Produces: `checkAndConsumeCredit(undefined)` → `{ canProceed: true, anonymous: true }`; `decrementCredit(userId)` retorna resultado do update.

- [ ] **Step 1: Guarda anônimo no check**

```js
async checkAndConsumeCredit(user) {
  if (!user || !user._id) {
    return { canProceed: true, anonymous: true, creditsRemaining: null, resetIn: 0, reason: null, currentPlan: null, usingOwnKey: false };
  }
  const userData = this._ensureUserFields(user);
  // ...restante inalterado
```
`_ensureUserFields(user)` permanece exigindo `user` — só é chamado após a guarda.

- [ ] **Step 2: decrementCredit retorna resultado**

```js
async decrementCredit(userId) {
  if (!userId) return { matchedCount: 0, modifiedCount: 0 };
  return User.findOneAndUpdate(
    { _id: userId, 'usingOwnApiKey.active': { $ne: true }, remainingCredits: { $gt: 0 } },
    { $inc: { remainingCredits: -1 } }
  );
}
```

- [ ] **Step 3: Remover `forceReset`** (morto).

- [ ] **Step 4: Verificação + commit**
Run: `node --check backend/src/services/credits.service.js && npm test --workspace=backend`
Expected: credits.test.js verde.
```bash
git add backend/src/services/credits.service.js && git commit -m "fix: credits — anonymous bypass, atomic decrement result"
```

---

### Task 7: rag.service.js — usedAI, retrieveContext, sanitização

**Files:**
- Modify: `backend/src/services/rag.service.js`

**Interfaces:**
- Produces: `processQuestion` retorna `metadata.usedAI` (bool) e `metadata.errorCategory`; exporta `retrieveContext(question, editalId, options)` → `{ chunks, keywords }`; remove import morto `GEMINI_MODELS` e configs `keywordFallbackThreshold`/`minChunksForAnswer`.

- [ ] **Step 1: `usedAI` no retorno**

No caminho sem chunks:
```js
return { success: true, response: "...", sources: [], metadata: { processingTime, chunksRetrieved: 0, usedAI: false } };
```
No caminho com resposta:
```js
metadata: { ..., usedAI: true }
```
No catch: `metadata: { ..., usedAI: false, errorCategory: ... }`.

- [ ] **Step 2: Exportar `retrieveContext`**

```js
export async function retrieveContext(question, editalId = null, options = {}) {
  const expandedQueries = generateSearchQueries(question);
  let chunks = await retrieveRelevantChunksHybrid(question, expandedQueries, editalId, options);
  if (chunks.length === 0) chunks = await retrieveByKeywords(expandedQueries.keywords, editalId);
  return { chunks, keywords: expandedQueries.keywords };
}
```
Adicionar ao export default.

- [ ] **Step 3: Não propagar erro cru do provider**

```js
if (!responseResult.success) {
  const err = new Error("Falha ao gerar resposta com o provedor de IA");
  err.errorCategory = responseResult.errorCategory || "UNKNOWN";
  throw err;
}
```
No catch, incluir `errorCategory` no metadata.

- [ ] **Step 4: Remover mortos** — import `GEMINI_MODELS` (se não usado), `keywordFallbackThreshold`, `minChunksForAnswer` de `RAG_CONFIG`.

- [ ] **Step 5: Verificação + commit**
Run: `node --check backend/src/services/rag.service.js`
```bash
git add backend/src/services/rag.service.js && git commit -m "fix: rag — usedAI flag, retrieveContext export, sanitized provider errors"
```

---

### Task 8: chat.routes.js — crédito correto, stream com RAG, feedback com auth

**Files:**
- Modify: `backend/src/routes/chat.routes.js`

**Interfaces:**
- Consumes: `retrieveContext` (Task 7), `creditsService` guard anônimo (Task 6), `providerManager.streamResponse` (Task 5).
- Produces: `/pergunta` sem 500 para anônimos; `/pergunta/stream` com RAG + crédito + abort em disconnect; `/feedback` autenticado; `/historico` com teto.

- [ ] **Step 1: `/pergunta` — guarda de crédito e débito condicional**

```js
// Após o bloco do req.user (conversa):
let creditStatus = null;
if (req.user) {
  creditStatus = await creditsService.checkAndConsumeCredit(req.user);
  if (!creditStatus.canProceed) {
    return res.status(403).json({ success: false, error: "Créditos esgotados", reason: creditStatus.reason, resetIn: creditStatus.resetIn });
  }
}
// Mover a criação de conversa PARA DEPOIS deste cheque (evita conversa órfã em 403).
```
Débito:
```js
if (req.user && result.success && result.metadata?.usedAI !== false) {
  await creditsService.decrementCredit(req.user._id);
}
```
Retornar `creditStatus` (quando logado) na resposta JSON para o frontend:
```js
data: { ..., creditStatus: req.user ? { remaining: creditStatus.creditsRemaining, resetIn: creditStatus.resetIn, plan: creditStatus.currentPlan, usingOwnKey: creditStatus.usingOwnKey } : null }
```
Remover `decrementCredit(req.user._id)` incondicional.

- [ ] **Step 2: `/pergunta/stream` — RAG + crédito + disconnect**

```js
// Cheque de crédito (igual ao /pergunta, só logado)
// Depois:
const { chunks } = await retrieveContext(pergunta, editalId, { userApiKey, provider: preferredProvider });
res.setHeader(...); // SSE
const stream = providerManager.streamResponse(pergunta, chunks, { userApiKey, provider: preferredProvider });
let aborted = false;
req.on("close", () => { aborted = true; });
for await (const chunk of stream) {
  if (aborted) break;
  ... (mesmo loop atual)
}
// Débito se logado e fullResponse
```
Remover `editalId ? [] : []`.

- [ ] **Step 3: `/feedback` — auth + propriedade**

```js
router.post("/feedback", authMiddleware, async (req, res) => {
  const log = await ChatLog.findById(logId);
  if (!log) return res.status(404).json({ success: false, error: "Log de interação não encontrado" });
  if (req.user.role !== "admin" && log.usuario_id?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: "Você só pode avaliar suas próprias interações" });
  }
  await ChatLog.findByIdAndUpdate(logId, { feedback }, { new: true });
  ...
});
```

- [ ] **Step 4: `/historico` — parse seguro + teto**
```js
const limit = Math.min(Math.max(parseInt(limitRaw) || 20, 1), 100);
const offset = Math.max(parseInt(offsetRaw) || 0, 0);
```

- [ ] **Step 5: Validação ObjectId em `/pergunta` (body)**
```js
import mongoose from "mongoose";
const isValidId = (v) => mongoose.Types.ObjectId.isValid(v);
if (conversation_id && !isValidId(conversation_id)) return res.status(400).json({ success: false, error: "conversationId inválido" });
if (editalId && !isValidId(editalId)) return res.status(400).json({ success: false, error: "editalId inválido" });
```

- [ ] **Step 6: Limpeza** — remover `import geminiService`, `console.log` DEBUG, selects `+claude_api_key` (deixar `+gemini_api_key +openai_api_key`), bloco morto `if (req.user)` em `/sugestoes` (rota sem auth → remover o bloco inteiro).

- [ ] **Step 7: Erros uniformes** — nos catch, trocar `res.status(500).json({ success: false, error: error.message })` por `next(error)` nas 5 rotas (errorHandler responde genérico e loga).

- [ ] **Step 8: Verificação + commit**
Run: `node --check backend/src/routes/chat.routes.js`
```bash
git add backend/src/routes/chat.routes.js && git commit -m "fix: chat routes — credits for logged users only, RAG streaming, authed feedback"
```

---

### Task 9: edital.routes.js — upload funcional (C1) e rotas consolidadas

**Files:**
- Modify: `backend/src/routes/edital.routes.js`

**Interfaces:**
- Consumes: `providerManager` (Task 5).
- Produces: `POST /api/edital/upload` grava chunks com `edital._id`; remove GETs duplicados (server.js é dono); remove `normalizeEditalData`, `validatePDF` import.

- [ ] **Step 1: Corrigir C1 — atribuir `editalId`**

Após `const edital = new Edital(editalData); await edital.save();`:
```js
editalId = edital._id; // CORRIGE: antes ficava null
```
E na chamada `storeEditalChunks(editalId, chunks, embeddingsToUse)` — agora com valor real.

- [ ] **Step 2: Importar providerManager e definir provider do resumo**

```js
import providerManager from "../services/provider-manager.js";
```
No `generateSummary`:
```js
const result = await providerManager.generateEditalSummary(cleanedText, { userApiKey, provider: "gemini" });
```
(substituir `preferredProvider` indefinido por `"gemini"`.)

- [ ] **Step 3: Error handler do multer**

```js
const uploadMiddleware = (req, res, next) => {
  upload.single("arquivo")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ success: false, error: "Arquivo muito grande. Máximo de 10MB." });
      return res.status(400).json({ success: false, error: err.message || "Falha no upload" });
    }
    next();
  });
};
router.post("/upload", authMiddleware, isAdmin, uploadMiddleware, async (req, res) => { ... });
```

- [ ] **Step 4: Remover rotas GET duplicadas** — `router.get("/")`, `router.get("/edital/:id")`, `router.get("/edital/:id/chunks")` e `normalizeEditalData` (server.js já expõe `/api/editais`, `/api/edital/:id`, `/api/edital/:id/chunks`).

- [ ] **Step 5: Remover import `validatePDF` não usado** e logs `console.log` de debug do fluxo de upload (manter os de erro).

- [ ] **Step 6: Erros uniformes** — catch do upload: `next(error)` (errorHandler responde genérico).

- [ ] **Step 7: Verificação + commit**
Run: `node --check backend/src/routes/edital.routes.js`
```bash
git add backend/src/routes/edital.routes.js && git commit -m "fix: edital upload stores chunks with real id, consolidated routes"
```

---

### Task 10: auth.routes.js + middleware + errorHandler + server.js

**Files:**
- Modify: `backend/src/routes/auth.routes.js`, `backend/src/middleware/auth.middleware.js`, `backend/src/middleware/errorHandler.js`, `backend/src/server.js`

**Interfaces:**
- Consumes: `auth.service` (Task 4).
- Produces: middlewares que nunca penduram request; errorHandler sem payload sensível e sem classes mortas; server.js sem rota `/api/debug` em produção e com CORS limpo.

- [ ] **Step 1: auth.middleware.js — try/catch nos middlewares**

```js
export async function authMiddleware(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ success: false, error: "Não autenticado", message: "Token de acesso não fornecido" });
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ success: false, error: "Token inválido", message: "Token expirado ou inválido" });
    const user = await getUserById(payload.id);
    if (!user) return res.status(401).json({ success: false, error: "Usuário não encontrado", message: "Usuário não existe mais no sistema" });
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === "CastError" || error.name === "ValidationError") {
      return res.status(401).json({ success: false, error: "Token inválido", message: "Token expirado ou inválido" });
    }
    next(error);
  }
}
```
Mesmo padrão em `optionalAuthMiddleware` (catch: `next(error)` silencioso ou loga — decisão: loga e segue `next()` sem req.user? Não: falha de DB deve ir ao errorHandler; CastError de token forjado deve seguir sem user).

- [ ] **Step 2: errorHandler.js — sem payload sensível + remover classes mortas**

- Remover `const payload = req.method !== "GET" ? req.body : null;` e o campo `payload_recebido` do `ErrorLog.create` (deixar `undefined` — o modelo tem default).
- Remover `APIError`, `NotFoundError`, `ValidationError`, `UnauthorizedError`, `RateLimitError`, `asyncHandler` e o branch `err instanceof APIError` (decisão do spec; manter branches Multer/JSON e resposta genérica em produção).
- Export default ajustado.

- [ ] **Step 3: server.js — CORS limpo, debug restrito, handlers de processo**

```js
const corsOrigins = [process.env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"].filter(Boolean);
```
`/api/debug`: envolver em `if (process.env.NODE_ENV !== "production")`.
`process.on("uncaughtException")` e `unhandledRejection`: logar e `process.exit(1)`.

- [ ] **Step 4: auth.routes.js — remover DEBUG logs; `/profile` validação já no service (Task 4)**

- [ ] **Step 5: Verificação + commit**
Run: `node --check` nos 4 arquivos
```bash
git add backend/src && git commit -m "fix: middleware error safety, no sensitive payload logging, hardened server"
```

---

### Task 11: frontend api.js — interceptor seguro (C7) + exports corretos (C5)

**Files:**
- Modify: `frontend/src/services/api.js`

**Interfaces:**
- Consumes: backend `POST /auth/provider-preference` (existe).
- Produces: interceptor que nunca lança; remove `updateGeminiKey`; corrige o caller em Chat.vue (Task 12).

- [ ] **Step 1: Corrigir C7 — payload do report de erro**

```js
let payload_recebido = null;
try {
  const raw = error.config?.data;
  if (typeof raw === "string" && raw) payload_recebido = JSON.parse(raw);
} catch { /* corpo não serializável — ignora */ }
```
Substituir o `payload_recebido: ...` no objeto `errorReport`.

- [ ] **Step 2: Remover `updateGeminiKey`** (rota `/auth/gemini-key` não existe).

- [ ] **Step 3: Verificar callers** — Chat.vue importa `updateGeminiKey` (Task 12 remove). `checkHealth`/`updateProfile`/`getEditalChunks` mantidos (endpoints existem: `/health`+baseURL `/api` → `/api/health` ✓).

- [ ] **Step 4: Verificação + commit**
Run: `node --check frontend/src/services/api.js`
```bash
git add frontend/src/services/api.js && git commit -m "fix: api client — safe error payload parsing, drop dead endpoint"
```

---

### Task 12: ProfilePage.vue + Chat.vue — unwrap do usuário (C5, C6)

**Files:**
- Modify: `frontend/src/pages/ProfilePage.vue`, `frontend/src/pages/Chat.vue`

**Interfaces:**
- Consumes: `getCurrentUser()` (retorna `{success, data}`); corrige o `localStorage.user` para conter o objeto usuário real.
- Produces: `/perfil` renderiza dados reais; guard de rotas volta a enxergar `role`.

- [ ] **Step 1: ProfilePage.vue — import quebrado (C5)**

`updatePreferredProvider` é importado (linha 274) mas **nunca usado** (confirmado: só existe `preferredProvider` ref local). Remover `updatePreferredProvider` do import:
```js
import { logout, getCurrentUser, updateProviderConfig } from '../services/api.js'
```

- [ ] **Step 2: ProfilePage.vue — unwrap em fetchUserData (C6)**

```js
async function fetchUserData() {
  try {
    const response = await getCurrentUser();
    const user = response?.data || response;
    if (user && user.email) {
      currentUser.value = user;
      preferredProvider.value = user.preferred_provider || "gemini";
      localStorage.setItem("user", JSON.stringify(user));
    }
  } catch (err) {
    console.error("Erro ao buscar dados do usuário:", err);
  }
}
```

- [ ] **Step 3: Chat.vue — unwrap em refreshUserData + checkUserKey (C6)**

```js
async function refreshUserData() {
  try {
    const response = await getCurrentUser();
    const user = response?.data || response;
    if (user && user.email) {
      userData.value = user;
      isPlanAcknowledged.value = !!user.planAcknowledged;
      localStorage.setItem("user", JSON.stringify(user));
    }
  } catch (err) { console.error("Error refreshing user data:", err); }
}
```
`checkUserKey`: `const stored = localStorage.getItem("user"); if (stored) { const parsed = JSON.parse(stored); if (parsed && parsed.email) { userData.value = parsed; isPlanAcknowledged.value = !!parsed.planAcknowledged; } }`.

- [ ] **Step 4: Chat.vue — remover import `updateGeminiKey`** e o branch morto `credits`:
```js
// remover: if (response.data.creditStatus) { credits.value = ... }  (ref nunca declarado)
```

- [ ] **Step 5: Chat.vue — remover DEBUG logs e refs mortos** (`isChatUnlocked`, `tutorialSteps`, `currentStep`, `handleAcknowledgePlan` logs).

- [ ] **Step 6: Verificação + commit**
Run: `node --check` falha em .vue (usar `npm run build` na Task 15); checar visualmente as edições.
```bash
git add frontend/src/pages/ProfilePage.vue frontend/src/pages/Chat.vue && git commit -m "fix: profile/chat — unwrap user object, fix broken imports"
```

---

### Task 13: Componentes e páginas — XSS, rotas, toasts, campos

**Files:**
- Modify: `frontend/src/components/MessageBubble.vue`, `frontend/src/main.js`, `frontend/src/layouts/DashboardLayout.vue`, `frontend/src/pages/Login.vue`, `frontend/src/pages/Edital.vue`, `frontend/src/pages/dashboard/EditalView.vue`, `frontend/src/components/EditalUploadModal.vue`

**Interfaces:**
- Consumes: rotas definidas em main.js (`/dashboard/editais` nova).
- Produces: sem XSS; rota `/editais` única + `/dashboard/editais`; toast único; credenciais removidas.

- [ ] **Step 1: MessageBubble.vue — sanitizar antes do v-html (C9)**

```js
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function formatText(content) {
  let html = escapeHtml(content); // 1º: escapa tudo (mata XSS)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\n/g, "<br>");
  return html;
}
```
E guarda: `(source.relevance || "").toLowerCase()`.

- [ ] **Step 2: main.js — rota `/editais` única + `/dashboard/editais`**

- Manter a rota pública `{ path: "/editais", name: "Editais", component: EditaisPage }`.
- Remover o bloco duplicado `{ path: "/editais", name: "UserEditais", requiresAuth }`.
- Adicionar: `{ path: "/dashboard/editais", name: "UserEditais", component: () => import("./pages/dashboard/UserEditais.vue"), meta: { requiresAuth: true } }`.

- [ ] **Step 3: DashboardLayout.vue — toast único + menu**

- Remover `<ToastContainer />` do template (fica só no App.vue) e o import.
- Menu "Editais" (user): `{ path: "/dashboard/editais", label: "Editais", ... }`.

- [ ] **Step 4: Login.vue — remover credenciais expostas** (bloco de dicas com admin@hubsabia.com/admin123); `required` no input nome.

- [ ] **Step 5: Edital.vue — campo correto** `edital.arquivoUrl` (camelCase) no `v-if`/href do "Ver PDF".

- [ ] **Step 6: EditalView.vue — navegação válida**

```js
function goBack() {
  router.push(isAdmin.value ? "/admin/editais" : "/dashboard/editais");
}
// idem após exclusão
```

- [ ] **Step 7: EditalUploadModal.vue — timer + emit**

- Limpar `setInterval` no `catch` (guardar id do timer em variável; `clearInterval` em `finally`/`catch`).
- `emit("success", response)` em vez de `response.data` (verificar caller: AdminDashboard/UserEditais usam o payload? se ignoram, ajuste é seguro).

- [ ] **Step 8: Verificação + commit**
```bash
git add frontend/src && git commit -m "fix: frontend — XSS-safe rendering, route consolidation, ui corrections"
```

---

### Task 14: Docs e env (README, RESUMO, .env.example)

**Files:**
- Modify: `README.md`, `RESUMO.txt`, `backend/.env.example`, `frontend/.env.example`

- [ ] **Step 1: README.md** — reescrever: o que é, stack (Node ≥20, Express, Mongoose, Vue 3, Vite), como rodar (`npm install` → `npm run dev`), variáveis de ambiente (backend/frontend), como criar admin (`npm run create-admin`), deploy Render+Vercel, nota sobre `GEMINI_API_KEY`/`OPENAI_API_KEY` opcionais.

- [ ] **Step 2: RESUMO.txt** — atualizar: remover Groq/vercel.json/Transformers.js como pipeline principal; descrever multi-provedor (Gemini padrão, OpenAI fallback), créditos (20/dia, chave própria = ilimitado), endpoints reais.

- [ ] **Step 3: backend/.env.example** — adicionar `OPENAI_API_KEY=` e `ANTHROPIC_API_KEY=` (opcionais, comentadas); remover `GROQ_API_KEY` (não usada); `ADMIN_EMAIL=`/`ADMIN_PASSWORD=` (create-admin). Ajustar `frontend/.env.example` se necessário.

- [ ] **Step 4: Commit**
```bash
git add README.md RESUMO.txt backend/.env.example frontend/.env.example && git commit -m "docs: align README, summary and env examples with current architecture"
```

---

### Task 15: Verificação final e limpeza

**Files:** (nenhum — verificação)

- [ ] **Step 1: Sintaxe de todo o backend**
Run: `node --check` em todos os `.js` de `backend/src` e `backend/scripts` (loop via bash)
Expected: sem erros.

- [ ] **Step 2: Build do frontend**
Run: `npm run build --workspace=frontend`
Expected: build OK (vite build).

- [ ] **Step 3: Testes**
Run: `npm test --workspace=backend`
Expected: verde (Tasks 2/5/6).

- [ ] **Step 4: Boot do backend (se MongoDB local disponível)**
Run: `npm run dev --workspace=backend` (ou `node backend/src/server.js`) — parar após log de boot. Se não houver MongoDB local, registrar como pendente de verificação no ambiente do usuário.
Expected: log "MongoDB connected successfully" + "HubSabia Backend Server Started".

- [ ] **Step 5: Smoke via curl (se servidor up)**
Run: `curl http://localhost:3001/api/health`
Expected: `{"status":"healthy",...}`

- [ ] **Step 6: Git status limpo + log**
Run: `git status --short && git log --oneline -15`
Expected: working tree limpo; commits sequenciais.

- [ ] **Step 7: Relatório final** — resumo do que foi corrigido por severidade, o que ficou pendente (features fase 2), e instruções de verificação manual no ambiente do usuário (chat anônimo, upload, perfil, admin).
