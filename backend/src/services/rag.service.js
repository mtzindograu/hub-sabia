/**
 * RAG (Retrieval-Augmented Generation) Service
 * Orchestrates the complete RAG pipeline for question answering
 *
 * @description Main service combining retrieval and generation with
 * query expansion and hybrid search for better recall
 */

import Edital from "../models/Edital.js";
import { generateQueryEmbedding } from "./embedding.service.js";
import providerManager, { GEMINI_MODELS } from "./provider-manager.js";
import { generateSearchQueries, calculateTextRelevance } from "./query-expansion.service.js";

// RAG Configuration - Improved for better recall
const RAG_CONFIG = {
  topK: 10, // Aumentado de 5 para 10 para mais contexto
  similarityThreshold: 0.2, // Reduzido de 0.3 para 0.2 para mais recall
  maxContextLength: 12000, // Aumentado de 8000 para mais contexto
  minChunksForAnswer: 1,
  keywordFallbackThreshold: 0.15, // Se similaridade vetorial < 0.15, usa fallback
};

/**
 * Process a question using RAG pipeline with hybrid search and hybrid AI provider
 * @param {string} question - User question
 * @param {string} editalId - Optional specific edital ID
 * @param {Object} options - Options including userApiKey
 * @returns {Promise<Object>} RAG response with sources
 */
export async function processQuestion(question, editalId = null, options = {}) {
  const startTime = Date.now();
  const { userApiKey = null } = options;

  try {
    console.log(`[RAG] Processing question: "${question.slice(0, 50)}..."`);
    
    // Step 0: Query expansion - gerar variações da pergunta
    const expandedQueries = generateSearchQueries(question);

    // Step 1 & 2: Retrieve relevant chunks from database (Hybrid Search + Hybrid AI)
    console.log("[RAG] Step 1 & 2: Retrieving relevant chunks...");
    let chunks = await retrieveRelevantChunksHybrid(
      question,
      expandedQueries,
      editalId,
      { userApiKey }
    );

    // Step 3: If no chunks found, try keyword-only fallback
    if (chunks.length === 0) {
      chunks = await retrieveByKeywords(expandedQueries.keywords, editalId);
    }

    if (chunks.length === 0) {
      return {
        success: true,
        response: "Não encontrei essa informação nos editais disponíveis 😕 Tenta reformular sua pergunta ou ser mais específico!",
        sources: [],
        metadata: {
          processingTime: Date.now() - startTime,
          chunksRetrieved: 0,
        },
      };
    }

    // Step 4: Filter and rank chunks
    const filteredChunks = filterAndRankChunksHybrid(chunks, expandedQueries.keywords, question);

    // Step 5: Generate response using Selected AI Provider
    console.log("[RAG] Step 5: Generating AI response...");
    
    console.log(`[RAG DEBUG] Received Options: provider=${options.provider}, userApiKey=${!!options.userApiKey}`);
    console.log(`[RAG] Using Provider: ${options.provider || 'default'}...`);
    const responseResult = await providerManager.generateResponse(question, filteredChunks, { ...options, userApiKey });

    if (!responseResult.success) {
      throw new Error(`AI Provider failed: ${responseResult.error}`);
    }

    return {
      success: true,
      response: responseResult.response,
      sources: formatSources(filteredChunks),
      metadata: {
        processingTime: Date.now() - startTime,
        chunksRetrieved: chunks.length,
        chunksUsed: filteredChunks.length,
        editalId,
        provider: responseResult.metadata?.provider || "unknown",
        model: responseResult.metadata?.model,
        usage: responseResult.metadata?.usage,
      },
    };
  } catch (error) {
    console.error("[RAG] Pipeline error:", error);
    return {
      success: false,
      error: error.message,
      response: "Ops! Algo deu errado ao processar sua pergunta 😅 Tenta de novo em instantes!",
      sources: [],
      metadata: {
        processingTime: Date.now() - startTime,
        error: error.message,
      },
    };
  }
}

/**
 * Retrieve relevant chunks using HYBRID search (vector + query expansion)
 * @param {string} question - User question
 * @param {Object} expandedQueries - Expanded query variations
 * @param {string} editalId - Optional edital filter
 * @param {Object} options - Options including userApiKey
 * @returns {Promise<Array<Object>>} Relevant chunks
 */
async function retrieveRelevantChunksHybrid(question, expandedQueries, editalId = null, options = {}) {
  try {
    const { userApiKey = null } = options;
    console.log(`[RAG] Busca híbrida: editalId=${editalId || 'null'}`);

    let allChunks = [];

    // Case 1: Specific Edital
    if (editalId) {
      const edital = await Edital.findById(editalId);
      if (!edital) throw new Error("Edital not found");

      const model = edital.embedding_model || 'local';
      console.log(`[RAG] Edital usa modelo: ${model}`);

      const embeddingResult = await generateQueryEmbedding(question, { userApiKey, model });
      if (embeddingResult.success) {
        allChunks = await Edital.buscarChunksPorSimilaridade(
          editalId,
          embeddingResult.embedding,
          RAG_CONFIG.topK,
        );
      }
    } 
    // Case 2: Global Search (across multiple editais)
    else {
      // Find all unique embedding models in the database
      const models = await Edital.distinct("embedding_model");
      const modelsToUse = models.length > 0 ? models : ['local'];
      
      console.log(`[RAG] Busca global em modelos: ${modelsToUse.join(', ')}`);

      // Generate embeddings for each model and search
      for (const model of modelsToUse) {
        const embeddingResult = await generateQueryEmbedding(question, { userApiKey, model });
        if (embeddingResult.success) {
          const chunks = await Edital.buscarGlobal(embeddingResult.embedding, RAG_CONFIG.topK);
          // Only add chunks that match this model's expected dimension (double check)
          allChunks.push(...chunks);
        }
      }
      
      // Deduplicate and re-sort if multiple models returned same chunks (unlikely but possible if logic changes)
      const seen = new Set();
      allChunks = allChunks.filter(c => {
        const key = `${c.edital_id}-${c.chunk_index}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort((a, b) => b.similarity - a.similarity).slice(0, RAG_CONFIG.topK);
    }

    console.log(`[RAG] Busca vetorial retornou ${allChunks.length} chunks`);

    // Marcar método de busca
    allChunks.forEach(c => { c.method = 'vector'; });

    // Se poucos resultados, tentar com queries expandidas (busca textual no MongoDB)
    if (allChunks.length < RAG_CONFIG.topK / 2) {
      console.log('[RAG] Poucos resultados vetoriais, buscando com queries expandidas...');
      const keywordChunks = await retrieveByKeywords(
        expandedQueries.keywords,
        editalId,
      );

      // Mesclar resultados
      const seen = new Set(allChunks.map(c => `${c.edital_id || editalId}-${c.chunk_index}`));
      for (const chunk of keywordChunks) {
        const key = `${chunk.edital_id || editalId}-${chunk.chunk_index}`;
        if (!seen.has(key)) {
          chunk.method = 'expanded-text';
          chunk.similarity = chunk.textRelevance || 0;
          allChunks.push(chunk);
          seen.add(key);
        }
      }
    }

    return allChunks;
  } catch (error) {
    console.error("[RAG] Erro na busca híbrida:", error.message);
    return [];
  }
}

/**
 * Fallback: buscar apenas por palavras-chave (sem embedding)
 * @param {Array<string>} keywords - Keywords para busca
 * @param {string} editalId - Optional edital filter
 * @returns {Promise<Array<Object>>} Relevant chunks
 */
async function retrieveByKeywords(keywords, editalId = null) {
  try {
    if (!keywords || keywords.length === 0) return [];

    console.log(`[RAG] Keyword fallback: buscando por ${keywords.length} keywords`);

    const allResults = [];

    // Buscar por cada keyword individualmente
    for (const keyword of keywords) {
      if (keyword.length < 3) continue; // Skip muito curtas

      const chunks = await Edital.buscarChunksPorTexto(keyword, editalId, RAG_CONFIG.topK);

      for (const chunk of chunks) {
        const relevance = calculateTextRelevance(chunk.conteudo, keywords);

        // Evitar duplicatas
        const existingKey = `${chunk.edital_id}-${chunk.chunk_index}`;
        if (!allResults.find(r => `${r.edital_id}-${r.chunk_index}` === existingKey)) {
          allResults.push({
            ...chunk,
            textRelevance: relevance,
            similarity: relevance,
            method: 'keyword',
          });
        }
      }
    }

    // Ordenar por relevância textual e retornar top K
    return allResults
      .sort((a, b) => b.textRelevance - a.textRelevance)
      .slice(0, RAG_CONFIG.topK);
  } catch (error) {
    console.error("[RAG] Erro no fallback por keywords:", error.message);
    return [];
  }
}

/**
 * Filter and rank chunks with HYBRID scoring (vector + textual)
 * @param {Array<Object>} chunks - Retrieved chunks
 * @param {Array<string>} keywords - Query keywords
 * @param {string} question - Original question
 * @returns {Array<Object>} Filtered and ranked chunks
 */
function filterAndRankChunksHybrid(chunks, keywords, question) {
  // Começa com todos os chunks
  let filtered = [...chunks];

  // Aplicar threshold mais baixo para recall
  filtered = filtered.filter(
    (chunk) => (chunk.similarity || 0) >= RAG_CONFIG.similarityThreshold,
  );

  // Calcular relevância textual para cada chunk
  filtered.forEach(chunk => {
    chunk.textRelevance = calculateTextRelevance(chunk.conteudo, keywords);

    // Score combinado: 65% vetorial + 35% textual
    // Boost se chunk tiver match textual forte
    const vectorScore = chunk.similarity || 0;
    const textBoost = chunk.textRelevance * 0.35;
    chunk.combinedScore = vectorScore + textBoost;
  });

  // Ordenar por score combinado
  filtered.sort((a, b) => b.combinedScore - a.combinedScore);

  // Limitar comprimento total do contexto
  let totalLength = 0;
  filtered = filtered.filter((chunk) => {
    if (totalLength + chunk.conteudo.length <= RAG_CONFIG.maxContextLength) {
      totalLength += chunk.conteudo.length;
      return true;
    }
    return false;
  });

  console.log(`[RAG] Hybrid ranking: ${filtered.length} chunks, scores: ${filtered.slice(0, 3).map(c => c.combinedScore?.toFixed(3)).join(', ')}`);

  return filtered;
}

/**
 * Format sources for API response
 * @param {Array<Object>} chunks - Source chunks
 * @returns {Array<Object>} Formatted sources
 */
function formatSources(chunks) {
  return chunks.map((chunk) => ({
    id: chunk._id?.toString() || chunk.id,
    editalId: chunk.edital_id?.toString() || chunk.editalId,
    editalTitulo: chunk.edital_titulo || chunk.editalTitulo || "Edital",
    excerpt:
      chunk.conteudo.slice(0, 200) + (chunk.conteudo.length > 200 ? "..." : ""),
    similarity: chunk.similarity,
    relevance: getRelevanceLabel(chunk.similarity),
  }));
}

/**
 * Get relevance label based on similarity score
 * @param {number} similarity - Similarity score
 * @returns {string} Relevance label
 */
function getRelevanceLabel(similarity) {
  if (similarity >= 0.8) return "Alta";
  if (similarity >= 0.6) return "Média";
  return "Baixa";
}

/**
 * Process and store an edital document
 * @param {string} editalId - Edital ID
 * @param {Array<Object>} chunks - Text chunks
 * @param {Array<Array<number>>} embeddings - Chunk embeddings
 * @returns {Promise<Object>} Storage result
 */
export async function storeEditalChunks(editalId, chunks, embeddings) {
  try {
    const edital = await Edital.findById(editalId);
    
    if (!edital) {
      throw new Error('Edital not found');
    }

    // Clear existing chunks
    edital.chunks = [];

    // Add new chunks
    chunks.forEach((chunk, index) => {
      edital.chunks.push({
        conteudo: chunk.conteudo,
        embedding: embeddings?.[index] || null,
        chunk_index: chunk.index,
      });
    });

    await edital.save();

    return {
      success: true,
      chunksStored: edital.chunks.length,
    };
  } catch (error) {
    console.error("Error storing chunks:", error);

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete all chunks for an edital
 * @param {string} editalId - Edital ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteEditalChunks(editalId) {
  try {
    const edital = await Edital.findById(editalId);
    
    if (!edital) {
      throw new Error('Edital not found');
    }

    edital.chunks = [];
    await edital.save();

    return { success: true };
  } catch (error) {
    console.error("Error deleting chunks:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get RAG statistics for an edital
 * @param {string} editalId - Edital ID
 * @returns {Promise<Object>} Statistics
 */
export async function getEditalRAGStats(editalId) {
  try {
    const edital = await Edital.findById(editalId);
    
    if (!edital) {
      throw new Error('Edital not found');
    }

    return {
      success: true,
      stats: edital.getRAGStats(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  processQuestion,
  storeEditalChunks,
  deleteEditalChunks,
  getEditalRAGStats,
  RAG_CONFIG,
};
