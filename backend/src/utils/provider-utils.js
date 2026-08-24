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
    .replace(/\bgsk_[A-Za-z0-9_-]{12,}\b/g, "gsk_***")
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
  const rawMessage = String(error?.message || error?.toString?.() || "Erro desconhecido");
  const message = sanitizeProviderMessage(rawMessage);
  const normalizedMessage = rawMessage.toLowerCase();
  const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : undefined;
  const code = String(error?.code || "").toLowerCase();
  let category = 'UNKNOWN';

  // Authentication must take precedence over generic status/message matches.
  if (
    status === 401
    || code === 'invalid_api_key'
    || normalizedMessage.includes('invalid api key')
    || normalizedMessage.includes('api key')
    || normalizedMessage.includes('authentication')
    || normalizedMessage.includes('unauthorized')
  ) {
    category = 'AUTH_ERROR';
  } else if (
    code === 'model_not_found'
    || normalizedMessage.includes('model not found')
    || normalizedMessage.includes('model_not_found')
    || normalizedMessage.includes('modelo não disponível')
    || normalizedMessage.includes('modelo nao disponivel')
    || (status === 404 && normalizedMessage.includes('model'))
  ) {
    category = 'MODEL_UNAVAILABLE';
  } else if (
    status === 503
    || normalizedMessage.includes('service unavailable')
    || normalizedMessage.includes('provider unavailable')
    || normalizedMessage.includes('temporarily unavailable')
    || normalizedMessage.includes('indisponível')
    || normalizedMessage.includes('overloaded')
    || normalizedMessage.includes('busy')
  ) {
    category = 'PROVIDER_UNAVAILABLE';
  } else if (
    status === 429
    || normalizedMessage.includes('429')
    || normalizedMessage.includes('rate limit')
  ) {
    category = 'RATE_LIMIT';
  } else if (
    normalizedMessage.includes('quota')
    || normalizedMessage.includes('billing')
    || normalizedMessage.includes('resource exhausted')
  ) {
    category = 'QUOTA_EXCEEDED';
  } else if (
    status === 408
    || normalizedMessage.includes('timeout')
    || normalizedMessage.includes('deadline')
  ) {
    category = 'TIMEOUT';
  } else if (
    normalizedMessage.includes('not configured')
    || normalizedMessage.includes('not supported')
  ) {
    category = 'PROVIDER_UNAVAILABLE';
  } else if (
    status === 400
    || normalizedMessage.includes('400')
    || normalizedMessage.includes('invalid_request')
    || normalizedMessage.includes('bad request')
  ) {
    category = 'INVALID_REQUEST';
  }

  return {
    originalMessage: message,
    category,
    provider,
    ...(status === undefined ? {} : { status }),
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
