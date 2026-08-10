/**
 * OpenAI AI Provider
 * Implementation of BaseProvider using official OpenAI SDK
 */

import OpenAI from "openai";
import BaseProvider from "./base.provider.js";
import { normalizeProviderError, estimateCost } from "../../utils/provider-utils.js";

// --- CONFIGURATION & STATE (SINGLE SOURCE OF TRUTH) ---
const REQUEST_TIMEOUT_MS = 15000;

export const OPENAI_MODELS = {
  CHAT: "gpt-4o",
  FAST: "gpt-4o-mini",
  EMBEDDING: "text-embedding-3-small"
};

let DEFAULT_MODEL = OPENAI_MODELS.FAST;
const SYSTEM_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Helper to add timeout to a promise (sem timer órfão)
 */
const withTimeout = (promise, timeoutMs = REQUEST_TIMEOUT_MS) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`OpenAI Request timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

export class OpenAIProvider extends BaseProvider {
  /**
   * Get OpenAI client instance
   */
  #getClient(userApiKey = null) {
    const apiKey = userApiKey || SYSTEM_API_KEY;
    if (!apiKey) throw new Error("Missing OpenAI API Key.");
    return new OpenAI({ apiKey });
  }

  /**
   * Generate response (Chat)
   */
  async generateResponse(question, contextChunks = [], options = {}) {
    const { userApiKey = null, model = DEFAULT_MODEL } = options;
    try {
      const client = this.#getClient(userApiKey);
      
      const contextText = contextChunks.length > 0 
        ? contextChunks.map((c, i) => `[Trecho ${i+1}]\n${c.conteudo}`).join("\n\n")
        : "Sem contexto.";

      const prompt = `Responda de forma amigável e direta: ${question}\n\nContexto:\n${contextText}`;

      console.log(`[OpenAI] generating... model=${model}`);
      
      const result = await withTimeout(client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: "Você é um assistente acadêmico útil especializado em editais." },
          { role: "user", content: prompt }
        ],
      }));

      const content = result.choices[0]?.message?.content || "";
      if (!content) {
        return { success: false, error: "O modelo retornou resposta vazia", errorCategory: 'INVALID_REQUEST' };
      }
      const usage = result.usage || {};
      const promptTokens = usage.prompt_tokens || 0;
      const completionTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || (promptTokens + completionTokens);
      const cost = estimateCost('openai', model, promptTokens, completionTokens);

      return {
        success: true,
        response: content,
        metadata: { 
          model, 
          provider: 'openai',
          contextUsed: contextChunks.length,
          usage: {
            promptTokens,
            completionTokens,
            totalTokens,
            estimatedCost: cost
          }
        }
      };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'openai');
      console.error("[OpenAI] generation error:", normalized.originalMessage);
      return { 
        success: false, 
        error: normalized.originalMessage, 
        errorCategory: normalized.category 
      };
    }
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

      const stream = await client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: "Você é um assistente acadêmico útil especializado em editais." },
          { role: "user", content: prompt }
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) yield { done: false, text };
      }

      yield { done: true, metadata: { model, provider: 'openai' } };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'openai');
      yield { done: true, error: normalized.originalMessage, errorCategory: normalized.category };
    }
  }

  /**
   * Generate embedding (NOT USED IN THIS PHASE)
   */
  async generateEmbedding(text, options = {}) {
    return {
      success: false,
      error: "OpenAI Embeddings not yet supported in RAG pipeline. Using Gemini for vectors.",
      errorCategory: 'INVALID_REQUEST'
    };
  }

  /**
   * Validate API Key
   */
  async validateApiKey(apiKey) {
    try {
      if (!apiKey) return false;
      const client = new OpenAI({ apiKey });
      
      console.log(`[OpenAI] Validating key...`);
      
      const response = await withTimeout(client.chat.completions.create({
        model: OPENAI_MODELS.FAST,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5
      }), 10000);
      
      const text = response.choices[0]?.message?.content || "";
      return text.length > 0;
    } catch (error) {
      console.error("[OpenAI] Key validation failed:", error.message);
      return false;
    }
  }

  /**
   * Extract points from Edital
   */
  async extractMainPoints(editalContent, options = {}) {
    try {
      const { userApiKey = null } = options;
      const client = this.#getClient(userApiKey);
      
      const prompt = `Extraia dados do edital em JSON:\n${editalContent.slice(0, 15000)}\n\nCampos: titulo, objetivo_principal, prazos_importantes, requisitos, etapas, documentos_necessarios, palavras_chave, publico_alvo, vagas, inscricoes_periodo, contatos.`;

      const result = await withTimeout(client.chat.completions.create({
        model: OPENAI_MODELS.CHAT,
        messages: [
          { role: "system", content: "Você é um extrator de dados estruturados. Responda apenas com o JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      }));

      const usage = result.usage || {};
      const promptTokens = usage.prompt_tokens || 0;
      const completionTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || (promptTokens + completionTokens);
      const cost = estimateCost('openai', OPENAI_MODELS.CHAT, promptTokens, completionTokens);

      return {
        success: true,
        data: JSON.parse(result.choices[0]?.message?.content || "{}"),
        metadata: { 
          model: OPENAI_MODELS.CHAT, 
          provider: 'openai',
          usage: { promptTokens, completionTokens, totalTokens, estimatedCost: cost }
        }
      };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'openai');
      return { 
        success: false, 
        error: normalized.originalMessage, 
        errorCategory: normalized.category 
      };
    }
  }

  /**
   * Generate summary
   */
  async generateEditalSummary(editalContent, options = {}) {
    try {
      const { userApiKey = null } = options;
      const client = this.#getClient(userApiKey);
      const prompt = `Resuma o edital acadêmico de forma clara e concisa:\n${editalContent.slice(0, 10000)}`;

      const result = await withTimeout(client.chat.completions.create({
        model: OPENAI_MODELS.FAST,
        messages: [{ role: "user", content: prompt }]
      }));

      const usage = result.usage || {};
      const promptTokens = usage.prompt_tokens || 0;
      const completionTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || (promptTokens + completionTokens);
      const cost = estimateCost('openai', OPENAI_MODELS.FAST, promptTokens, completionTokens);
      
      return { 
        success: true, 
        summary: result.choices[0]?.message?.content || "",
        metadata: {
          model: OPENAI_MODELS.FAST,
          provider: 'openai',
          usage: { promptTokens, completionTokens, totalTokens, estimatedCost: cost }
        }
      };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'openai');
      return { 
        success: false, 
        error: normalized.originalMessage, 
        errorCategory: normalized.category 
      };
    }
  }
}

// SINGLETON INSTANCE
export const openaiProvider = new OpenAIProvider();
