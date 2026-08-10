import { creditsService } from '../src/services/credits.service.js';
import User from '../src/models/User.js';

async function runTests() {
  console.log("--- Starting Credits Service Tests ---");

  // Mock user
  const user = {
    remainingCredits: 5,
    lastCreditReset: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    usingOwnApiKey: { active: false, provider: null },
    currentPlan: { id: 'free_hubsabia', name: 'Plano Gratuito HubSabia', type: 'free' },
    save: async () => console.log("User saved to DB")
  };

  // Test 1: Check and Consume
  const status1 = await creditsService.checkAndConsumeCredit(user);
  console.log("Test 1 (Normal Usage):", status1.canProceed === true && status1.creditsRemaining === 5);

  // Test 2: Decrement (contrato real: decrementCredit(userId) via findOneAndUpdate)
  // A função não muta o objeto passado; o débito é atômico no banco.
  const decResult = await creditsService.decrementCredit("000000000000000000000000");
  console.log("Test 2 (Decrement no-op p/ id inexistente):", !decResult || decResult.matchedCount === 0);

  // Test 3: Own Key Bypass
  const userOwnKey = {
    ...user,
    usingOwnApiKey: { active: true, provider: 'gemini' }
  };
  const status3 = await creditsService.checkAndConsumeCredit(userOwnKey);
  console.log("Test 3 (Own Key):", status3.usingOwnKey === true && status3.canProceed === true);

  // Test 4: Reset Logic
  const userExpired = {
    ...user,
    remainingCredits: 0,
    lastCreditReset: new Date(Date.now() - 1000 * 60 * 60 * 25) // 25 hours ago
  };
  const status4 = await creditsService.checkAndConsumeCredit(userExpired);
  console.log("Test 4 (Reset Logic):", status4.creditsRemaining === 20);

  console.log("--- Credits Service Tests Complete ---");
}

runTests().catch(console.error);
