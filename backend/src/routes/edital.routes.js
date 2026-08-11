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
  extractTextFromPDF,
  savePDFFile,
  cleanPDFText,
  getPDFStats,
} from "../services/pdf.service.js";
import { splitTextIntoChunks, getChunkingStats } from "../services/chunk.service.js";
import { generateEmbeddings } from "../services/embedding.service.js";
import { storeEditalChunks } from "../services/rag.service.js";
import geminiService from "../services/gemini.service.js";
import providerManager from "../services/provider-manager.js";
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
    // ACEITA APENAS PDF (magic bytes são verificados no handler — o buffer
    // só existe após o stream, não no fileFilter)
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos PDF são permitidos"), false);
    }
  },
});

// Middleware de upload com tratamento de erro do multer (senão o erro 500 vaza cru)
function uploadMiddleware(req, res, next) {
  upload.single("arquivo")(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: "Arquivo muito grande. Máximo de 10MB." });
      }
      return res.status(400).json({ success: false, error: err.message || "Falha no upload" });
    }
    next();
  });
}

/**
 * @route   POST /api/edital/upload
 * @desc    Upload a new edital (PDF only) or submit manual content
 * @access  Admin Only
 */
router.post("/upload", authMiddleware, isAdmin, uploadMiddleware, async (req, res) => {
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

    // Verificar se é PDF (caso tenha arquivo) — inclui magic bytes (%PDF),
    // pois o MIME declarado pelo cliente pode ser forjado
    const isPDF = !!(req.file && req.file.mimetype === 'application/pdf');
    if (req.file && req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        error: "Apenas arquivos PDF são permitidos",
      });
    }
    if (req.file) {
      const buf = req.file.buffer;
      const magicOk = buf && buf.length >= 5 &&
        buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46; // %PDF
      if (!magicOk) {
        return res.status(400).json({
          success: false,
          error: "O arquivo enviado não é um PDF válido",
        });
      }
    }

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
    editalId = edital._id; // CORREÇÃO: antes ficava null e o armazenamento de chunks falhava

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
      console.error("[API] AI extraction failed:", mainPointsResult.error, "- usando dados básicos");
      // Fallback: primeira frase significativa como objetivo (evita card vazio)
      const firstSentence = cleanedText
        .split(/\n+/)
        .map(s => s.trim())
        .find(s => s.length > 30) || cleanedText.slice(0, 300);
      edital.descricao = descricao || firstSentence;
      edital.objetivo_principal = descricao || firstSentence;
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
          provider: 'gemini'
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
    console.error("[API] Upload error:", error.message);

    if (editalId) {
      console.log(`[API] Cleaning up: deleting edital ${editalId}`);
      await Edital.findByIdAndDelete(editalId);
    }

    res.status(500).json({
      success: false,
      error: "Falha ao processar o edital. Tente novamente.",
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
    console.error("[API] Delete edital error:", error.message);
    res.status(500).json({
      success: false,
      error: "Erro ao excluir edital",
    });
  }
});

export default router;

