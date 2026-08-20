/**
 * Edital Model
 * Represents an academic notice/edital with RAG chunks and embeddings
 */

import mongoose from 'mongoose';
import { performance } from 'node:perf_hooks';

const editalSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
  },
  descricao: {
    type: String,
    trim: true,
    default: '',
  },
  ano: {
    type: Number,
    required: [true, 'Ano é obrigatório'],
    min: [2000, 'Ano inválido'],
    max: [2100, 'Ano inválido'],
  },
  arquivo_url: {
    type: String,
    default: null,
  },
  
  // Campos extraídos pelo Gemini AI
  objetivo_principal: {
    type: String,
    default: '',
  },
  publico_alvo: {
    type: String,
    default: '',
  },
  vagas: {
    type: String,
    default: '',
  },
  inscricoes_periodo: {
    type: String,
    default: '',
  },
  contatos: {
    type: String,
    default: '',
  },
  palavras_chave: {
    type: [String],
    default: [],
  },
  requisitos: {
    type: String,
    default: '',
  },
  etapas: {
    type: String,
    default: '',
  },
  documentos_necessarios: {
    type: String,
    default: '',
  },
  prazos_importantes: {
    type: String,
    default: '',
  },
  metadata_json: {
    type: Object,
    default: {},
  },
  embedding_model: {
    type: String,
    default: 'local',
  },
  embedding_provider: {
    type: String,
    default: 'local', // 'local' or 'gemini'
  },
  embedding_dimension: {
    type: Number,
    default: 384, // 384 for local MiniLM, 768 for Gemini
  },
  
  // Chunks para RAG
  chunks: [{
    conteudo: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number], // Array de 384 dimensões
      default: null,
    },
    chunk_index: {
      type: Number,
      required: true,
    },
  }],
}, {
  timestamps: true,
});

// Índices para melhorar performance das buscas
editalSchema.index({ ano: 1 });
editalSchema.index({ titulo: 'text', descricao: 'text' });
editalSchema.index({ createdAt: -1 });

// Índice para busca textual nos chunks
// NOTA: MongoDB permite apenas UM índice text por coleção (já existe titulo/descricao).
// Busca nos chunks usa $regex; nenhum índice text adicional é criado.

// Índice para busca vetorial nos chunks (usando 2dsphere como workaround)
// Nota: MongoDB Atlas tem suporte nativo para vector search
// REMOVIDO: índice multikey em embedding (inútil para similaridade vetorial)

// Método para contar chunks
editalSchema.methods.getChunkCount = function() {
  return this.chunks.length;
};

// Método para obter stats dos chunks
editalSchema.methods.getRAGStats = function() {
  const chunks = this.chunks;
  const totalChunks = chunks.length;
  const chunksWithEmbeddings = chunks.filter(c => c.embedding && c.embedding.length > 0).length;
  const totalCharacters = chunks.reduce((sum, c) => sum + (c.conteudo?.length || 0), 0);
  const averageChunkSize = totalChunks > 0 ? Math.round(totalCharacters / totalChunks) : 0;
  
  return {
    totalChunks,
    chunksWithEmbeddings,
    totalCharacters,
    averageChunkSize,
  };
};

// Threshold único de similaridade (alinhado ao RAG_CONFIG do rag.service)
const SIMILARITY_THRESHOLD = 0.2;
const elapsedMs = (startedAt) => Math.round((performance.now() - startedAt) * 100) / 100;

// Escapa caracteres especiais de regex em busca textual
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Método estático para busca textual
editalSchema.statics.buscar = async function({ ano, search, limit = 20, offset = 0 }) {
  const query = {};
  
  if (ano) {
    query.ano = parseInt(ano);
  }
  
  if (search) {
    const safeSearch = escapeRegex(String(search));
    query.$or = [
      { titulo: { $regex: safeSearch, $options: 'i' } },
      { descricao: { $regex: safeSearch, $options: 'i' } },
    ];
  }
  
  const total = await this.countDocuments(query);
  
  const editais = await this.find(query)
    .sort({ createdAt: -1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit));
  
  return {
    editais,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: total > parseInt(offset) + parseInt(limit),
    },
  };
};

// Método para buscar chunks com similaridade (implementação manual)
editalSchema.statics.buscarChunksPorSimilaridade = async function(editalId, queryEmbedding, topK = 5) {
  const mongoReadStartedAt = performance.now();
  const edital = await this.findById(editalId);
  console.log(`[RAG Timing] vectorMongoRead=${elapsedMs(mongoReadStartedAt)}ms`);
  if (!edital) return [];
  
  const chunkProcessingStartedAt = performance.now();
  // Filtrar chunks com embeddings
  const chunksComEmbedding = edital.chunks.filter(c => c.embedding && c.embedding.length > 0);
  console.log(`[RAG Timing] vectorChunkProcessing=${elapsedMs(chunkProcessingStartedAt)}ms chunks=${chunksComEmbedding.length}`);
  
  const similarityStartedAt = performance.now();
  // Calcular similaridade de cosseno para cada chunk
  const chunksComSimilaridade = chunksComEmbedding.map(chunk => ({
    ...chunk.toObject(),
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));
  console.log(`[RAG Timing] vectorSimilarity=${elapsedMs(similarityStartedAt)}ms chunks=${chunksComSimilaridade.length}`);
  
  const sortStartedAt = performance.now();
  // Filtrar por threshold e ordenar
  const resultados = chunksComSimilaridade
    .filter(c => c.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
  console.log(`[RAG Timing] vectorSort=${elapsedMs(sortStartedAt)}ms chunks=${resultados.length}`);
  
  return resultados;
};

// Função de similaridade de cosseno
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Método estático para busca global em todos os editais
editalSchema.statics.buscarGlobal = async function(queryEmbedding, topK = 5) {
  const dimension = queryEmbedding?.length || 0;
  if (!dimension) return [];

  const editais = await this.find({ 'chunks.embedding': { $exists: true, $ne: null } });

  const todosChunks = [];

  editais.forEach(edital => {
    const chunksComEmbedding = edital.chunks.filter(c => c.embedding && c.embedding.length > 0);
    chunksComEmbedding.forEach(chunk => {
      // Ignora chunks com dimensão diferente da query (evita cosseno 384x768 = 0)
      if (chunk.embedding.length !== dimension) return;
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (similarity >= SIMILARITY_THRESHOLD) {
        todosChunks.push({
          ...chunk.toObject(),
          edital_id: edital._id,
          edital_titulo: edital.titulo,
          similarity,
        });
      }
    });
  });

  // Ordenar por similaridade e retornar top K
  return todosChunks
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
};

// Método para busca textual nos chunks (fallback)
editalSchema.statics.buscarChunksPorTexto = async function(searchText, editalId = null, limit = 10) {
  const query = {
    'chunks.conteudo': { $regex: escapeRegex(String(searchText)), $options: 'i' },
  };

  if (editalId) {
    query._id = editalId;
  }

  const editais = await this.find(query).limit(50);
  const resultados = [];

  for (const edital of editais) {
    for (const chunk of edital.chunks) {
      if (chunk.conteudo && chunk.conteudo.toLowerCase().includes(searchText.toLowerCase())) {
        resultados.push({
          ...chunk.toObject(),
          edital_id: edital._id,
          edital_titulo: edital.titulo,
          textMatch: true,
        });
      }
    }
  }

  return resultados.slice(0, limit);
};

const Edital = mongoose.models.Edital || mongoose.model('Edital', editalSchema);

export default Edital;
