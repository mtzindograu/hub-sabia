/**
 * Embedding Service
 * Generates vector embeddings using Transformers.js (local, no API required)
 *
 * @description Creates embeddings for text chunks to enable vector similarity search
 */

import { pipeline, env } from '@xenova/transformers';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

// Model configuration
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIMENSION = 384;

// Singleton pipeline instance
let embeddingPipeline = null;

/**
 * Get or create the embedding pipeline
 * @returns {Promise<Object>} Pipeline instance
 */
async function getPipeline() {
  if (!embeddingPipeline) {
    console.log('[Embedding] Loading model... (first time may take a while)');
    embeddingPipeline = await pipeline('feature-extraction', EMBEDDING_MODEL, {
      quantized: true, // Use quantized model for faster loading
    });
    console.log('[Embedding] Model loaded successfully!');
  }
  return embeddingPipeline;
}

/**
 * Generate embedding for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<Object>} Embedding result
 */
export async function generateEmbedding(text) {
  try {
    console.log(`[EMBEDDING] Gerando embedding para texto: "${text.slice(0, 50)}..."`);
    console.log(`[EMBEDDING] Texto length: ${text.length} caracteres`);
    
    if (!text || text.trim().length === 0) {
      console.error("[EMBEDDING] ERRO: Texto vazio");
      return {
        success: false,
        error: 'Empty text provided for embedding',
        embedding: null,
      };
    }

    const pipeline = await getPipeline();

    // Truncate text if too long (max 512 tokens)
    const truncatedText = truncateText(text, 2000);
    console.log(`[EMBEDDING] Texto truncado: ${truncatedText.length} caracteres`);

    // Generate embedding
    console.log("[EMBEDDING] Executando pipeline...");
    const output = await pipeline(truncatedText, {
      pooling: 'mean',
      normalize: true,
    });

    const embedding = Array.from(output.data);
    console.log(`[EMBEDDING] Embedding gerado: ${embedding.length} dimensões`);
    
    // Validate embedding
    const hasInvalidValues = embedding.some(val => isNaN(val) || !isFinite(val));
    if (hasInvalidValues) {
      console.error("[EMBEDDING] ERRO: Embedding contém valores inválidos (NaN ou Infinity)");
      return {
        success: false,
        error: 'Embedding contains invalid values',
        embedding: null,
      };
    }

    if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
      console.error(`[EMBEDDING] ERRO: Dimensão inválida - esperado ${EMBEDDING_DIMENSION}, got ${embedding?.length || 0}`);
      throw new Error(
        `Invalid embedding dimension: expected ${EMBEDDING_DIMENSION}, got ${embedding?.length || 0}`
      );
    }

    console.log("[EMBEDDING] SUCESSO!");
    return {
      success: true,
      embedding,
      model: EMBEDDING_MODEL,
      dimension: EMBEDDING_DIMENSION,
    };
  } catch (error) {
    console.error('[EMBEDDING] ERRO CRÍTICO:', error.message);
    console.error('[EMBEDDING] Stack:', error.stack);
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

    console.log('==========================================================');
    console.log('[EMBEDDINGS] INICIANDO GERAÇÃO EM LOTE');
    console.log(`[EMBEDDINGS] Total de textos: ${texts?.length || 0}`);
    console.log(`[EMBEDDINGS] Batch size: ${batchSize}`);
    console.log('==========================================================');

    if (!texts || texts.length === 0) {
      console.error('[EMBEDDINGS] ERRO: Nenhum texto fornecido');
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
      console.log(`[EMBEDDINGS] Processando batch ${Math.floor(i / batchSize) + 1} (${batch.length} textos)...`);

      const batchResults = await Promise.all(
        batch.map((text) => generateEmbedding(text))
      );

      results.push(...batchResults);

      batchResults.forEach((result) => {
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          console.error(`[EMBEDDINGS] Falha: ${result.error}`);
        }
      });
    }

    console.log('==========================================================');
    console.log('[EMBEDDINGS] LOTE FINALIZADO');
    console.log(`[EMBEDDINGS] Sucesso: ${successCount}, Falhas: ${failureCount}`);
    console.log('==========================================================');

    return {
      success: successCount > 0,
      embeddings: results.map((r) => r.embedding),
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
 * @returns {Promise<Object>} Query embedding
 */
export async function generateQueryEmbedding(query) {
  return generateEmbedding(query);
}

/**
 * Generate embedding for document chunk
 * @param {string} chunk - Document chunk
 * @returns {Promise<Object>} Chunk embedding
 */
export async function generateChunkEmbedding(chunk) {
  return generateEmbedding(chunk);
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

  if (embedding.length !== EMBEDDING_DIMENSION) {
    return {
      valid: false,
      error: `Invalid dimension: expected ${EMBEDDING_DIMENSION}, got ${embedding.length}`,
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
    dimension: EMBEDDING_DIMENSION,
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
  EMBEDDING_DIMENSION,
  EMBEDDING_MODEL,
};
