import { geminiProvider, GEMINI_MODELS } from "./providers/gemini.provider.js";
import { openaiProvider } from "./providers/openai.provider.js";
import { claudeProvider } from "./providers/claude.provider.js";

/**
 * Provider Manager
 * Orchestrates multiple AI providers (Gemini, OpenAI, Claude, etc.)
 * Currently supports: Gemini, OpenAI, Claude
 */
class ProviderManager {
  constructor() {
    this.providers = {
      gemini: geminiProvider,
      openai: openaiProvider,
      claude: claudeProvider,
      // mistral: null, // Future
      // grok: null, // Future
    };
    this.defaultProvider = 'gemini';
  }

  /**
   * Get provider instance by name
   * @param {string} name - Provider name
   * @returns {BaseProvider}
   */
  getProvider(name = null) {
    const providerName = name || this.defaultProvider;
    return this.providers[providerName] || this.providers[this.defaultProvider];
  }

  /**
   * Generate response (Chat) with optional fallback
   * FALLBACK ORDER: Claude -> OpenAI -> Gemini
   */
  async generateResponse(question, contextChunks = [], options = {}) {
    const { provider = this.defaultProvider, enableFallback = true } = options;
    
    try {
      const selectedProvider = this.getProvider(provider);
      const result = await selectedProvider.generateResponse(question, contextChunks, options);
      
      // Automatic Fallback Logic
      if (!result.success && enableFallback) {
        const fallbackCategories = ['TIMEOUT', 'RATE_LIMIT', 'QUOTA_EXCEEDED'];
        
        if (fallbackCategories.includes(result.errorCategory)) {
          // Fallback sequence logic
          if (provider === 'claude') {
            console.log(`[ProviderManager] Claude failed. Checking fallback to OpenAI...`);
            if (options.openaiApiKey || process.env.OPENAI_API_KEY) {
              return this.generateResponse(question, contextChunks, { ...options, provider: 'openai' });
            }
          }
          
          if (provider === 'openai' || provider === 'claude') {
            console.log(`[ProviderManager] Fallback path. Checking Gemini...`);
            const hasGeminiKey = options.userApiKey || process.env.GEMINI_API_KEY;
            if (hasGeminiKey) {
              return this.getProvider('gemini').generateResponse(question, contextChunks, { 
                ...options, 
                provider: 'gemini' 
              });
            }
          }
          
          return { success: false, error: "Primary and fallback providers failed or not configured", errorCategory: 'PROVIDER_UNAVAILABLE' };
        }
      }
      
      return result;
    } catch (error) {
      console.error(`[ProviderManager] Fatal error in ${provider}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stream response (Chat) with generator support
   */
  async *streamResponse(question, contextChunks = [], options = {}) {
    const { provider = this.defaultProvider } = options;
    const selectedProvider = this.getProvider(provider);
    
    // Note: Fallback for streaming is more complex and usually not recommended 
    // to avoid partial responses. We implement a straightforward call here.
    try {
      const stream = selectedProvider.streamResponse(question, contextChunks, options);
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      console.error(`[ProviderManager] Streaming error in ${provider}:`, error.message);
      yield { done: true, error: error.message };
    }
  }

  /**
   * Generate embedding
   */
  async generateEmbedding(text, options = {}) {
    const provider = this.getProvider(options.provider);
    return provider.generateEmbedding(text, options);
  }

  /**
   * Validate API Key
   */
  async validateApiKey(apiKey, providerName = 'gemini') {
    const provider = this.getProvider(providerName);
    return provider.validateApiKey(apiKey);
  }

  /**
   * Extract points from Edital
   */
  async extractMainPoints(editalContent, options = {}) {
    const provider = this.getProvider(options.provider);
    return provider.extractMainPoints(editalContent, options);
  }

  /**
   * Generate summary
   */
  async generateEditalSummary(editalContent, options = {}) {
    const provider = this.getProvider(options.provider);
    return provider.generateEditalSummary(editalContent, options);
  }
}

const providerManager = new ProviderManager();
export { GEMINI_MODELS };
export default providerManager;
