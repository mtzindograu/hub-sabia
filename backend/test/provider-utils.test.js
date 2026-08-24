import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeProviderMessage, normalizeProviderError } from "../src/utils/provider-utils.js";

test("redige API keys em mensagens de erro", () => {
  const msg = sanitizeProviderMessage("Incorrect API key provided: sk-abc123XYZ");
  assert.ok(!msg.includes("sk-abc123XYZ"));
  assert.ok(msg.includes("sk-***"));
});

test("redige chaves Gemini (AIza)", () => {
  const msg = sanitizeProviderMessage("Invalid API key AIzaSyD1234567890abcdefghijklmnopqrstuvwxyz");
  assert.ok(!msg.includes("AIzaSyD1234567890"));
  assert.ok(msg.includes("AIza***"));
});

test("redige chaves Groq em mensagens completas", () => {
  const key = "gsk_EXEMPLO_LONGO_FICTICIO";
  const msg = sanitizeProviderMessage(`Request failed using key ${key}`);
  assert.ok(!msg.includes(key));
  assert.ok(msg.includes("gsk_***"));
});

test("normalizeProviderError classifica rate limit", () => {
  const n = normalizeProviderError(new Error("429 Rate limit exceeded"), "gemini");
  assert.equal(n.category, "RATE_LIMIT");
});

test("normalizeProviderError sanitiza a mensagem", () => {
  const n = normalizeProviderError(new Error("Incorrect API key provided: sk-secret123"), "openai");
  assert.ok(!n.originalMessage.includes("sk-secret123"));
});
import { GROQ_MODELS } from "../src/services/providers/groq.provider.js";

test("Groq usa modelos atuais de produção", () => {
  assert.equal(GROQ_MODELS.CHAT, "openai/gpt-oss-120b");
  assert.equal(GROQ_MODELS.FAST, "openai/gpt-oss-20b");
});

test("duplicidade de email usa mensagem e status próprios", async () => {
  const { isDuplicateEmailError } = await import("../src/routes/auth.routes.js");
  assert.equal(isDuplicateEmailError(new Error("Email já cadastrado")), true);
  assert.equal(isDuplicateEmailError({ code: 11000 }), true);
  assert.equal(isDuplicateEmailError(new Error("Outro erro")), false);
});
