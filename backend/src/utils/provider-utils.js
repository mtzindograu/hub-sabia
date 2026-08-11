/**
 * Provider Utilities
 * Helper functions for error normalization and cost estimation
 */

/**
 * Tenta extrair um objeto JSON de uma string de resposta (tolera fences de markdown
 * e texto ao redor — modelos às vezes embrulham o JSON em ```json ... ```).
 * @param {string} text - Texto de resposta
 * @returns {object|null} Objeto parseado ou null se não houver JSON válido
 */
export function parseJsonText(text) {
  if (!text || typeof text !== 'string') return null;
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch { /* tenta extrair o bloco {...} */ }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch { /* sem JSON válido */ }
  }
  return null;
}

/**
 * Redige segredos (API keys) de mensagens de erro antes de logar/devolver ao cliente.
 * @param {string} message - Mensagem original
 * @returns {string} Mensagem com chaves redigidas
 */
export function sanitizeProviderMessage(message) {
  if (typeof message !== "string") return String(message || "Erro desconhecido");
  return message
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "sk-***")
    .replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, "AIza***")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{10,}\b/gi, "Bearer ***");
}

/**
 * Normalizes errors from different AI providers into standard categories
 * @param {Error|Object} error - Original error object
 * @param {string} provider - Provider name
 * @returns {Object} Normalized error
 */
export function normalizeProviderError(error, provider) {
  const message = sanitizeProviderMessage(error.message || error.toString());
  let category = 'UNKNOWN';

  // Category mapping
  if (message.includes('401') || message.includes('API key') || message.includes('invalid_api_key')) {
    category = 'AUTH_ERROR';
  } else if (message.includes('429') || message.includes('Rate limit')) {
    category = 'RATE_LIMIT';
  } else if (message.includes('quota') || message.includes('billing')) {
    category = 'QUOTA_EXCEEDED';
  } else if (message.includes('timeout') || message.includes('deadline')) {
    category = 'TIMEOUT';
  } else if (message.includes('not configured') || message.includes('not supported')) {
    category = 'PROVIDER_UNAVAILABLE';
  } else if (message.includes('overloaded') || message.includes('busy')) {
    category = 'RATE_LIMIT';
  } else if (message.includes('400') || message.includes('invalid_request')) {
    category = 'INVALID_REQUEST';
  }

  return {
    originalMessage: message,
    category,
    provider,
    timestamp: new Date()
  };
}

/**
 * Estimates cost based on provider and token usage
 * (Values are hardcoded for common models as of implementation date)
 */
export function estimateCost(provider, model, promptTokens, completionTokens) {
  const prices = {
    'openai': {
      'gpt-4o': { prompt: 0.000005, completion: 0.000015 },
      'gpt-4o-mini': { prompt: 0.00000015, completion: 0.0000006 },
    },
    'gemini': {
      'gemini-1.5-flash': { prompt: 0.000000075, completion: 0.0000003 },
      'gemini-1.5-pro': { prompt: 0.0000035, completion: 0.0000105 },
    },
    'claude': {
      'claude-3-5-sonnet': { prompt: 0.000003, completion: 0.000015 },
      'claude-3-haiku': { prompt: 0.00000025, completion: 0.00000125 },
      'claude-3-opus': { prompt: 0.000015, completion: 0.000075 },
    }
  };

  const providerPrices = prices[provider];
  if (!providerPrices) return 0;

  // Find model price (supports partial matches like 'models/gemini-1.5-flash')
  // Longest match first: evita 'gpt-4o' casar antes de 'gpt-4o-mini'
  const modelKey = Object.keys(providerPrices)
    .sort((a, b) => b.length - a.length)
    .find(k => model.includes(k));
  const modelPrices = providerPrices[modelKey];

  if (!modelPrices) return 0;

  return (promptTokens * modelPrices.prompt) + (completionTokens * modelPrices.completion);
}
