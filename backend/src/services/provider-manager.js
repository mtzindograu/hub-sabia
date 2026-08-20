import { geminiProvider, GEMINI_MODELS } from "./providers/gemini.provider.js";
import { groqProvider } from "./providers/groq.provider.js";
import { normalizeProviderError, sanitizeProviderMessage } from "../utils/provider-utils.js";
import { performance } from "node:perf_hooks";
const elapsedMs = (startedAt) => Math.round((performance.now() - startedAt) * 100) / 100;


const FALLBACK_CATEGORIES = new Set([
  'TIMEOUT',
  'RATE_LIMIT',
  'QUOTA_EXCEEDED',
  'PROVIDER_UNAVAILABLE',
  'MODEL_UNAVAILABLE',
]);

const normalizeFailure = (error, provider) => {
  const normalized = normalizeProviderError(error, provider);
  return {
    success: false,
    error: normalized.originalMessage,
    errorCategory: normalized.category,
    ...(normalized.status === undefined ? {} : { status: normalized.status }),
  };
};

const logFailure = ({ provider, result, fallback = false, fallbackProvider = null }) => {
  const details = [
    `provider=${provider}`,
    `category=${result.errorCategory || 'UNKNOWN'}`,
    ...(result.status === undefined ? [] : [`status=${result.status}`]),
    `fallback=${fallback}`,
    ...(fallbackProvider ? [`fallbackProvider=${fallbackProvider}`] : []),
  ].join(' ');
  console.warn(`[ProviderManager] ${details}`);
};

/**
 * Provider Manager
 * Orchestrates multiple AI providers (Gemini, Groq)
 */
class ProviderManager {
  constructor() {
    this.providers = {
      gemini: geminiProvider,
      groq: groqProvider,
    };
    this.defaultProvider = 'gemini';
  }

  /**
   * Get provider instance by name
   * @param {string} name - Provider name
   * @returns {BaseProvider|null} - null se o provider não existe (sem fallback silencioso)
   */
  getProvider(name = null) {
    const providerName = name || this.defaultProvider;
    return this.providers[providerName] || null;
  }

  /**
   * Generate response (Chat) with optional fallback
   * FALLBACK ORDER: Gemini <-> Groq (bidirecional)
   */
  async generateResponse(question, contextChunks = [], options = {}) {
    const { provider = this.defaultProvider, enableFallback = true } = options;
    const selectedProvider = this.getProvider(provider);

    if (!selectedProvider) {
      return { success: false, error: "Provider não suportado", errorCategory: 'PROVIDER_UNAVAILABLE' };
    }

    let result;
    try {
      result = await selectedProvider.generateResponse(question, contextChunks, options);
    } catch (error) {
      result = normalizeFailure(error, provider);
    }

    if (result.success || !enableFallback || !FALLBACK_CATEGORIES.has(result.errorCategory)) {
      if (!result.success) logFailure({ provider, result, fallback: false });
      return result;
    }

    const fallbackName = provider === 'gemini' ? 'groq' : 'gemini';
    const fallbackProvider = this.getProvider(fallbackName);
    const fallbackHasSystemKey = fallbackName === 'gemini'
      ? process.env.GEMINI_API_KEY
      : process.env.GROQ_API_KEY;

    logFailure({ provider, result, fallback: true, fallbackProvider: fallbackName });
    if (!fallbackProvider || !fallbackHasSystemKey) return result;
    const { userApiKey: _drop, ...fallbackOptions } = options;

    const fallbackStartedAt = performance.now();
    try {
      const fallbackResult = await fallbackProvider.generateResponse(question, contextChunks, {
        ...fallbackOptions,
        provider: fallbackName,
      });
      const fallbackDetails = fallbackResult.success
        ? ''
        : ` category=${fallbackResult.errorCategory || 'UNKNOWN'}${fallbackResult.status === undefined ? '' : ` status=${fallbackResult.status}`}`;
      console.log(`[Fallback Timing] from=${provider} to=${fallbackName} duration=${elapsedMs(fallbackStartedAt)}ms success=${fallbackResult.success}${fallbackDetails}`);
      if (!fallbackResult.success) {
        logFailure({ provider: fallbackName, result: fallbackResult, fallback: false });
      }
      return fallbackResult;
    } catch (error) {
      const fallbackResult = normalizeFailure(error, fallbackName);
      console.log(`[Fallback Timing] from=${provider} to=${fallbackName} duration=${elapsedMs(fallbackStartedAt)}ms success=false category=${fallbackResult.errorCategory || 'UNKNOWN'}${fallbackResult.status === undefined ? '' : ` status=${fallbackResult.status}`}`);
      logFailure({ provider: fallbackName, result: fallbackResult, fallback: false });
      return fallbackResult;
    }
  }

  /**
   * Stream response (Chat) with generator support
   */
  async *streamResponse(question, contextChunks = [], options = {}) {
    const { provider = this.defaultProvider } = options;
    const selectedProvider = this.getProvider(provider);
    if (!selectedProvider) {
      yield { done: true, error: "Provider não suportado", errorCategory: 'PROVIDER_UNAVAILABLE' };
      return;
    }
    
    // Note: Fallback for streaming is more complex and usually not recommended 
    // to avoid partial responses. We implement a straightforward call here.
    try {
      const stream = selectedProvider.streamResponse(question, contextChunks, options);
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      console.error(`[ProviderManager] Streaming error in ${provider}:`, error.message);
      yield { done: true, error: sanitizeProviderMessage(error.message) };
    }
  }

  /**
   * Generate embedding
   */
  async generateEmbedding(text, options = {}) {
    const provider = this.getProvider(options.provider);
    if (!provider) return { success: false, error: "Provider não suportado", errorCategory: 'PROVIDER_UNAVAILABLE' };
    try {
      return await provider.generateEmbedding(text, options);
    } catch (error) {
      return { success: false, error: sanitizeProviderMessage(error.message), errorCategory: 'UNKNOWN' };
    }
  }

  /**
   * Validate API Key
   */
  async validateApiKey(apiKey, providerName = 'gemini') {
    const provider = this.getProvider(providerName);
    if (!provider) return false;
    try {
      return await provider.validateApiKey(apiKey);
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract points from Edital
   */
  async extractMainPoints(editalContent, options = {}) {
    const provider = this.getProvider(options.provider);
    if (!provider) return { success: false, error: "Provider não suportado", errorCategory: 'PROVIDER_UNAVAILABLE' };
    try {
      return await provider.extractMainPoints(editalContent, options);
    } catch (error) {
      return { success: false, error: sanitizeProviderMessage(error.message), errorCategory: 'UNKNOWN' };
    }
  }

  /**
   * Generate summary
   */
  async generateEditalSummary(editalContent, options = {}) {
    const provider = this.getProvider(options.provider);
    if (!provider) return { success: false, error: "Provider não suportado", errorCategory: 'PROVIDER_UNAVAILABLE' };
    try {
      return await provider.generateEditalSummary(editalContent, options);
    } catch (error) {
      return { success: false, error: sanitizeProviderMessage(error.message), errorCategory: 'UNKNOWN' };
    }
  }
}

const providerManager = new ProviderManager();
export { GEMINI_MODELS };
export default providerManager;
