import { geminiProvider, GEMINI_MODELS } from "./providers/gemini.provider.js";
import { groqProvider } from "./providers/groq.provider.js";
import { sanitizeProviderMessage } from "../utils/provider-utils.js";

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
    
    try {
      const selectedProvider = this.getProvider(provider);
      if (!selectedProvider) {
        return { success: false, error: "Provider não suportado", errorCategory: 'PROVIDER_UNAVAILABLE' };
      }
      const result = await selectedProvider.generateResponse(question, contextChunks, options);
      
      // Automatic Fallback Logic (bidirecional, sem repassar chave do provider de origem)
      if (!result.success && enableFallback) {
        const fallbackCategories = ['TIMEOUT', 'RATE_LIMIT', 'QUOTA_EXCEEDED'];
        
        if (fallbackCategories.includes(result.errorCategory)) {
          const fallbackName = provider === 'gemini' ? 'groq' : 'gemini';
          const fallbackProvider = this.getProvider(fallbackName);
          const fallbackHasSystemKey = fallbackName === 'gemini'
            ? process.env.GEMINI_API_KEY
            : process.env.GROQ_API_KEY;

          if (fallbackProvider && fallbackHasSystemKey) {
            console.log(`[ProviderManager] Fallback path: ${provider} -> ${fallbackName}`);
            const { userApiKey: _drop, ...fallbackOptions } = options;
            return fallbackProvider.generateResponse(question, contextChunks, {
              ...fallbackOptions,
              provider: fallbackName,
            });
          }

          return { success: false, error: "Primary and fallback providers failed or not configured", errorCategory: 'PROVIDER_UNAVAILABLE' };
        }
      }
      
      return result;
    } catch (error) {
      console.error(`[ProviderManager] Fatal error in ${provider}:`, error.message);
      return { success: false, error: sanitizeProviderMessage(error.message) };
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
