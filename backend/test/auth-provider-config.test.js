import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import User from "../src/models/User.js";
import { updateProviderConfig } from "../src/services/auth.service.js";

const originalFindByIdAndUpdate = User.findByIdAndUpdate;

afterEach(() => {
  User.findByIdAndUpdate = originalFindByIdAndUpdate;
});

test("configuração válida persiste chave e ativa modo de chave própria", async () => {
  let receivedUserId;
  let receivedUpdate;
  User.findByIdAndUpdate = async (userId, update, options) => {
    receivedUserId = userId;
    receivedUpdate = update;
    assert.deepEqual(options, { new: true });
    return { _id: userId };
  };

  const result = await updateProviderConfig("user-without-real-key", "groq", "test-key-not-real");

  assert.equal(result, true);
  assert.equal(receivedUserId, "user-without-real-key");
  assert.equal(receivedUpdate.groq_api_key, "test-key-not-real");
  assert.equal(receivedUpdate.usingOwnApiKey.active, true);
  assert.equal(receivedUpdate.usingOwnApiKey.provider, "groq");
});
