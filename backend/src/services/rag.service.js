/**
 * RAG (Retrieval-Augmented Generation) Service
 * Orchestrates the complete RAG pipeline for question answering
 *
 * @description Main service combining retrieval and generation with
 * query expansion and hybrid search for better recall
 */

import Edital from "../models/Edital.js";
import { generateQueryEmbedding, cosineSimilarity } from "./embedding.service.js";
import { generateResponse } from "./groq.service.js";
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
 * Process a question using RAG pipeline with query expansion and hybrid search
 * @param {string} question - User question
 * @param {string} editalId - Optional specific edital ID
 * @returns {Promise<Object>} RAG response with sources
 */
export async function processQuestion(question, editalId = null) {
  const startTime = Date.now();

  try {
    console.log(`[RAG] Processing question: "${question.slice(0, 50)}..."`);
    console.log(`[RAG] Edital ID: ${editalId || 'TODOS OS EDITAIS'}`);

    // Step 0: Query expansion - gerar variações da pergunta
    console.log("[RAG] Step 0: Expanding query with synonyms and variations...");
    const expandedQueries = generateSearchQueries(question);
    console.log(`[RAG] Generated ${expandedQueries.queries.length} query variations`);
    console.log(`[RAG] Keywords: ${expandedQueries.keywords.join(', ')}`);

    // Step 1: Generate embedding for the original question
    console.log("[RAG] Step 1: Generating question embedding...");
    const embeddingResult = await generateQueryEmbedding(question);

    if (!embeddingResult.success) {
      console.error("[RAG] ERRO: Falha ao gerar embedding:", embeddingResult.error);
      throw new Error(
        `Failed to generate question embedding: ${embeddingResult.error}`,
      );
    }
    console.log("[RAG] EMBEDDING GERADO COM SUCESSO");
    console.log(`[RAG] Embedding size: ${embeddingResult.embedding?.length || 0} dimensões`);

    // Step 2: Retrieve relevant chunks from database (with expanded queries)
    console.log("[RAG] Step 2: Retrieving relevant chunks with hybrid search...");
    let chunks = await retrieveRelevantChunksHybrid(
      embeddingResult.embedding,
      expandedQueries,
      editalId,
    );

    console.log(`[RAG] RESULTADOS DA BUSCA: ${chunks.length} chunks encontrados`);

    // Step 3: If no chunks found, try keyword-only fallback
    if (chunks.length === 0) {
      console.log("[RAG] Step 2b: Fallback to keyword-only search...");
      chunks = await retrieveByKeywords(expandedQueries.keywords, editalId);
      console.log(`[RAG] KEYWORD FALLBACK: ${chunks.length} chunks encontrados`);
    }

    if (chunks.length === 0) {
      console.warn("[RAG] NENHUM CHUNK ENCONTRADO - Retornando mensagem de erro");
      return {
        success: true,
        response:
          "Não encontrei essa informação nos editais disponíveis 😕 Tenta reformular sua pergunta ou ser mais específico sobre o que você quer saber!",
        sources: [],
        metadata: {
          processingTime: Date.now() - startTime,
          chunksRetrieved: 0,
          editalId,
          fallbackUsed: true,
          expandedQueries: expandedQueries.queries.length,
        },
      };
    }

    // Step 4: Filter and rank chunks (with hybrid scoring)
    console.log("[RAG] Step 3: Filtering and ranking chunks with hybrid scoring...");
    const filteredChunks = filterAndRankChunksHybrid(
      chunks,
      expandedQueries.keywords,
      question,
    );
    console.log(`[RAG] CHUNKS FILTRADOS: ${filteredChunks.length} chunks após filtragem`);

    // Step 5: Generate response using Groq
    console.log("[RAG] Step 4: Generating AI response...");
    const contextText = filteredChunks.map(c => c.conteudo).join('\n\n');
    console.log(`[RAG] CONTEXTO PARA IA: ${contextText.length} caracteres`);
    const responseResult = await generateResponse(question, filteredChunks);

    if (!responseResult.success) {
      throw new Error(`Failed to generate response: ${responseResult.error}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[RAG] Pipeline completed in ${processingTime}ms`);

    return {
      success: true,
      response: responseResult.response,
      sources: formatSources(filteredChunks),
      metadata: {
        processingTime,
        chunksRetrieved: chunks.length,
        chunksUsed: filteredChunks.length,
        editalId,
        model: responseResult.metadata?.model,
        fallbackUsed: chunks.some(c => c.method === 'keyword'),
        expandedQueries: expandedQueries.queries.length,
        keywordsUsed: expandedQueries.keywords,
      },
    };
  } catch (error) {
    console.error("[RAG] Pipeline error:", error);
    return {
      success: false,
      error: error.message,
      response:
        "Ops! Algo deu errado ao processar sua pergunta 😅 Tenta de novo em instantes!",
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
 * @param {Array<number>} embedding - Primary query embedding
 * @param {Object} expandedQueries - Expanded query variations
 * @param {string} editalId - Optional edital filter
 * @returns {Promise<Array<Object>>} Relevant chunks
 */
async function retrieveRelevantChunksHybrid(embedding, expandedQueries, editalId = null) {
  try {
    console.log(`[RAG] Busca híbrida: editalId=${editalId || 'null'}`);
    console.log(`[RAG] Query expansions: ${expandedQueries.queries.length}`);

    let allChunks = [];

    // Busca vetorial principal
    if (editalId) {
      allChunks = await Edital.buscarChunksPorSimilaridade(
        editalId,
        embedding,
        RAG_CONFIG.topK,
      );
    } else {
      allChunks = await Edital.buscarGlobal(embedding, RAG_CONFIG.topK);
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

      // Mesclar resultados (evitando duplicatas por chunk_index + edital_id)
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
