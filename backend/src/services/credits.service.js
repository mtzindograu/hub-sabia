/**
 * Credits Service
 * Handles credit management, daily reset, and utilization logic.
 */

import User from '../models/User.js';

const DAILY_CREDIT_LIMIT = 20;
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas

export const creditsService = {
  /**
   * Helper to ensure user document has valid credit fields (Retrocompatibilidade)
   */
  _ensureUserFields(user) {
    const defaultPlan = { id: 'free_hubsabia', name: 'Plano Gratuito HubSabia', type: 'free' };
    const defaultOwnKey = { active: false, provider: null, configuredAt: null };
    
    return {
      remainingCredits: user.remainingCredits ?? DAILY_CREDIT_LIMIT,
      lastCreditReset: user.lastCreditReset ?? new Date(),
      currentPlan: user.currentPlan ?? defaultPlan,
      usingOwnApiKey: user.usingOwnApiKey ?? defaultOwnKey
    };
  },

  /**
   * Check and consume credits
   * @param {object|null} user - User document (pode ser undefined/null em requisições anônimas)
   * @returns {object} Status object
   */
  async checkAndConsumeCredit(user) {
    // Usuário anônimo: não passa por controle de crédito (roteamento via optionalAuthMiddleware)
    if (!user || !user._id) {
      return {
        canProceed: true,
        anonymous: true,
        creditsRemaining: null,
        resetIn: 0,
        reason: null,
        currentPlan: null,
        usingOwnKey: false
      };
    }

    const userData = this._ensureUserFields(user);

    // 1. If using own API Key, proceed freely
    if (userData.usingOwnApiKey && userData.usingOwnApiKey.active) {
      return {
        canProceed: true,
        creditsRemaining: userData.remainingCredits,
        resetIn: 0,
        reason: null,
        currentPlan: userData.currentPlan,
        usingOwnKey: true
      };
    }

    // 2. Check for daily reset
    let remainingCredits = userData.remainingCredits;
    let lastReset = new Date(userData.lastCreditReset);
    const now = new Date();

    if (now - lastReset >= RESET_INTERVAL_MS) {
      remainingCredits = DAILY_CREDIT_LIMIT;
      lastReset = now;
      // Atomic reset
      await User.findOneAndUpdate(
        { _id: user._id },
        { 
          $set: { 
            remainingCredits: DAILY_CREDIT_LIMIT, 
            lastCreditReset: now,
            currentPlan: userData.currentPlan // Ensure plan exists
          } 
        }
      );
    }

    // 3. Verify credits
    if (remainingCredits > 0) {
      return {
        canProceed: true,
        creditsRemaining: remainingCredits,
        resetIn: Math.max(0, RESET_INTERVAL_MS - (now - lastReset)),
        reason: null,
        currentPlan: userData.currentPlan,
        usingOwnKey: false
      };
    }

    return {
      canProceed: false,
      creditsRemaining: 0,
      resetIn: Math.max(0, RESET_INTERVAL_MS - (now - lastReset)),
      reason: 'CREDITS_EXHAUSTED',
      currentPlan: userData.currentPlan,
      usingOwnKey: false
    };
  },

  /**
   * Decrement credit only after successful API call
   * @param {string} userId - ID do usuário
   * @returns {Promise<object|null>} Resultado do update (ou null se userId inválido)
   */
  async decrementCredit(userId) {
    if (!userId) return { matchedCount: 0, modifiedCount: 0 };
    // Atomic decrement ensuring it never goes below 0
    return User.findOneAndUpdate(
      { 
        _id: userId,
        'usingOwnApiKey.active': { $ne: true },
        remainingCredits: { $gt: 0 }
      },
      { $inc: { remainingCredits: -1 } }
    );
  }
};
