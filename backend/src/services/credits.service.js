/**
 * Credits Service
 * Handles credit management, daily reset, and utilization logic.
 */

import User from '../models/User.js';

const DAILY_CREDIT_LIMIT = 20;
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas

export const creditsService = {
  /**
   * Normaliza campos de crédito de documentos antigos sem alterar saldo válido.
   */
  normalizeUserCreditFields(user) {
    const defaultPlan = { id: 'free_hubsabia', name: 'Plano Gratuito HubSabia', type: 'free' };
    const defaultOwnKey = { active: false, provider: null, configuredAt: null };
    const parsedReset = user?.lastCreditReset ? new Date(user.lastCreditReset) : null;

    return {
      remainingCredits: Number.isFinite(user?.remainingCredits) && user.remainingCredits >= 0
        ? user.remainingCredits
        : DAILY_CREDIT_LIMIT,
      lastCreditReset: parsedReset && !Number.isNaN(parsedReset.getTime()) ? parsedReset : new Date(),
      currentPlan: user?.currentPlan ?? defaultPlan,
      usingOwnApiKey: user?.usingOwnApiKey ?? defaultOwnKey,
      planAcknowledged: user?.planAcknowledged ?? false,
    };
  },

  /**
   * Persiste campos ausentes e renova saldo vencido para o usuário.
   */
  async syncStoredCredits(userId) {
    if (!userId) return null;

    const user = await User.findById(userId)
      .select('+gemini_api_key +groq_api_key +claude_api_key')
      .lean();
    if (!user) return null;

    const normalized = this.normalizeUserCreditFields(user);
    const now = new Date();
    const parsedReset = user.lastCreditReset ? new Date(user.lastCreditReset) : null;
    const resetInvalid = !parsedReset || Number.isNaN(parsedReset.getTime());
    const shouldReset = !normalized.usingOwnApiKey?.active
      && now - normalized.lastCreditReset >= RESET_INTERVAL_MS;
    const update = {};

    if (!Number.isFinite(user.remainingCredits) || user.remainingCredits < 0 || shouldReset) {
      update.remainingCredits = shouldReset ? DAILY_CREDIT_LIMIT : normalized.remainingCredits;
    }
    if (resetInvalid || shouldReset) {
      update.lastCreditReset = shouldReset ? now : normalized.lastCreditReset;
    }
    if (user.currentPlan == null) update.currentPlan = normalized.currentPlan;
    if (user.usingOwnApiKey == null) update.usingOwnApiKey = normalized.usingOwnApiKey;
    if (user.planAcknowledged == null) update.planAcknowledged = normalized.planAcknowledged;

    if (Object.keys(update).length === 0) return user;
    return User.findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select('+gemini_api_key +groq_api_key +claude_api_key')
      .lean();
  },

  /**
   * Helper to ensure user document has valid credit fields (Retrocompatibilidade)
   */
  _ensureUserFields(user) {
    return this.normalizeUserCreditFields(user);
  },
  shouldConsumeStreamCredit({ completed, hasError, aborted, hasResponse }) {
    return completed === true
      && hasError !== true
      && aborted !== true
      && hasResponse === true;
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
   * @returns {Promise<object|null>} Documento atualizado (ou null se userId inválido/sem saldo)
   */
  async decrementCredit(userId) {
    if (!userId) return null;
    // Atomic decrement ensuring it never goes below 0; retorna o doc pós-débito
    return User.findOneAndUpdate(
      { 
        _id: userId,
        'usingOwnApiKey.active': { $ne: true },
        remainingCredits: { $gt: 0 }
      },
      { $inc: { remainingCredits: -1 } },
      { new: true }
    );
  }
};
