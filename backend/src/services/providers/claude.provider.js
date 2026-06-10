/**
 * Claude AI Provider (Anthropic SDK)
 * Implementation of BaseProvider using official Anthropic SDK
 */

import Anthropic from "@anthropic-ai/sdk";
import BaseProvider from "./base.provider.js";
import { normalizeProviderError, estimateCost } from "../../utils/provider-utils.js";

// --- CONFIGURATION & STATE (SINGLE SOURCE OF TRUTH) ---
const REQUEST_TIMEOUT_MS = 20000; // Claude can be slower with large context

export const CLAUDE_MODELS = {
  CHAT: "claude-3-5-sonnet-20240620",
  FAST: "claude-3-haiku-20240307",
  PRO: "claude-3-5-sonnet-20240620"
};

let DEFAULT_MODEL = CLAUDE_MODELS.CHAT;
const SYSTEM_API_KEY = process.env.ANTHROPIC_API_KEY;

/**
 * Helper to add timeout to a promise
 */
const withTimeout = (promise, timeoutMs = REQUEST_TIMEOUT_MS) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Claude Request timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export class ClaudeProvider extends BaseProvider {
  /**
   * Get Anthropic client instance
   */
  #getClient(userApiKey = null) {
    const apiKey = userApiKey || SYSTEM_API_KEY;
    if (!apiKey) throw new Error("Missing Claude API Key.");
    return new Anthropic({ apiKey });
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

      console.log(`[Claude] generating... model=${model}`);
      
      const response = await withTimeout(client.messages.create({
        model: model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
        system: "Você é um assistente acadêmico útil especializado em editais."
      }));

      const usage = response.usage || {};
      const promptTokens = usage.input_tokens || 0;
      const completionTokens = usage.output_tokens || 0;
      const totalTokens = promptTokens + completionTokens;
      const cost = estimateCost('claude', model, promptTokens, completionTokens);

      return {
        success: true,
        response: response.content[0]?.text || "",
        metadata: { 
          model, 
          provider: 'claude',
          contextUsed: contextChunks.length,
          usage: { promptTokens, completionTokens, totalTokens, estimatedCost: cost }
        }
      };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'claude');
      console.error("[Claude] generation error:", normalized.originalMessage);
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

      const stream = await client.messages.create({
        model: model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
        system: "Você é um assistente acadêmico útil especializado em editais.",
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          yield { done: false, text: event.delta.text };
        }
      }

      yield { done: true, metadata: { model, provider: 'claude' } };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'claude');
      yield { done: true, error: normalized.originalMessage, errorCategory: normalized.category };
    }
  }

  /**
   * Generate embedding (NOT SUPPORTED BY CLAUDE NATIVELY)
   */
  async generateEmbedding(text, options = {}) {
    return {
      success: false,
      error: "Claude does not support native embeddings. Using Gemini for vectors.",
      errorCategory: 'INVALID_REQUEST'
    };
  }

  /**
   * Validate API Key
   */
  async validateApiKey(apiKey) {
    try {
      if (!apiKey) return false;
      const client = new Anthropic({ apiKey });
      
      console.log(`[Claude] Validating key...`);
      
      const response = await withTimeout(client.messages.create({
        model: CLAUDE_MODELS.FAST,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Say OK' }]
      }), 10000);
      
      return (response.content[0]?.text || "").length > 0;
    } catch (error) {
      console.error("[Claude] Key validation failed:", error.message);
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
      
      const prompt = `Extraia dados do edital em JSON. Responda APENAS o JSON válido:\n${editalContent.slice(0, 15000)}\n\nCampos: titulo, objetivo_principal, prazos_importantes, requisitos, etapas, documentos_necessarios, palavras_chave, publico_alvo, vagas, inscricoes_periodo, contatos.`;

      const response = await withTimeout(client.messages.create({
        model: CLAUDE_MODELS.PRO,
        max_tokens: 2048,
        system: "Você é um extrator de dados estruturados. Responda apenas com o JSON.",
        messages: [{ role: "user", content: prompt }]
      }));

      const text = response.content[0]?.text || "{}";
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const cleanJson = text.substring(jsonStart, jsonEnd);

      const usage = response.usage || {};
      const promptTokens = usage.input_tokens || 0;
      const completionTokens = usage.output_tokens || 0;
      const cost = estimateCost('claude', CLAUDE_MODELS.PRO, promptTokens, completionTokens);

      return {
        success: true,
        data: JSON.parse(cleanJson),
        metadata: { 
          model: CLAUDE_MODELS.PRO, 
          provider: 'claude',
          usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens, estimatedCost: cost }
        }
      };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'claude');
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
      const prompt = `Resuma o edital acadêmico de forma clara e concisa:\n${editalContent.slice(0, 15000)}`;

      const response = await withTimeout(client.messages.create({
        model: CLAUDE_MODELS.FAST,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      }));

      const usage = response.usage || {};
      const promptTokens = usage.input_tokens || 0;
      const completionTokens = usage.output_tokens || 0;
      const cost = estimateCost('claude', CLAUDE_MODELS.FAST, promptTokens, completionTokens);
      
      return { 
        success: true, 
        summary: response.content[0]?.text || "",
        metadata: {
          model: CLAUDE_MODELS.FAST,
          provider: 'claude',
          usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens, estimatedCost: cost }
        }
      };
    } catch (error) {
      const normalized = normalizeProviderError(error, 'claude');
      return { 
        success: false, 
        error: normalized.originalMessage, 
        errorCategory: normalized.category 
      };
    }
  }
}

// SINGLETON INSTANCE
export const claudeProvider = new ClaudeProvider();
