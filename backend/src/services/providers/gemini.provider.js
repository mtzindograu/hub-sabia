/**
 * Google Gemini AI Provider (SDK v2.x) - STABILITY VERSION
 * Optimized for Flash models and strict timeouts to prevent loops and quota issues.
 */

import { GoogleGenAI } from "@google/genai";
import { performance } from "node:perf_hooks";
import dotenv from "dotenv";
import BaseProvider from "./base.provider.js";
import { normalizeProviderError, estimateCost, parseJsonText } from "../../utils/provider-utils.js";

dotenv.config();

// --- CONFIGURATION & STATE (SINGLE SOURCE OF TRUTH) ---
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds max per request
const elapsedMs = (startedAt) => Math.round((performance.now() - startedAt) * 100) / 100;

// Modelos vigentes na API v1beta (gemini-1.5-flash foi descontinuado — 404).
// O autoDiscoverModels tenta atualizar para "flash-latest"; estes são o fallback seguro.
export let GEMINI_MODELS = {
  CHAT: "models/gemini-2.5-flash",
  EMBEDDING: "models/text-embedding-004",
  FAST: "models/gemini-2.5-flash",
  PRO: "models/gemini-2.5-flash"
};

// Ordem de tentativa quando um modelo falha (404/503/quota)
const CHAT_MODEL_FALLBACKS = [
  "models/gemini-2.5-flash",
  "models/gemini-2.0-flash",
  "models/gemini-flash-latest",
];

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
    const fallbackModels = CHAT_MODEL_FALLBACKS;
    
    // Use requested model or default, then try fallbacks
    const initialModel = options.model || DEFAULT_MODEL;
    const modelsToTry = [initialModel, ...fallbackModels.filter(m => m !== initialModel)];

    for (const [attemptIndex, model] of modelsToTry.entries()) {
      const attemptStartedAt = performance.now();
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
        const responseResult = {
          success: true,
          response: getTextFromResponse(result),
          metadata: {
            model,
            provider: 'gemini',
            contextUsed: contextChunks.length,
            usage: { promptTokens, completionTokens, totalTokens, estimatedCost }
          }
        };
        console.log(`[AI Timing] provider=gemini model=${model} attempt=${attemptIndex + 1} duration=${elapsedMs(attemptStartedAt)}ms success=true`);
        return responseResult;
      } catch (error) {
        const normalized = normalizeProviderError(error, 'gemini');
        const status = normalized.status ?? error.status;
        console.log(`[AI Timing] provider=gemini model=${model} attempt=${attemptIndex + 1} duration=${elapsedMs(attemptStartedAt)}ms success=false category=${normalized.category}${status === undefined ? '' : ` status=${status}`}`);

        // If 503 (UNAVAILABLE), try next model
        if (error.status === 503 || (error.message && error.message.includes("503"))) {
          console.warn(`[Gemini] Model ${model} failed with 503. Trying next model...`);
          continue;
        }

        // If not a 503, log and return error
        // Nunca registrar o objeto bruto: SDKs podem incluir credenciais na exceção.
        console.error("[Gemini] generation error:", {
          message: normalized.originalMessage,
          status: normalized.status,
          code: error.code,
          name: error.name,
        });
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
   * Robusto: parse tolerante a markdown, retry com modelo FAST, defaults em todos
   * os campos (a IA pode retornar parcial — o edital não pode ficar com campos vazios).
   */
  async extractMainPoints(editalContent, options = {}) {
    const { userApiKey = null } = options;
    const content = String(editalContent || '').slice(0, 12000);

    const prompt = `Você é um extrator de dados estruturados de editais acadêmicos.
Extraia do edital abaixo um objeto JSON VÁLIDO com EXATAMENTE estas chaves:
{
  "titulo": "string",
  "objetivo_principal": "string (resumo do objetivo em 1-2 frases)",
  "prazos_importantes": ["string", ...],
  "requisitos": ["string", ...],
  "etapas": ["string", ...],
  "documentos_necessarios": ["string", ...],
  "palavras_chave": ["string", ...],
  "publico_alvo": "string",
  "vagas": "string",
  "inscricoes_periodo": "string",
  "contatos": "string"
}
Regras: liste apenas o que existir no texto; use string vazia ou array vazio para o que não existir; NÃO invente informações. Responda APENAS o JSON, sem markdown.

EDITAL:
${content}`;

    const tryExtract = async (model, timeoutMs) => {
      const client = this.#getClient(userApiKey);
      const result = await withTimeout(client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      }), timeoutMs);
      const usageMeta = result.usageMetadata || {};
      return {
        data: parseJsonText(getTextFromResponse(result)),
        usage: {
          promptTokens: usageMeta.promptTokenCount || 0,
          completionTokens: usageMeta.candidatesTokenCount || 0,
          totalTokens: usageMeta.totalTokenCount || 0,
          estimatedCost: 0,
        },
      };
    };

    try {
      // Tenta modelos em ordem (2.5-flash → 2.0-flash → flash-latest) para tolerar 404/503
      const modelsToTry = [...new Set([GEMINI_MODELS.PRO, ...CHAT_MODEL_FALLBACKS])];
      let attempt = { data: null, usage: null };
      let lastError = null;

      for (const model of modelsToTry) {
        try {
          attempt = await tryExtract(model, 25000);
          if (attempt.data) {
            console.log(`[Gemini] Extração OK com modelo ${model}`);
            break;
          }
        } catch (err) {
          lastError = err;
          console.warn(`[Gemini] Extração falhou com ${model}: ${err.message?.slice(0, 80)}`);
        }
      }

      if (!attempt.data || typeof attempt.data !== 'object') {
        throw lastError || new Error('Não foi possível extrair os dados do edital');
      }

      // Garante que TODOS os campos existem (mesmo se a IA retornar parcial)
      const defaults = {
        titulo: '',
        objetivo_principal: '',
        prazos_importantes: [],
        requisitos: [],
        etapas: [],
        documentos_necessarios: [],
        palavras_chave: [],
        publico_alvo: '',
        vagas: '',
        inscricoes_periodo: '',
        contatos: '',
      };
      const data = { ...defaults, ...attempt.data };

      return {
        success: true,
        data,
        metadata: {
          model: GEMINI_MODELS.PRO,
          provider: 'gemini',
          usage: attempt.usage,
        },
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
    const { userApiKey = null } = options;
    const prompt = `Resuma o edital:\n${String(editalContent || '').slice(0, 8000)}`;
    const modelsToTry = [...new Set([GEMINI_MODELS.CHAT, ...CHAT_MODEL_FALLBACKS])];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const client = this.#getClient(userApiKey);
        const result = await withTimeout(client.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        }));

        const text = getTextFromResponse(result);
        if (!text) {
          lastError = new Error('Resposta vazia');
          continue;
        }

        const usage = result.usageMetadata || {};
        const promptTokens = usage.promptTokenCount || 0;
        const completionTokens = usage.candidatesTokenCount || 0;
        const totalTokens = usage.totalTokenCount || (promptTokens + completionTokens);
        const estimatedCost = estimateCost('gemini', model, promptTokens, completionTokens);

        return {
          success: true,
          summary: text,
          metadata: {
            model,
            provider: 'gemini',
            usage: { promptTokens, completionTokens, totalTokens, estimatedCost }
          }
        };
      } catch (error) {
        lastError = error;
        console.warn(`[Gemini] Summary falhou com ${model}: ${error.message?.slice(0, 80)}`);
      }
    }

    console.error("[Gemini DEBUG] RAW ERROR in " + this.constructor.name + ".generateEditalSummary:", {
      message: lastError?.message,
      status: lastError?.status,
      code: lastError?.code,
      name: lastError?.name
    });
    const normalized = normalizeProviderError(lastError || new Error('Falha ao gerar resumo'), 'gemini');
    return { success: false, error: normalized.originalMessage, errorCategory: normalized.category };
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
