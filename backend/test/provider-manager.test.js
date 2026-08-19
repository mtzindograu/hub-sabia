import { beforeEach, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import providerManager from "../src/services/provider-manager.js";
import { normalizeProviderError, sanitizeProviderMessage } from "../src/utils/provider-utils.js";

const originalProviders = { ...providerManager.providers };
const originalGroqKey = process.env.GROQ_API_KEY;
const contextChunks = [{ conteudo: "Informação do edital" }];

beforeEach(() => {
  process.env.GROQ_API_KEY = "groq-test-key";
});

afterEach(() => {
  providerManager.providers.gemini = originalProviders.gemini;
  providerManager.providers.groq = originalProviders.groq;
  if (originalGroqKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalGroqKey;
});

for (const category of ["TIMEOUT", "RATE_LIMIT", "QUOTA_EXCEEDED", "PROVIDER_UNAVAILABLE", "MODEL_UNAVAILABLE"]) {
  test(`Gemini ${category} chama Groq como fallback`, async () => {
    let groqOptions;
    let groqChunks;
    providerManager.providers.gemini = {
      async generateResponse() {
        return { success: false, error: "falha sanitizada", errorCategory: category };
      },
    };
    providerManager.providers.groq = {
      async generateResponse(question, chunks, options) {
        groqChunks = chunks;
        groqOptions = options;
        return { success: true, response: "resposta Groq", metadata: { provider: "groq" } };
      },
    };

    const result = await providerManager.generateResponse("Qual o prazo?", contextChunks, {
      provider: "gemini",
      userApiKey: "user-secret-key",
    });

    assert.equal(result.success, true);
    assert.deepEqual(groqChunks, contextChunks);
    assert.equal(groqOptions.provider, "groq");
    assert.equal(groqOptions.userApiKey, undefined);
  });
}

test("falha de ambos providers preserva a categoria do fallback", async () => {
  providerManager.providers.gemini = {
    async generateResponse() {
      return { success: false, error: "Gemini indisponível", errorCategory: "PROVIDER_UNAVAILABLE" };
    },
  };
  providerManager.providers.groq = {
    async generateResponse() {
      return { success: false, error: "Groq limitado", errorCategory: "RATE_LIMIT" };
    },
  };

  const result = await providerManager.generateResponse("Qual o prazo?", contextChunks);

  assert.equal(result.success, false);
  assert.equal(result.errorCategory, "RATE_LIMIT");
});

test("erro não recuperável não executa fallback", async () => {
  let groqCalled = false;
  providerManager.providers.gemini = {
    async generateResponse() {
      return { success: false, error: "requisição inválida", errorCategory: "INVALID_REQUEST" };
    },
  };
  providerManager.providers.groq = {
    async generateResponse() {
      groqCalled = true;
      return { success: true, response: "não deveria chamar" };
    },
  };

  const result = await providerManager.generateResponse("Qual o prazo?", contextChunks);

  assert.equal(result.success, false);
  assert.equal(result.errorCategory, "INVALID_REQUEST");
  assert.equal(groqCalled, false);
});

test("exception recuperável preserva categoria e executa fallback", async () => {
  providerManager.providers.gemini = {
    async generateResponse() {
      const error = new Error("503 Service Unavailable");
      error.status = 503;
      throw error;
    },
  };
  providerManager.providers.groq = {
    async generateResponse() {
      return { success: true, response: "resposta Groq" };
    },
  };

  const result = await providerManager.generateResponse("Qual o prazo?", contextChunks);

  assert.equal(result.success, true);
});

test("503 é classificado como provider indisponível", () => {
  const normalized = normalizeProviderError({ status: 503, message: "Service Unavailable" }, "gemini");
  assert.equal(normalized.category, "PROVIDER_UNAVAILABLE");
  assert.equal(normalized.status, 503);
});

test("modelo inexistente é classificado como modelo indisponível", () => {
  const normalized = normalizeProviderError({ status: 404, code: "model_not_found", message: "model not found" }, "gemini");
  assert.equal(normalized.category, "MODEL_UNAVAILABLE");
  assert.equal(normalized.status, 404);
});

test("mensagens de erro sanitizam API keys", () => {
  const raw = "503 from provider with key AIzaSyD1234567890abcdefghijklmnopqrstuvwxyz and Bearer abcdefghijklmnop";
  const normalized = normalizeProviderError({ status: 503, message: raw }, "gemini");
  assert.equal(normalized.category, "PROVIDER_UNAVAILABLE");
  assert.ok(!normalized.originalMessage.includes("AIzaSyD1234567890"));
  assert.ok(!normalized.originalMessage.includes("Bearer abcdefghijklmnop"));
  assert.ok(!sanitizeProviderMessage(raw).includes("AIzaSyD1234567890"));
});
test("resource exhausted é classificado como quota excedida", () => {
  const normalized = normalizeProviderError(new Error("resource exhausted"), "gemini");
  assert.equal(normalized.category, "QUOTA_EXCEEDED");
});

test("erro explícito de autenticação não é fallback", () => {
  const normalized = normalizeProviderError(new Error("authentication error"), "gemini");
  assert.equal(normalized.category, "AUTH_ERROR");
});
