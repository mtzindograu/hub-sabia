/**
 * Embedding Service
 * Generates vector embeddings using Transformers.js (local) or Google Gemini API
 *
 * @description Creates embeddings for text chunks to enable vector similarity search
 */

import { pipeline, env } from '@xenova/transformers';
import path from 'path';
import { fileURLToPath } from 'url';
import geminiService, { GEMINI_MODELS } from './gemini.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

// Model configuration
const LOCAL_EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const LOCAL_EMBEDDING_DIMENSION = 384;
// Lido no call-site: GEMINI_MODELS.EMBEDDING pode ser mutado pelo autoDiscoverModels
const GEMINI_EMBEDDING_MODEL = () => GEMINI_MODELS.EMBEDDING;

// Singleton pipeline instance
let embeddingPipeline = null;

/**
 * Get or create the embedding pipeline
 * @returns {Promise<Object>} Pipeline instance
 */
async function getPipeline() {
  if (!embeddingPipeline) {
    console.log('[Embedding] Loading model... (first time may take a while)');
    embeddingPipeline = await pipeline('feature-extraction', LOCAL_EMBEDDING_MODEL, {
      quantized: true, // Use quantized model for faster loading
    });
    console.log('[Embedding] Model loaded successfully!');
  }
  return embeddingPipeline;
}

/**
 * Generate embedding for a single text
 * @param {string} text - Text to embed
 * @param {Object} options - Options including userApiKey and model
 * @returns {Promise<Object>} Embedding result
 */
export async function generateEmbedding(text, options = {}) {
  try {
    const { 
      userApiKey = null, 
      model = null, // Explicit model request
      useGemini = !!(process.env.GEMINI_API_KEY || userApiKey) 
    } = options;

    const targetModel = model || (useGemini ? GEMINI_EMBEDDING_MODEL() : LOCAL_EMBEDDING_MODEL);

    if (targetModel === GEMINI_EMBEDDING_MODEL()) {
      console.log(`[EMBEDDING] Using Google Gemini (${GEMINI_EMBEDDING_MODEL})`);
      const result = await geminiService.generateEmbedding(text, { userApiKey });
      if (result.success) return result;
      console.warn(`[EMBEDDING] Gemini failed, falling back to local model: ${result.error}`);
    }

    console.log(`[EMBEDDING] Using local model (${LOCAL_EMBEDDING_MODEL})`);
    
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'Empty text provided for embedding',
        embedding: null,
      };
    }

    const pipeline = await getPipeline();
    const truncatedText = truncateText(text, 2000);

    const output = await pipeline(truncatedText, {
      pooling: 'mean',
      normalize: true,
    });

    const embedding = Array.from(output.data);
    
    return {
      success: true,
      embedding,
      model: LOCAL_EMBEDDING_MODEL,
      dimension: embedding.length,
    };
  } catch (error) {
    console.error('[EMBEDDING] ERRO:', error.message);
    return {
      success: false,
      error: error.message,
      embedding: null,
    };
  }
}

/**
 * Generate embeddings for multiple texts (batch processing)
 * @param {Array<string>} texts - Array of texts to embed
 * @param {Object} options - Batch options
 * @returns {Promise<Object>} Batch embedding results
 */
export async function generateEmbeddings(texts, options = {}) {
  try {
    const { batchSize = 10 } = options;

    if (!texts || texts.length === 0) {
      return {
        success: false,
        error: 'No texts provided for embedding',
        embeddings: [],
        successCount: 0,
        failureCount: 0,
      };
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Process in batches
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((text) => generateEmbedding(text, options))
      );

      results.push(...batchResults);

      batchResults.forEach((result) => {
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      });
    }

    // Validar homogeneidade de dimensão (embedding 384 vs 768 em lote quebra o cosseno)
    const dims = new Set(results.filter((r) => r.success).map((r) => r.dimension));
    if (dims.size > 1) {
      console.warn(`[EMBEDDINGS] Dimensões mistas detectadas: ${[...dims].join(', ')}`);
    }

    return {
      success: successCount > 0,
      embeddings: results.map((r) => r.embedding),
      model: results.find(r => r.success)?.model || 'local',
      results,
      successCount,
      failureCount,
      total: texts.length,
    };
  } catch (error) {
    console.error('[EMBEDDINGS] ERRO EM LOTE:', error.message);
    return {
      success: false,
      error: error.message,
      embeddings: [],
      successCount: 0,
      failureCount: 0,
    };
  }
}

/**
 * Generate embedding specifically for query/question
 * @param {string} query - User query
 * @param {Object} options - Options
 * @returns {Promise<Object>} Query embedding
 */
export async function generateQueryEmbedding(query, options = {}) {
  return generateEmbedding(query, options);
}

/**
 * Generate embedding for document chunk
 * @param {string} chunk - Document chunk
 * @param {Object} options - Options
 * @returns {Promise<Object>} Chunk embedding
 */
export async function generateChunkEmbedding(chunk, options = {}) {
  return generateEmbedding(chunk, options);
}

/**
 * Truncate text to maximum token limit
 * @param {string} text - Text to truncate
 * @param {number} maxChars - Maximum characters
 * @returns {string} Truncated text
 */
function truncateText(text, maxChars = 2000) {
  if (text.length <= maxChars) {
    return text;
  }

  const truncated = text.slice(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');

  if (lastPeriod > maxChars * 0.8) {
    return truncated.slice(0, lastPeriod + 1);
  }

  return truncated;
}

/**
 * Validate embedding vector
 * @param {Array<number>} embedding - Embedding vector
 * @returns {Object} Validation result
 */
export function validateEmbedding(embedding) {
  if (!embedding || !Array.isArray(embedding)) {
    return {
      valid: false,
      error: 'Embedding must be an array',
    };
  }

  const hasInvalidValues = embedding.some(
    (val) => isNaN(val) || !isFinite(val)
  );

  if (hasInvalidValues) {
    return {
      valid: false,
      error: 'Embedding contains invalid values (NaN or Infinity)',
    };
  }

  return {
    valid: true,
    dimension: embedding.length,
  };
}

/**
 * Calculate cosine similarity between two embeddings
 * @param {Array<number>} embeddingA - First embedding
 * @param {Array<number>} embeddingB - Second embedding
 * @returns {number} Similarity score (0-1)
 */
export function cosineSimilarity(embeddingA, embeddingB) {
  const validationA = validateEmbedding(embeddingA);
  const validationB = validateEmbedding(embeddingB);

  if (!validationA.valid || !validationB.valid) {
    return 0;
  }

  if (embeddingA.length !== embeddingB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
    normA += embeddingA[i] * embeddingA[i];
    normB += embeddingB[i] * embeddingB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default {
  generateEmbedding,
  generateEmbeddings,
  generateQueryEmbedding,
  generateChunkEmbedding,
  validateEmbedding,
  cosineSimilarity,
};
