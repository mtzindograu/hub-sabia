/**
 * Groq AI Provider (groq-sdk)
 * Implementação do BaseProvider usando o Groq (LLMs Llama via API da Groq).
 * Não oferece embeddings — use Gemini para vetores (RAG).
 */

import Groq from "groq-sdk";
import dotenv from "dotenv";
import BaseProvider from "./base.provider.js";
import { normalizeProviderError } from "../../utils/provider-utils.js";

dotenv.config();

const REQUEST_TIMEOUT_MS = 20000;

export const GROQ_MODELS = {
  CHAT: "llama-3.3-70b-versatile",
  FAST: "llama-3.1-8b-instant",
};

let DEFAULT_MODEL = GROQ_MODELS.CHAT;
const SYSTEM_API_KEY = process.env.GROQ_API_KEY;

/**
 * Helper to add timeout to a promise (sem timer órfão)
 */
const withTimeout = (promise, timeoutMs = REQUEST_TIMEOUT_MS) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Groq Request timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

export class GroqProvider extends BaseProvider {
  /**
   * Get Groq client instance
   */
  #getClient(userApiKey = null) {
    const apiKey = userApiKey || SYSTEM_API_KEY;
    if (!apiKey) throw new Error("Missing Groq API Key.");
    return new Groq({ apiKey });
  }

  /**
   * Generate response (Chat)
   */
  async generateResponse(question, contextChunks = [], options = {}) {
    const { userApiKey = null, model = DEFAULT_MODEL } = options;
    try {
      const client = this.#getClient(userApiKey);

      const contextText = contextChunks.length > 0
        ? contextChunks.map((c, i) => `[Trecho ${i + 1}]\n${c.conteudo}`).join("\n\n")
        : "Sem contexto.";

      const prompt = `Responda de forma amigável e direta: ${question}\n\nContexto:\n${contextText}`;

      const result = await withTimeout(client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "Você é um assistente acadêmico útil especializado em editais." },
          { role: "user", content: prompt },
        ],
      }));

      const content = result.choices?.[0]?.message?.content || "";
      if (!content) {
        return { success: false, error: "O modelo retornou resposta vazia", errorCategory: 'INVALID_REQUEST' };
      }

      const usage = result.usage || {};
      return {
        success: true,
        response: content,
        metadata: {
          model,
          provider: 'groq',
          contextUsed: contextChunks.length,
          usage: {
            promptTokens: usage.prompt_tokens || 0,
            completionTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens || 0,
            estimatedCost: 0,
          },
        },
      };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'groq');
      console.error("[Groq] generation error:", normalized.originalMessage);
      return { success: false, error: normalized.originalMessage, errorCategory: normalized.category };
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
        ? contextChunks.map((c, i) => `[Trecho ${i + 1}]\n${c.conteudo}`).join("\n\n")
        : "Sem contexto.";

      const prompt = `Responda de forma amigável e direta: ${question}\n\nContexto:\n${contextText}`;

      const stream = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "Você é um assistente acadêmico útil especializado em editais." },
          { role: "user", content: prompt },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content || "";
        if (text) yield { done: false, text };
      }

      yield { done: true, metadata: { model, provider: 'groq' } };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'groq');
      yield { done: true, error: normalized.originalMessage, errorCategory: normalized.category };
    }
  }

  /**
   * Validate API Key
   */
  async validateApiKey(apiKey) {
    try {
      if (!apiKey) return false;
      const client = new Groq({ apiKey });
      const response = await withTimeout(client.chat.completions.create({
        model: GROQ_MODELS.FAST,
        messages: [{ role: 'user', content: 'OK' }],
        max_tokens: 5,
      }), 10000);
      return (response.choices?.[0]?.message?.content || "").length > 0;
    } catch (error) {
      console.error("[Groq] Key validation failed:", error.message);
      return false;
    }
  }

  /**
   * Generate embedding (NOT SUPPORTED BY GROQ)
   */
  async generateEmbedding() {
    return {
      success: false,
      error: "Groq não oferece embeddings. Use Gemini para vetores.",
      errorCategory: 'INVALID_REQUEST'
    };
  }

  /**
   * Extract points from Edital (NOT SUPPORTED BY GROQ)
   */
  async extractMainPoints() {
    return {
      success: false,
      error: "Extração não suportada pelo Groq. Use Gemini.",
      errorCategory: 'INVALID_REQUEST'
    };
  }

  /**
   * Generate summary (NOT SUPPORTED BY GROQ)
   */
  async generateEditalSummary() {
    return {
      success: false,
      error: "Resumo não suportado pelo Groq. Use Gemini.",
      errorCategory: 'INVALID_REQUEST'
    };
  }
}

// SINGLETON INSTANCE
export const groqProvider = new GroqProvider();
