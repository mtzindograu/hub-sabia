/**
 * Edital Routes
 * API endpoints for academic notice management
 *
 * @description Handles PDF upload and manual content submission
 */

import express from "express";
import multer from "multer";
import Edital from "../models/Edital.js";
import { authMiddleware, isAdmin } from "../middleware/auth.middleware.js";
import {
  validatePDF,
  extractTextFromPDF,
  savePDFFile,
  cleanPDFText,
  getPDFStats,
} from "../services/pdf.service.js";
import { splitTextIntoChunks, getChunkingStats } from "../services/chunk.service.js";
import { generateEmbeddings } from "../services/embedding.service.js";
import { storeEditalChunks } from "../services/rag.service.js";
import geminiService from "../services/gemini.service.js";
import User from "../models/User.js";

const router = express.Router();

// Configure multer for file uploads (PDF only)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // ACEITA APENAS PDF
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos PDF são permitidos"), false);
    }
  },
});

/**
 * @route   POST /api/edital/upload
 * @desc    Upload a new edital (PDF only) or submit manual content
 * @access  Admin Only
 */
router.post("/upload", authMiddleware, isAdmin, upload.single("arquivo"), async (req, res) => {
  let editalId = null;

  try {
    console.log("[API] Processing edital upload...");
    console.log("[API] Request body:", req.body);
    console.log("[API] File:", req.file ? req.file.originalname : 'No file');

    // Validate request
    const { titulo, descricao, ano, conteudo_manual } = req.body;

    if (!titulo || !ano) {
      return res.status(400).json({
        success: false,
        error: "Título e ano são obrigatórios",
      });
    }

    // Validação: OU tem arquivo PDF OU tem conteúdo manual
    if (!req.file && (!conteudo_manual || conteudo_manual.trim().length < 100)) {
      return res.status(400).json({
        success: false,
        error: "É necessário enviar um arquivo PDF OU o conteúdo do edital no campo de texto (mínimo 100 caracteres)",
      });
    }

    // Verificar se é PDF (caso tenha arquivo)
    if (req.file && req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        error: "Apenas arquivos PDF são permitidos",
      });
    }

    const isPDF = req.file && req.file.mimetype === 'application/pdf';

    // Step 1: Save file (if PDF provided)
    console.log("[API] Step 1: Saving file...");
    let fileResult = { url: null };

    if (isPDF) {
      console.log("[API] PDF enviado, salvando arquivo...");
      fileResult = await savePDFFile(
        req.file.buffer,
        req.file.originalname,
      );
      console.log("[API] File saved:", fileResult);
      if (!fileResult.success) {
        throw new Error("Failed to save file");
      }
    } else {
      console.log("[API] Sem PDF, usando conteúdo manual");
    }

    // Step 2: Extract text from file OR use manual content
    console.log("==========================================================");
    console.log("[API] Step 2: Processing content...");

    let extractedText = '';
    let extractionMethod = 'manual';

    if (isPDF) {
      console.log(`[API] Tipo de arquivo: PDF`);
      console.log(`[API] Tamanho do buffer: ${req.file.buffer.length} bytes`);

      // Extract text from PDF
      const extractionResult = await extractTextFromPDF(req.file.buffer, req.file.originalname);
      extractedText = extractionResult.text;
      extractionMethod = extractionResult.metadata?.method || 'pdf-extraction';

      console.log("==========================================================");
      console.log("[API] RESULTADO DA EXTRAÇÃO DO PDF:");
      console.log(`[API] Método: ${extractionMethod}`);
      console.log(`[API] Texto extraído: ${extractedText?.length || 0} caracteres`);
      console.log(`[API] Preview: "${extractedText?.slice(0, 200) || 'NENHUM TEXTO'}..."`);
      console.log("==========================================================");
    }

    // PRIORIDADE: Se conteúdo manual foi fornecido, usar ele
    let cleanedText = '';

    if (conteudo_manual && conteudo_manual.trim().length > 100) {
      console.log("[API] >>> USANDO CONTEÚDO MANUAL FORNECIDO PELO USUÁRIO <<<");
      cleanedText = cleanPDFText(conteudo_manual);
      extractionMethod = 'manual';
    } else {
      cleanedText = cleanPDFText(extractedText);
    }

    const stats = getPDFStats(cleanedText);

    console.log(`[API] Texto final: ${stats.characterCount} caracteres, ${stats.wordCount} palavras`);

    if (cleanedText.length === 0) {
      console.error("[API] ERRO CRÍTICO: Texto final está VAZIO!");
      return res.status(400).json({
        success: false,
        error: "Não foi possível extrair texto do PDF. Por favor, use o campo de conteúdo manual.",
      });
    }

    // Step 3: Insert edital record into database
    console.log("[API] Step 3: Creating edital record...");
    
    const editalData = {
      titulo,
      descricao: descricao || "",
      ano: parseInt(ano),
      arquivo_url: fileResult.url,
    };

    const edital = new Edital(editalData);
    await edital.save();

    // Fetch user's Gemini API key
    const user = await User.findById(req.user.id).select('+gemini_api_key');
    const userApiKey = user?.gemini_api_key;

    // Step 4: Extract main points using Gemini
    console.log("[API] Step 4: Extracting main points with Gemini...");

    let mainPointsResult = await geminiService.extractMainPoints(cleanedText, { userApiKey });
    
    if (mainPointsResult.success) {
      console.log("[API] Main points extracted successfully");

      // Converter tudo para string para evitar erros de validação
      const data = mainPointsResult.data;

      // Update edital with extracted metadata
      edital.descricao = String(data.objetivo_principal || descricao || '');
      edital.objetivo_principal = String(data.objetivo_principal || '');
      edital.publico_alvo = String(data.publico_alvo || '');
      edital.vagas = String(data.vagas || '');
      edital.inscricoes_periodo = String(data.inscricoes_periodo || '');
      edital.contatos = typeof data.contatos === 'object' ? JSON.stringify(data.contatos) : String(data.contatos || '');
      edital.palavras_chave = Array.isArray(data.palavras_chave) ? data.palavras_chave : [];
      edital.requisitos = Array.isArray(data.requisitos) ? data.requisitos.join('\n') : String(data.requisitos || '');
      edital.etapas = Array.isArray(data.etapas) ? data.etapas.join('\n') : String(data.etapas || '');
      edital.documentos_necessarios = Array.isArray(data.documentos_necessarios) ? data.documentos_necessarios.join('\n') : String(data.documentos_necessarios || '');
      edital.prazos_importantes = Array.isArray(data.prazos_importantes) ? data.prazos_importantes.join('\n') : String(data.prazos_importantes || '');
      edital.metadata_json = { ...data, source: isPDF ? 'pdf' : 'manual' };

      await edital.save();

      console.log("[API] Edital metadata updated");
    } else {
      console.error("[API] All AI extraction failed, using basic data");
      edital.descricao = descricao || cleanedText.slice(0, 500);
      edital.objetivo_principal = descricao || cleanedText.slice(0, 500);
      await edital.save();
    }

    // Step 5: Split text into chunks
    console.log("[API] Step 5: Splitting text into chunks...");
    const chunks = splitTextIntoChunks(cleanedText, {
      chunkSize: 800,
      chunkOverlap: 150,
      minChunkSize: 50,
    });

    const chunkStats = getChunkingStats(chunks);
    console.log(`[API] Created ${chunks.length} chunks`);

    // If no chunks created, create a single chunk with available text
    if (chunks.length === 0) {
      console.log("[API] No chunks created, creating single chunk with available text...");
      chunks.push({
        index: 0,
        conteudo: cleanedText || "[Conteúdo não pôde ser extraído deste arquivo]",
        wordCount: cleanedText?.split(/\s+/).length || 0,
        characterCount: cleanedText?.length || 0,
        hasPreviousContext: false,
      });
    }

    // Step 6: Generate embeddings for all chunks
    console.log("[API] Step 6: Generating embeddings...");
    const chunkTexts = chunks.map((chunk) => chunk.conteudo);
    const embeddingsResult = await generateEmbeddings(chunkTexts, {
      batchSize: 5,
      delayBetweenBatches: 200,
      userApiKey, // Pass the API key here
    });

    // Continue even if embeddings fail
    if (!embeddingsResult.success || embeddingsResult.successCount === 0) {
      console.warn("[API] Embeddings generation failed, continuing without embeddings");
    }

    console.log(`[API] Generated ${embeddingsResult.successCount} embeddings`);

    // Step 7: Store chunks with embeddings in database
    console.log("[API] Step 7: Storing chunks in database...");

    // Store used model
    edital.embedding_model = embeddingsResult.model || 'local';
    await edital.save();

    // Use null embeddings if generation failed
    const embeddingsToUse = embeddingsResult.success && embeddingsResult.embeddings.length > 0
      ? embeddingsResult.embeddings
      : chunks.map(() => null);

    const storeResult = await storeEditalChunks(editalId, chunks, embeddingsToUse);

    if (!storeResult.success) {
      throw new Error(`Failed to store chunks: ${storeResult.error}`);
    }

    // Generate summary in background (don't wait)
    const generateSummary = async () => {
      try {
        const result = await providerManager.generateEditalSummary(cleanedText, { 
          userApiKey,
          provider: preferredProvider
        });
        
        if (result.success) {
          await Edital.findByIdAndUpdate(editalId, { descricao: result.summary.slice(0, 2000) });
          console.log("[API] Edital summary updated");
        }
      } catch (err) {
        console.warn("[API] Failed to update summary:", err.message);
      }
    };
    
    generateSummary();

    // Response
    console.log("[API] Upload complete!");
    res.status(201).json({
      success: true,
      message: "Edital uploaded and processed successfully",
      data: {
        edital: {
          id: edital._id.toString(),
          titulo: edital.titulo,
          descricao: edital.descricao,
          ano: edital.ano,
          arquivoUrl: fileResult.url,
          createdAt: edital.createdAt,
        },
        processing: {
          method: extractionMethod,
          hasPDF: isPDF,
          chunks: chunks.length,
          embeddingsGenerated: embeddingsResult?.successCount || 0,
        },
      },
    });

  } catch (error) {
    console.error("[API] Upload error:", error);

    if (editalId) {
      console.log(`[API] Cleaning up: deleting edital ${editalId}`);
      await Edital.findByIdAndDelete(editalId);
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to process edital",
    });
  }
});

/**
 * @route   GET /api/editais
 * @desc    List all editais with full metadata
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const { ano, search, limit = 20, offset = 0 } = req.query;

    const result = await Edital.buscar({ ano, search, limit, offset });

    const editaisWithStats = result.editais.map(edital => ({
      id: edital._id.toString(),
      titulo: edital.titulo,
      descricao: edital.descricao,
      ano: edital.ano,
      arquivoUrl: edital.arquivo_url,
      objetivo_principal: edital.objetivo_principal,
      publico_alvo: edital.publico_alvo,
      vagas: edital.vagas,
      inscricoes_periodo: edital.inscricoes_periodo,
      contatos: edital.contatos,
      palavras_chave: edital.palavras_chave || [],
      requisitos: typeof edital.requisitos === 'string'
        ? edital.requisitos.split('\n').filter(r => r.trim())
        : (edital.requisitos || []),
      etapas: typeof edital.etapas === 'string'
        ? edital.etapas.split('\n').filter(e => e.trim())
        : (edital.etapas || []),
      documentos_necessarios: typeof edital.documentos_necessarios === 'string'
        ? edital.documentos_necessarios.split('\n').filter(d => d.trim())
        : (edital.documentos_necessarios || []),
      prazos_importantes: typeof edital.prazos_importantes === 'string'
        ? edital.prazos_importantes.split('\n').filter(p => p.trim())
        : (edital.prazos_importantes || []),
      chunkCount: edital.getChunkCount(),
      createdAt: edital.createdAt,
      updatedAt: edital.updatedAt,
    }));

    res.json({
      success: true,
      data: editaisWithStats,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[API] List editais error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Normalize edital data for consistent response
 * Converts strings back to arrays when needed
 */
function normalizeEditalData(edital) {
  const data = edital.toObject ? edital.toObject() : edital;
  
  return {
    ...data,
    // Converter strings de volta para arrays
    requisitos: typeof data.requisitos === 'string' 
      ? data.requisitos.split('\n').filter(r => r.trim()) 
      : (data.requisitos || []),
    etapas: typeof data.etapas === 'string'
      ? data.etapas.split('\n').filter(e => e.trim())
      : (data.etapas || []),
    documentos_necessarios: typeof data.documentos_necessarios === 'string'
      ? data.documentos_necessarios.split('\n').filter(d => d.trim())
      : (data.documentos_necessarios || []),
    prazos_importantes: typeof data.prazos_importantes === 'string'
      ? data.prazos_importantes.split('\n').filter(p => p.trim())
      : (data.prazos_importantes || []),
    // Manter contatos como string ou converter objeto
    contatos: typeof data.contatos === 'object' && data.contatos !== null
      ? JSON.stringify(data.contatos)
      : (data.contatos || '')
  };
}

/**
 * @route   GET /api/edital/:id
 * @desc    Get a specific edital with statistics
 * @access  Public
 */
router.get("/edital/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const edital = await Edital.findById(id);

    if (!edital) {
      return res.status(404).json({
        success: false,
        error: "Edital not found",
      });
    }

    // Normalizar dados antes de retornar
    const normalizedEdital = normalizeEditalData(edital);

    res.json({
      success: true,
      data: {
        id: normalizedEdital._id.toString(),
        titulo: normalizedEdital.titulo,
        descricao: normalizedEdital.descricao,
        ano: normalizedEdital.ano,
        arquivoUrl: normalizedEdital.arquivo_url,
        objetivo_principal: normalizedEdital.objetivo_principal,
        publico_alvo: normalizedEdital.publico_alvo,
        vagas: normalizedEdital.vagas,
        inscricoes_periodo: normalizedEdital.inscricoes_periodo,
        contatos: normalizedEdital.contatos,
        palavras_chave: normalizedEdital.palavras_chave,
        requisitos: normalizedEdital.requisitos,
        etapas: normalizedEdital.etapas,
        documentos_necessarios: normalizedEdital.documentos_necessarios,
        prazos_importantes: normalizedEdital.prazos_importantes,
        createdAt: normalizedEdital.createdAt,
        updatedAt: normalizedEdital.updatedAt,
        ragStats: edital.getRAGStats(),
      },
    });
  } catch (error) {
    console.error("[API] Get edital error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/edital/:id
 * @desc    Delete an edital and its chunks
 * @access  Admin Only
 */
router.delete("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[ADMIN] User ${req.user.email} deleting edital ${id}`);

    const deletedEdital = await Edital.findByIdAndDelete(id);

    if (!deletedEdital) {
      return res.status(404).json({
        success: false,
        error: "Edital not found",
      });
    }

    res.json({
      success: true,
      message: "Edital deleted successfully",
    });
  } catch (error) {
    console.error("[API] Delete edital error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/edital/:id/chunks
 * @desc    Get chunks for a specific edital
 * @access  Public
 */
router.get("/edital/:id/chunks", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const edital = await Edital.findById(id);

    if (!edital) {
      return res.status(404).json({
        success: false,
        error: "Edital not found",
      });
    }

    // Sort chunks by index and apply pagination
    const sortedChunks = edital.chunks.sort((a, b) => a.chunk_index - b.chunk_index);
    
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedChunks = sortedChunks.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedChunks.map((chunk) => ({
        id: chunk._id.toString(),
        index: chunk.chunk_index,
        conteudo: chunk.conteudo,
        wordCount: chunk.conteudo.split(/\s+/).length,
        createdAt: chunk._id.getTimestamp(),
      })),
      pagination: {
        total: sortedChunks.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("[API] Get chunks error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

