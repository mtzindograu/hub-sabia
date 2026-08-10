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
