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

test("normalizeProviderError classifica rate limit", () => {
  const n = normalizeProviderError(new Error("429 Rate limit exceeded"), "gemini");
  assert.equal(n.category, "RATE_LIMIT");
});

test("normalizeProviderError sanitiza a mensagem", () => {
  const n = normalizeProviderError(new Error("Incorrect API key provided: sk-secret123"), "openai");
  assert.ok(!n.originalMessage.includes("sk-secret123"));
});
