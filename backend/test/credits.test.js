import { test } from "node:test";
import assert from "node:assert/strict";
import { creditsService } from "../src/services/credits.service.js";

test("anônimo (user undefined) passa sem crédito", async () => {
  const status = await creditsService.checkAndConsumeCredit(undefined);
  assert.equal(status.canProceed, true);
  assert.equal(status.anonymous, true);
});

test("usuário com créditos tem canProceed true", async () => {
  const user = {
    _id: "abc",
    remainingCredits: 5,
    lastCreditReset: new Date(),
    currentPlan: { id: "free" },
    usingOwnApiKey: { active: false },
  };
  const status = await creditsService.checkAndConsumeCredit(user);
  assert.equal(status.canProceed, true);
  assert.equal(status.creditsRemaining, 5);
});

test("usuário com 0 créditos e reset válido é bloqueado", async () => {
  const user = {
    _id: "abc",
    remainingCredits: 0,
    lastCreditReset: new Date(),
    currentPlan: { id: "free" },
    usingOwnApiKey: { active: false },
  };
  const status = await creditsService.checkAndConsumeCredit(user);
  assert.equal(status.canProceed, false);
  assert.equal(status.reason, "CREDITS_EXHAUSTED");
});
test("normaliza usuário legado sem campos de crédito", () => {
  const normalized = creditsService.normalizeUserCreditFields({
    remainingCredits: undefined,
    lastCreditReset: undefined,
    currentPlan: undefined,
    usingOwnApiKey: undefined,
    planAcknowledged: undefined,
  });

  assert.equal(normalized.remainingCredits, 20);
  assert.ok(normalized.lastCreditReset instanceof Date);
  assert.deepEqual(normalized.currentPlan, {
    id: "free_hubsabia",
    name: "Plano Gratuito HubSabia",
    type: "free",
  });
  assert.deepEqual(normalized.usingOwnApiKey, {
    active: false,
    provider: null,
    configuredAt: null,
  });
  assert.equal(normalized.planAcknowledged, false);
});
test("chave própria permite uso com 0 créditos sem consumo", async () => {
  const status = await creditsService.checkAndConsumeCredit({
    _id: "own-key-user",
    remainingCredits: 0,
    lastCreditReset: new Date(),
    currentPlan: { id: "free" },
    usingOwnApiKey: { active: true, provider: "groq" },
  });

  assert.equal(status.canProceed, true);
  assert.equal(status.usingOwnKey, true);
  assert.equal(status.creditsRemaining, 0);
});

test("stream só consome após conclusão sem erro", () => {
  assert.equal(creditsService.shouldConsumeStreamCredit({ completed: true, hasError: false, aborted: false, hasResponse: true }), true);
  assert.equal(creditsService.shouldConsumeStreamCredit({ completed: true, hasError: true, aborted: false, hasResponse: true }), false);
  assert.equal(creditsService.shouldConsumeStreamCredit({ completed: false, hasError: false, aborted: false, hasResponse: true }), false);
  assert.equal(creditsService.shouldConsumeStreamCredit({ completed: true, hasError: false, aborted: true, hasResponse: true }), false);
});
