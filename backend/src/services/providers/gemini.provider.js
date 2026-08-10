/**
 * Google Gemini AI Provider (SDK v2.x) - STABILITY VERSION
 * Optimized for Flash models and strict timeouts to prevent loops and quota issues.
 */

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import BaseProvider from "./base.provider.js";
import { normalizeProviderError, estimateCost } from "../../utils/provider-utils.js";

dotenv.config();

// --- CONFIGURATION & STATE (SINGLE SOURCE OF TRUTH) ---
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds max per request

export let GEMINI_MODELS = {
  CHAT: "models/gemini-1.5-flash",
  EMBEDDING: "models/text-embedding-004",
  FAST: "models/gemini-1.5-flash",
  PRO: "models/gemini-1.5-flash" // REPLACED PRO WITH FLASH
};

let DEFAULT_MODEL = GEMINI_MODELS.CHAT;
let EMBEDDING_MODEL = GEMINI_MODELS.EMBEDDING;
const SYSTEM_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Helper to add timeout to a promise (sem timer órfão)
 */
const withTimeout = (promise, timeoutMs = REQUEST_TIMEOUT_MS) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

/**
 * UTILITY: Extract text from Gemini v2.x response
 * @param {Object} response - SDK v2.x response object
 * @returns {string}
 */
const getTextFromResponse = (response) => {
  if (!response) return "";
  
  if (typeof response.text === 'string') {
    return response.text;
  }
  
  try {
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text === 'string') return text;
  } catch (e) {
    console.error("[Gemini] Error parsing response text:", e.message);
  }
  
  return "";
};

export class GeminiProvider extends BaseProvider {
  /**
   * Get Gemini client instance
   */
  #getClient(userApiKey = null) {
    const apiKey = userApiKey || SYSTEM_API_KEY;
    if (!apiKey) throw new Error("Missing Gemini API Key.");
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Generate response (Chat)
   */
  async generateResponse(question, contextChunks = [], options = {}) {
    const { userApiKey = null } = options;
    const fallbackModels = ['models/gemini-2.5-flash', 'models/gemini-2.0-flash', 'models/gemini-flash-latest'];
    
    // Use requested model or default, then try fallbacks
    const initialModel = options.model || DEFAULT_MODEL;
    const modelsToTry = [initialModel, ...fallbackModels.filter(m => m !== initialModel)];

    for (const model of modelsToTry) {
      try {
        const client = this.#getClient(userApiKey);
        
        const contextText = contextChunks.length > 0 
          ? contextChunks.map((c, i) => `[Trecho ${i+1}]\n${c.conteudo}`).join("\n\n")
          : "Sem contexto.";

        const prompt = `Responda de forma amigável e direta: ${question}\n\nContexto:\n${contextText}`;

        const result = await withTimeout(client.models.generateContent({
          model: model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        }));

        const usage = result.usageMetadata || {};
        const promptTokens = usage.promptTokenCount || 0;
        const completionTokens = usage.candidatesTokenCount || 0;
        const totalTokens = usage.totalTokenCount || (promptTokens + completionTokens);
        const estimatedCost = estimateCost('gemini', model, promptTokens, completionTokens);

        return {
          success: true,
          response: getTextFromResponse(result),
          metadata: { 
            model, 
            provider: 'gemini',
            contextUsed: contextChunks.length,
            usage: { promptTokens, completionTokens, totalTokens, estimatedCost }
          }
        };
      } catch (error) {
        // If 503 (UNAVAILABLE), try next model
        if (error.status === 503 || (error.message && error.message.includes("503"))) {
          console.warn(`[Gemini] Model ${model} failed with 503. Trying next model...`);
          continue;
        }

        // If not a 503, log and return error
        console.error("[Gemini DEBUG] RAW ERROR in " + this.constructor.name + ".generateResponse:", {
          message: error.message,
          status: error.status,
          code: error.code,
          name: error.name,
          stack: error.stack,
          fullError: error
        });
        const normalized = normalizeProviderError(error, 'gemini');
        return { success: false, error: normalized.originalMessage, errorCategory: normalized.category };
      }
    }

    // All models failed with 503 (unavailable/overloaded)
    return { 
      success: false, 
      error: "O serviço do Gemini está temporariamente sobrecarregado. Tente novamente em alguns instantes.", 
      errorCategory: 'RATE_LIMIT' 
    };
  }

  /**
   * Stream response (Chat)
   */
  async *streamResponse(question, contextChunks = [], options = {}) {
    const { userApiKey = null, model = DEFAULT_MODEL } = options;
    try {
      const client = this.#getClient(userApiKey);
      const contextText = contextChunks.length > 0 
        ? contextChunks.map((c, i) => `[Trecho ${i+1}]\n${c.conteudo}`).join("\n\n")
        : "Sem contexto.";
      const prompt = `Responda de forma amigável e direta: ${question}\n\nContexto:\n${contextText}`;

      const stream = await client.models.generateContentStream({
        model: model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      // @google/genai@2.6.0: o valor aguardado JÁ É o AsyncGenerator — iterar direto (sem .stream)
      for await (const chunk of stream) {
        const text = getTextFromResponse(chunk);
        if (text) yield { done: false, text };
      }

      // Metadata usually available at the end of the stream in some SDKs
      // If needed, yield a final chunk with metadata
      yield { done: true, metadata: { model, provider: 'gemini' } };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'gemini');
      yield { done: true, error: normalized.originalMessage, errorCategory: normalized.category };
    }
  }

  /**
   * Generate embedding
   */
  async generateEmbedding(text, options = {}) {
    const { userApiKey = null } = options;
    try {
      const client = this.#getClient(userApiKey);
      const response = await withTimeout(client.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: [{ parts: [{ text }] }]
      }));

      const values = response?.embeddings?.[0]?.values;
      if (!values) throw new Error("Invalid embedding response");

      return {
        success: true,
        embedding: Array.from(values),
        model: EMBEDDING_MODEL,
        dimension: values.length,
        metadata: { provider: 'gemini', model: EMBEDDING_MODEL }
      };
    } catch (error) {
      console.error("[Gemini DEBUG] RAW ERROR in " + this.constructor.name + ".generateEmbedding:", {
        message: error.message,
        status: error.status,
        code: error.code,
        name: error.name
      });
      const normalized = normalizeProviderError(error, 'gemini');
      return { success: false, error: normalized.originalMessage, errorCategory: normalized.category };
    }
  }

  /**
   * Validate API Key
   */
  async validateApiKey(apiKey) {
    try {
      if (!apiKey) return false;
      const client = new GoogleGenAI({ apiKey });
      const response = await withTimeout(client.models.generateContent({
        model: DEFAULT_MODEL,
        contents: [{ role: 'user', parts: [{ text: 'OK' }] }]
      }), 10000);
      return getTextFromResponse(response).length > 0;
    } catch (e) { return false; }
  }

  /**
   * Extract points from Edital
   */
  async extractMainPoints(editalContent, options = {}) {
    try {
      const { userApiKey = null } = options;
      const client = this.#getClient(userApiKey);
      const prompt = `Extraia dados do edital em JSON:\n${editalContent.slice(0, 10000)}\n\nCampos: titulo, objetivo_principal, prazos_importantes, requisitos, etapas, documentos_necessarios, palavras_chave, publico_alvo, vagas, inscricoes_periodo, contatos.`;

      const result = await withTimeout(client.models.generateContent({
        model: GEMINI_MODELS.PRO,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      }));

      const usage = result.usageMetadata || {};
      const promptTokens = usage.promptTokenCount || 0;
      const completionTokens = usage.candidatesTokenCount || 0;
      const totalTokens = usage.totalTokenCount || (promptTokens + completionTokens);
      const estimatedCost = estimateCost('gemini', GEMINI_MODELS.PRO, promptTokens, completionTokens);

      return {
        success: true,
        data: JSON.parse(getTextFromResponse(result)),
        metadata: { 
          model: GEMINI_MODELS.PRO, 
          provider: 'gemini',
          usage: { promptTokens, completionTokens, totalTokens, estimatedCost }
        }
      };
    } catch (error) {
      console.error("[Gemini DEBUG] RAW ERROR in " + this.constructor.name + ".extractMainPoints:", {
        message: error.message,
        status: error.status,
        code: error.code,
        name: error.name
      });
      const normalized = normalizeProviderError(error, 'gemini');
      return { success: false, error: normalized.originalMessage, errorCategory: normalized.category };
    }
  }

  /**
   * Generate summary
   */
  async generateEditalSummary(editalContent, options = {}) {
    try {
      const { userApiKey = null } = options;
      const client = this.#getClient(userApiKey);
      const prompt = `Resuma o edital:\n${editalContent.slice(0, 8000)}`;

      const result = await withTimeout(client.models.generateContent({
        model: GEMINI_MODELS.CHAT,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      }));

      const usage = result.usageMetadata || {};
      const promptTokens = usage.promptTokenCount || 0;
      const completionTokens = usage.candidatesTokenCount || 0;
      const totalTokens = usage.totalTokenCount || (promptTokens + completionTokens);
      const estimatedCost = estimateCost('gemini', GEMINI_MODELS.CHAT, promptTokens, completionTokens);
      
      return { 
        success: true, 
        summary: getTextFromResponse(result),
        metadata: {
          model: GEMINI_MODELS.CHAT,
          provider: 'gemini',
          usage: { promptTokens, completionTokens, totalTokens, estimatedCost }
        }
      };
    } catch (error) {
      console.error("[Gemini DEBUG] RAW ERROR in " + this.constructor.name + ".generateEditalSummary:", {
        message: error.message,
        status: error.status,
        code: error.code,
        name: error.name
      });
      const normalized = normalizeProviderError(error, 'gemini');
      return { success: false, error: normalized.originalMessage, errorCategory: normalized.category };
    }
  }
}

// SINGLETON INSTANCE
export const geminiProvider = new GeminiProvider();

/**
 * List available models and auto-discover the best FLASH ones
 */
export async function autoDiscoverModels(apiKey = null) {
  try {
    const key = apiKey || SYSTEM_API_KEY;
    if (!key) return false;

    console.log(`[Gemini] Discovering stable Flash models...`);
    const client = new GoogleGenAI({ apiKey: key });
    
    const response = await withTimeout(client.models.list(), 10000);
    
    let models = [];
    if (response?.pageInternal) models = response.pageInternal;
    else if (Array.isArray(response)) models = response;
    else if (response?.models) models = response.models;

    const isStable = (m) => !m.name.includes("-preview") && !m.name.includes("-exp") && !m.name.includes("preview");

    const flashModel = models.find(m => m.name.includes("flash-latest") && isStable(m)) || 
                       models.find(m => m.name.includes("1.5-flash") && isStable(m));
    
    const embedModel = models.find(m => m.name.includes("embedding-001") && isStable(m)) ||
                       models.find(m => m.name.includes("embedding-004") && isStable(m)) ||
                       models.find(m => m.name.includes("embedding-2") && isStable(m));

    if (flashModel) {
      console.log(`[Gemini] Stability Mode: Using ${flashModel.name} for ALL tasks.`);
      GEMINI_MODELS.CHAT = flashModel.name;
      GEMINI_MODELS.FAST = flashModel.name;
      GEMINI_MODELS.PRO = flashModel.name; 
      DEFAULT_MODEL = flashModel.name;
    }

    if (embedModel) {
      GEMINI_MODELS.EMBEDDING = embedModel.name;
      EMBEDDING_MODEL = embedModel.name;
    }

    return true;
  } catch (error) {
    console.warn("[Gemini] Discovery failed, using fallback flash models:", error.message);
    return false;
  }
}

// Startup discovery
if (SYSTEM_API_KEY) {
  setTimeout(() => autoDiscoverModels().catch(() => {}), 500);
}
