# Gate + Créditos + Groq Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Chat IA exige login; créditos decrescem e bloqueiam em 0 (obrigando chave própria); providers Groq+Gemini (sistema ou chave do usuário); passe visual em Home/Login/Chat/Perfil.

**Architecture:** Backend: novo `groq.provider.js` (BaseProvider), provider-manager com fallback bidirecional, OpenAI removido, `openai_api_key`→`groq_api_key`, chat routes exigem auth, créditos pós-débito na resposta. Frontend: gate overlay no chat, modal de créditos esgotados, contador vivo, perfil com chaves Gemini/Groq, interceptor preservando status/code.

**Tech Stack:** Node ≥20, Express 4, Mongoose 8, groq-sdk ^1.1, Vue 3, Vite.

## Global Constraints

- Providers: apenas `gemini` e `groq`. Default: `gemini`. Embeddings: só Gemini.
- Chat autenticado; anônimo → 401. Créditos: 20/dia, reset 24h, chave própria = ilimitado.
- Erros: mensagens sanitizadas (sem chaves), codes: `AUTH_REQUIRED` (401), `CREDITS_EXHAUSTED` (403).
- Frontend: `localStorage.user` sempre objeto real; créditos atualizados pós-resposta.
- Commits pequenos; mensagens em inglês.

---

### Task 1: Groq provider + provider-manager + remoção OpenAI

**Files:**
- Create: `backend/src/services/providers/groq.provider.js`
- Delete: `backend/src/services/providers/openai.provider.js`
- Modify: `backend/src/services/provider-manager.js`, `backend/src/models/UsageLog.js`

- [ ] **Step 1: Criar groq.provider.js**

```js
import Groq from "groq-sdk";
import dotenv from "dotenv";
import BaseProvider from "./base.provider.js";
import { normalizeProviderError } from "../../utils/provider-utils.js";

dotenv.config();

const REQUEST_TIMEOUT_MS = 20000;

export const GROQ_MODELS = {
  CHAT: "llama-3.3-70b-versatile",
  FAST: "llama-3.1-8b-instant",
};

let DEFAULT_MODEL = GROQ_MODELS.CHAT;
const SYSTEM_API_KEY = process.env.GROQ_API_KEY;

const withTimeout = (promise, timeoutMs = REQUEST_TIMEOUT_MS) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Groq Request timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

export class GroqProvider extends BaseProvider {
  #getClient(userApiKey = null) {
    const apiKey = userApiKey || SYSTEM_API_KEY;
    if (!apiKey) throw new Error("Missing Groq API Key.");
    return new Groq({ apiKey });
  }

  async generateResponse(question, contextChunks = [], options = {}) {
    const { userApiKey = null, model = DEFAULT_MODEL } = options;
    try {
      const client = this.#getClient(userApiKey);
      const contextText = contextChunks.length > 0
        ? contextChunks.map((c, i) => `[Trecho ${i + 1}]\n${c.conteudo}`).join("\n\n")
        : "Sem contexto.";
      const prompt = `Responda de forma amigável e direta: ${question}\n\nContexto:\n${contextText}`;

      const result = await withTimeout(client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "Você é um assistente acadêmico útil especializado em editais." },
          { role: "user", content: prompt },
        ],
      }));

      const content = result.choices?.[0]?.message?.content || "";
      if (!content) {
        return { success: false, error: "O modelo retornou resposta vazia", errorCategory: 'INVALID_REQUEST' };
      }

      const usage = result.usage || {};
      return {
        success: true,
        response: content,
        metadata: {
          model,
          provider: 'groq',
          contextUsed: contextChunks.length,
          usage: {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens || 0,
            estimatedCost: 0,
          },
        },
      };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'groq');
      return { success: false, error: normalized.originalMessage, errorCategory: normalized.category };
    }
  }

  async *streamResponse(question, contextChunks = [], options = {}) {
    const { userApiKey = null, model = DEFAULT_MODEL } = options;
    try {
      const client = this.#getClient(userApiKey);
      const contextText = contextChunks.length > 0
        ? contextChunks.map((c, i) => `[Trecho ${i + 1}]\n${c.conteudo}`).join("\n\n")
        : "Sem contexto.";
      const prompt = `Responda de forma amigável e direta: ${question}\n\nContexto:\n${contextText}`;

      const stream = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "Você é um assistante acadêmico útil especializado em editais." },
          { role: "user", content: prompt },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content || "";
        if (text) yield { done: false, text };
      }
      yield { done: true, metadata: { model, provider: 'groq' } };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'groq');
      yield { done: true, error: normalized.originalMessage, errorCategory: normalized.category };
    }
  }

  async validateApiKey(apiKey) {
    try {
      if (!apiKey) return false;
      const client = new Groq({ apiKey });
      const response = await withTimeout(client.chat.completions.create({
        model: GROQ_MODELS.FAST,
        messages: [{ role: 'user', content: 'OK' }],
        max_tokens: 5,
      }), 10000);
      return (response.choices?.[0]?.message?.content || "").length > 0;
    } catch {
      return false;
    }
  }

  async generateEmbedding() {
    return { success: false, error: "Groq não oferece embeddings. Use Gemini para vetores.", errorCategory: 'INVALID_REQUEST' };
  }

  async extractMainPoints() {
    return { success: false, error: "Extração não suportada pelo Groq. Use Gemini.", errorCategory: 'INVALID_REQUEST' };
  }

  async generateEditalSummary() {
    return { success: false, error: "Resumo não suportado pelo Groq. Use Gemini.", errorCategory: 'INVALID_REQUEST' };
  }
}

export const groqProvider = new GroqProvider();
```

- [ ] **Step 2: provider-manager.js** — `providers = { gemini: geminiProvider, groq: groqProvider }`; fallback genérico:
```js
if (!result.success && enableFallback && fallbackCategories.includes(result.errorCategory)) {
  const fallbackName = provider === 'gemini' ? 'groq' : 'gemini';
  const fallbackProvider = this.getProvider(fallbackName);
  if (fallbackProvider) {
    const hasKey = fallbackName === 'gemini'
      ? process.env.GEMINI_API_KEY
      : process.env.GROQ_API_KEY;
    if (hasKey) {
      const { userApiKey: _drop, ...rest } = options;
      return fallbackProvider.generateResponse(question, contextChunks, { ...rest, provider: fallbackName });
    }
  }
  return { success: false, error: "Providers primário e fallback indisponíveis", errorCategory: 'PROVIDER_UNAVAILABLE' };
}
```

- [ ] **Step 3: Deletar openai.provider.js** (`git rm`); `UsageLog.js` enum provider: adicionar `'groq'`.

- [ ] **Step 4: Verificar + commit**
Run: `node --check` nos arquivos + `cd backend && node --test "test/*.test.js"`
```bash
git add -A && git commit -m "feat: groq provider with bidirectional fallback; remove openai"
```

---

### Task 2: User model + auth.service — groq_api_key

**Files:**
- Modify: `backend/src/models/User.js`, `backend/src/services/auth.service.js`, `backend/src/routes/auth.routes.js`

- [ ] **Step 1: User.js** — `openai_api_key` → `groq_api_key` (manter select:false); `preferred_provider` enum `['gemini','groq']`.

- [ ] **Step 2: auth.service.js** — `updateProviderConfig`: branches `gemini`/`groq` (remover `openai`/`claude`); trocar todos os `+openai_api_key` por `+groq_api_key`; `has_openai_key` → `has_groq_key` em todos os retornos; `login`/`registerUser`/`getUserById`/`updateUserProfile`/`listAllUsers`.

- [ ] **Step 3: auth.routes.js** — whitelists `['gemini','groq']` em `/provider-config` e `/provider-preference`.

- [ ] **Step 4: Verificar + commit**
Run: `node --check` + testes
```bash
git add -A && git commit -m "feat: groq api key field and provider whitelist"
```

---

### Task 3: chat.routes — auth obrigatória + créditos pós-débito

**Files:**
- Modify: `backend/src/routes/chat.routes.js`, `backend/src/services/credits.service.js`

- [ ] **Step 1: credits.service.js** — `decrementCredit` com `{ new: true }` retornando doc atualizado.

- [ ] **Step 2: chat.routes.js `/pergunta`** — trocar `optionalAuthMiddleware` por `authMiddleware`; remover o caminho anônimo; selecionar `+gemini_api_key +groq_api_key`; `userApiKey` por provider; 403 com `code: 'CREDITS_EXHAUSTED'`; após débito:
```js
let updatedUser = null;
if (result.success && result.metadata?.usedAI !== false) {
  updatedUser = await creditsService.decrementCredit(req.user._id);
}
// creditStatus na resposta usa o valor PÓS-débito
const remaining = updatedUser?.remainingCredits ?? creditStatus.creditsRemaining;
```
resposta `creditStatus: { remaining, resetIn, plan, usingOwnKey }`.

- [ ] **Step 3: chat.routes.js `/pergunta/stream`** — `authMiddleware`; mesmas seleções; crédito check + débito pós-stream (já existente); adicionar `code: 'CREDITS_EXHAUSTED'` no 403.

- [ ] **Step 4: Remover** import `UsageLog` não usado (se ficou), `console.log` DEBUG restantes; `/sugestoes` segue público com chave do sistema.

- [ ] **Step 5: Verificar + commit**
Run: `node --check` + testes
```bash
git add -A && git commit -m "feat: chat requires auth; credits returned post-decrement"
```

---

### Task 4: Frontend — interceptor + gate + créditos (Chat.vue)

**Files:**
- Modify: `frontend/src/services/api.js`, `frontend/src/pages/Chat.vue`

- [ ] **Step 1: api.js interceptor** — rejeitar com `err.status`/`err.code`/`err.reason` preservados (403 e demais com corpo); manter limpeza no 401.

- [ ] **Step 2: Chat.vue gate** — bloco no template, quando `!isLoggedIn` (ou `gateVisible`):
```html
<div v-if="!isLoggedIn || authGateVisible" class="auth-gate">
  <div class="auth-gate-card">
    <h2>Entre para usar o Chat IA</h2>
    <p>Crie uma conta ou faça login para perguntar sobre editais.</p>
    <router-link to="/login" class="btn btn-primary btn-block">Entrar</router-link>
    <router-link to="/login?tab=register" class="btn btn-outline btn-block">Criar conta</router-link>
  </div>
</div>
```
Substituir o input area quando gate ativo; `authGateVisible = ref(false)`; set `true` quando `error.status === 401`.

- [ ] **Step 3: Chat.vue créditos** — catch: `if (error.code === 'CREDITS_EXHAUSTED') isExhaustedModalVisible.value = true`; após resposta OK:
```js
if (response.data.creditStatus) {
  userData.value = { ...userData.value, remainingCredits: response.data.creditStatus.remaining };
  localStorage.setItem('user', JSON.stringify(userData.value));
}
```

- [ ] **Step 4: Modal de créditos esgotados** — reescrever com o padrão do PlanSelectionModal (`plan-modal-overlay` → `credit-modal-overlay` scoped no Chat.vue ou componente próprio); CTA "Usar minha chave de IA" → `/perfil`; nota de renovação em 24h. Remover referências às classes antigas (`provider-onboarding-overlay`/`tutorial-container`).

- [ ] **Step 5: Verificar + commit**
```bash
git add -A && git commit -m "feat: chat login gate, live credit counter, exhausted modal"
```

---

### Task 5: ProfilePage — chaves Groq/Gemini + preferência

**Files:**
- Modify: `frontend/src/pages/ProfilePage.vue`

- [ ] **Step 1:** `providerKeys`/`showKeys`/forms: `openai` → `groq`; `hasOpenAIKey` → `hasGroqKey`; template do form OpenAI → Groq (mesmo markup, rótulo "Chave Groq (llama-3.3)"); `updateProviderConfig('groq', key)`.

- [ ] **Step 2:** Seletor de provider preferido (radio ou select Gemini/Groq) chamando `POST /auth/provider-preference` e `refreshUserData()`.

- [ ] **Step 3: Verificar + commit**
```bash
git add -A && git commit -m "feat: profile — groq/gemini keys and provider preference"
```

---

### Task 6: Passe de design (frontend-design skill)

**Files:**
- Modify: `frontend/src/pages/Home.vue`, `frontend/src/pages/Login.vue`, `frontend/src/pages/Chat.vue` (gate/modal), `frontend/src/pages/ProfilePage.vue`, `frontend/src/components/PlanSelectionModal.vue` (se preciso), `frontend/src/assets/main.css` (tokens auxiliares se necessário)

- [ ] **Step 1:** Ler `skill://frontend-design` antes de desenhar.
- [ ] **Step 2:** Home: hero com gradiente sutil + padrão geométrico; seção editais enxuta; CTAs claros.
- [ ] **Step 3:** Login/Registro: card dividido (marca com gradiente + formulário).
- [ ] **Step 4:** Chat: gate modal e modal de créditos no padrão visual; header enxuto.
- [ ] **Step 5:** Perfil: cards de chave com estados (configurada/não) e créditos com barra real.
- [ ] **Step 6:** Build + conferência dark/light no browser; commit `style: visual pass — home, login, chat, profile`.

---

### Task 7: Verificação final

- [ ] **Step 1:** `node --test` (backend) verde.
- [ ] **Step 2:** `npm run build --workspace=frontend` OK.
- [ ] **Step 3:** Browser: anônimo `/chat` → gate bloqueia; login → pergunta → créditos 20→19; 0 → modal chave própria; chave Groq configurada → ∞; pergunta via Groq (metadata model llama-3.3).
- [ ] **Step 4:** README/RESUMO: OpenAI → Groq. `git status` limpo.
