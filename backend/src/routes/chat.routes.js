/**
 * Chat Routes
 * API endpoints for AI-powered question answering and conversation management
 */

import express from "express";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import { processQuestion, retrieveContext } from "../services/rag.service.js";
import { creditsService } from "../services/credits.service.js";
import { GEMINI_MODELS } from "../services/gemini.service.js";
import Edital from "../models/Edital.js";
import ChatLog from "../models/ChatLog.js";
import chatService from "../services/chat.service.js";
import { optionalAuthMiddleware, authMiddleware } from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import UsageLog from "../models/UsageLog.js";
import providerManager from "../services/provider-manager.js";

const router = express.Router();

const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

// Anti-abuso: cada pergunta custa (IA + créditos) — limite por IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Muitas perguntas em sequência. Aguarde um instante." },
});

/**
 * @route   POST /api/chat/pergunta
 * @desc    Ask a question about editais
 * @access  Private (requer login — anônimos são bloqueados no frontend e aqui)
 */
router.post("/pergunta", chatLimiter, authMiddleware, async (req, res) => {
  const startTime = Date.now();
  let trimmedQuestion = "";
  let campus_id = req.body.campus_id || null;
  let conversation_id = req.body.conversationId || null;

  try {
    console.log("[API] Processing chat question...");

    const { pergunta, editalId } = req.body;

    // Validate input
    if (!pergunta || typeof pergunta !== "string") {
      return res.status(400).json({
        success: false,
        error: "Pergunta é obrigatória",
      });
    }

    // Trim and validate length
    trimmedQuestion = pergunta.trim();
    if (trimmedQuestion.length < 5) {
      return res.status(400).json({
        success: false,
        error: "Pergunta muito curta. Por favor, forneça mais detalhes.",
      });
    }

    // Validar IDs malformados antes de tocar no banco (evita CastError 500)
    if (conversation_id && !isValidObjectId(conversation_id)) {
      return res.status(400).json({ success: false, error: "conversationId inválido" });
    }
    if (editalId && !isValidObjectId(editalId)) {
      return res.status(400).json({ success: false, error: "editalId inválido" });
    }

    // --- CREDIT CHECK (usuário sempre logado — authMiddleware) ---
    const creditStatus = await creditsService.checkAndConsumeCredit(req.user);
    if (!creditStatus.canProceed) {
      return res.status(403).json({
        success: false,
        error: 'Créditos esgotados',
        code: 'CREDITS_EXHAUSTED',
        reason: creditStatus.reason,
        resetIn: creditStatus.resetIn
      });
    }
    // ---------------------

    // Get or create conversation (após o cheque de crédito)
    let conversation = null;
    let userApiKey = null;
    let preferredProvider = 'gemini';

    // Fetch user with API Keys and preference
    const user = await User.findById(req.user._id).select('+gemini_api_key +groq_api_key');
    // Modo chave própria ativa: usa o provider da chave; senão a preferência do usuário
    preferredProvider = user?.usingOwnApiKey?.active && user?.usingOwnApiKey?.provider
      ? user.usingOwnApiKey.provider
      : (user?.preferred_provider || 'gemini');

    if (preferredProvider === 'groq') {
      userApiKey = user?.groq_api_key;
    } else {
      userApiKey = user?.gemini_api_key || null;
    }

    conversation = await chatService.getOrCreateConversation(
      req.user._id,
      editalId,
      conversation_id,
      trimmedQuestion
    );
    conversation_id = conversation?._id;

    // Process question through RAG pipeline (with user API key and provider preference)
    const result = await processQuestion(trimmedQuestion, editalId, {
      userApiKey,
      provider: preferredProvider
    });

    // --- CREDIT CONSUMPTION (só se houve chamada de IA) ---
    let updatedUser = null;
    if (result.success && result.metadata?.usedAI !== false) {
      updatedUser = await creditsService.decrementCredit(req.user._id);
    }
    // --------------------------

    const tempoRespostaMs = Date.now() - startTime;

    // Log interaction (always happens)
    const logData = {
      pergunta: trimmedQuestion,
      resposta: result.response || (result.success ? "" : "Erro no processamento"),
      campus_id,
      edital_id: editalId || result.metadata?.editalId || null,
      usuario_id: req.user._id,
      conversation_id,
      tempoRespostaMs,
      status: result.success ? "success" : "error",
      error_message: result.error,
      metadata: result.metadata
    };

    const log = await chatService.logChatInteraction(logData);

    // Save detailed usage log if available
    if (result.metadata?.usage) {
      UsageLog.create({
        usuario_id: req.user._id,
        provider: result.metadata.provider,
        model: result.metadata.model,
        prompt_tokens: result.metadata.usage.promptTokens,
        completion_tokens: result.metadata.usage.completionTokens,
        total_tokens: result.metadata.usage.totalTokens,
        estimated_cost: result.metadata.usage.estimatedCost,
        request_type: 'chat',
        metadata: { conversation_id, edital_id: editalId }
      }).catch(err => console.error("[API] Failed to save usage log:", err.message));
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to process question",
        code: 'AI_PROCESSING_ERROR',
      });
    }

    // O saldo retornado é sempre o valor persistido; chave própria não debita.
    const remainingAfter = creditStatus.usingOwnKey || result.metadata?.usedAI === false
      ? creditStatus.creditsRemaining
      : (updatedUser?.remainingCredits ?? Math.max(creditStatus.creditsRemaining - 1, 0));
    res.json({
      success: true,
      data: {
        id: log._id, // Return log ID for feedback
        pergunta: trimmedQuestion,
        resposta: result.response,
        fontes: result.sources,
        conversationId: conversation_id,
        creditStatus: {
          remaining: Math.max(remainingAfter, 0),
          resetIn: creditStatus.resetIn ?? 0,
          plan: creditStatus.currentPlan ?? null,
          usingOwnKey: !!creditStatus.usingOwnKey,
        },
        metadata: {
          processingTime: result.metadata.processingTime,
          chunksUsed: result.metadata.chunksUsed,
          editalId: result.metadata.editalId,
        },
      },
    });
  } catch (error) {
    console.error("[API] Chat error:", error.message);
    res.status(500).json({
      success: false,
      error: "Ops! Não consegui processar sua pergunta agora. Tenta de novo em instantes!",
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * @route   POST /api/chat/pergunta/stream
 * @desc    Ask a question with streaming response (optional)
 * @access  Public (Optional Auth)
 */
router.post("/pergunta/stream", chatLimiter, authMiddleware, async (req, res) => {
  const startTime = Date.now();
  let campus_id = req.body.campus_id || null;
  let conversation_id = req.body.conversationId || null;

  try {
    const { pergunta, editalId } = req.body;

    if (!pergunta || typeof pergunta !== "string" || pergunta.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: "Pergunta inválida",
      });
    }

    // Validar IDs malformados
    if (conversation_id && !isValidObjectId(conversation_id)) {
      return res.status(400).json({ success: false, error: "conversationId inválido" });
    }
    if (editalId && !isValidObjectId(editalId)) {
      return res.status(400).json({ success: false, error: "editalId inválido" });
    }

    // --- CREDIT CHECK (usuário sempre logado) ---
    const creditStatus = await creditsService.checkAndConsumeCredit(req.user);
    if (!creditStatus.canProceed) {
      return res.status(403).json({
        success: false,
        error: 'Créditos esgotados',
        code: 'CREDITS_EXHAUSTED',
        reason: creditStatus.reason,
        resetIn: creditStatus.resetIn
      });
    }
    // ---------------------

    // Get or create conversation
    let userApiKey = null;
    let preferredProvider = 'gemini';

    const user = await User.findById(req.user._id).select('+gemini_api_key +groq_api_key');
    // Modo chave própria ativa: usa o provider da chave; senão a preferência do usuário
    preferredProvider = user?.usingOwnApiKey?.active && user?.usingOwnApiKey?.provider
      ? user.usingOwnApiKey.provider
      : (user?.preferred_provider || 'gemini');

    if (preferredProvider === 'groq') {
      userApiKey = user?.groq_api_key;
    } else {
      userApiKey = user?.gemini_api_key || null;
    }

    const conversation = await chatService.getOrCreateConversation(
      req.user._id,
      editalId,
      conversation_id,
      pergunta
    );
    conversation_id = conversation?._id;

    // Recuperar contexto RAG real (chunks relevantes) — sem isso o stream responde sem os editais
    const { chunks } = await retrieveContext(pergunta.trim(), editalId, {
      userApiKey,
      provider: preferredProvider,
    });

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let aborted = false;
    req.on("aborted", () => { aborted = true; });
    res.on("close", () => {
      if (!res.writableEnded) aborted = true;
    });

    const stream = providerManager.streamResponse(pergunta.trim(), chunks, {
      userApiKey,
      provider: preferredProvider,
    });

    let fullResponse = "";
    let finalMetadata = null;
    let streamCompleted = false;
    let streamFailed = false;

    for await (const chunk of stream) {
      if (aborted) break;

      if (chunk.error) {
        streamFailed = true;
        res.write(`data: ${JSON.stringify({ error: chunk.error, errorCategory: chunk.errorCategory })}\n\n`);
        break;
      }

      if (chunk.done) {
        streamCompleted = true;
        finalMetadata = chunk.metadata;
        res.write(`data: ${JSON.stringify({ done: true, sources: [], metadata: finalMetadata, conversationId: conversation_id })}\n\n`);
      } else {
        fullResponse += chunk.text;
        res.write(`data: ${JSON.stringify({ word: chunk.text, done: false })}\n\n`);
      }
    }

    const streamSucceeded = creditsService.shouldConsumeStreamCredit({
      completed: streamCompleted,
      hasError: streamFailed,
      aborted,
      hasResponse: fullResponse.length > 0,
    });

    // Log e débito somente após conclusão explícita sem erro.
    if (streamSucceeded) {
      const logData = {
        pergunta,
        resposta: fullResponse,
        campus_id,
        edital_id: editalId || null,
        usuario_id: req.user?._id || null,
        conversation_id,
        tempoRespostaMs: Date.now() - startTime,
        status: "success",
        metadata: { ...(finalMetadata || {}), chunksUsed: chunks.length }
      };
      chatService.logChatInteraction(logData).catch(e => console.error("Stream log error:", e));
      await creditsService.decrementCredit(req.user._id);
    }

    res.end();
  } catch (error) {
    console.error("[API] Stream chat error:", error.message);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: "Erro ao processar a pergunta" });
    }
    res.write(`data: ${JSON.stringify({ error: "Erro ao processar a pergunta" })}\n\n`);
    res.end();
  }
});

/**
 * @route   GET /api/chat/conversas
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */
router.get("/conversas", authMiddleware, async (req, res) => {
  try {
    const conversations = await chatService.getUserConversations(req.user._id);
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error("[API] Conversations error:", error.message);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar conversas"
    });
  }
});

/**
 * @route   GET /api/chat/conversa/:id
 * @desc    Get messages for a specific conversation
 * @access  Private
 */
router.get("/conversa/:id", authMiddleware, async (req, res) => {
  try {
    const messages = await chatService.getConversationMessages(req.params.id, req.user._id);
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error("[API] Conversation messages error:", error.message);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar mensagens da conversa"
    });
  }
});

/**
 * @route   POST /api/chat/feedback
 * @desc    Submit feedback for a chat interaction
 * @access  Private (apenas o dono da interação ou admin)
 */
router.post("/feedback", authMiddleware, async (req, res) => {
  try {
    const { logId, feedback } = req.body;

    if (!logId || ![1, -1].includes(feedback)) {
      return res.status(400).json({
        success: false,
        error: "Dados de feedback inválidos",
      });
    }

    const log = await ChatLog.findById(logId);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: "Log de interação não encontrado",
      });
    }

    // Não-admin só avalia as próprias interações
    if (req.user.role !== 'admin' && log.usuario_id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Você só pode avaliar suas próprias interações",
      });
    }

    await ChatLog.findByIdAndUpdate(
      logId,
      { feedback },
      { new: true }
    );

    res.json({
      success: true,
      message: "Feedback enviado com sucesso",
    });
  } catch (error) {
    console.error("[API] Feedback error:", error.message);
    res.status(500).json({ success: false, error: "Erro ao processar feedback" });
  }
});

/**
 * @route   GET /api/chat/sugestoes/:editalId
 * @desc    Get suggested questions for an edital
 * @access  Public
 */
router.get("/sugestoes/:editalId", async (req, res) => {
  try {
    const { editalId } = req.params;
    const edital = await Edital.findById(editalId);
    
    if (!edital || edital.chunks.length === 0) {
      return res.json({
        success: true,
        data: {
          questions: [
            "Quais são os requisitos para participação?",
            "Qual é o prazo de inscrição?",
            "Quais documentos são necessários?",
            "Como funciona o processo de seleção?",
            "Quando será divulgado o resultado?",
          ],
        },
      });
    }

    const chunks = edital.chunks.slice(0, 5);
    const content = chunks.map((c) => c.conteudo).join("\n\n");

    // Hybrid Suggested Questions
    let questions = [
      "Quais são os requisitos para participação?",
      "Qual é o prazo de inscrição?",
      "Quais documentos são necessários?",
    ];

    try {
      // Use Provider Manager
      const prompt = `Com base no seguinte conteúdo de edital acadêmico, sugira 5 perguntas que estudantes frequentemente fazem (responda com uma lista numerada):\n\n${content.slice(0, 5000)}\n\nResponda apenas com as perguntas.`;
      
      const result = await providerManager.generateResponse(prompt, [], {
        provider: 'gemini',
        model: GEMINI_MODELS.FAST,
      });

      if (result.success && result.response) {
        const lines = result.response.split("\n");
        const parsed = lines
          .map(l => l.replace(/^\d+[\.\)]\s*/, "").trim())
          .filter(l => l.length > 10 && l.endsWith("?"));
        if (parsed.length > 0) questions = parsed.slice(0, 5);
      }
    } catch (err) {
      console.error("[API] Failed to generate suggestions with AI:", err.message);
    }

    res.json({
      success: true,
      data: {
        questions
      },
    });
  } catch (error) {
    console.error("[API] Suggestions error:", error.message);
    res.status(500).json({ success: false, error: "Erro ao gerar sugestões" });
  }
});

/**
 * @route   GET /api/chat/historico
 * @desc    Get audit history (Admin or user's self)
 * @access  Public (Optional Auth)
 */
router.get("/historico", optionalAuthMiddleware, async (req, res) => {
  try {
    const { editalId, campus_id } = req.query;
    // Parse seguro: evita NaN do parseInt e limite o tamanho da consulta
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const query = {};
    if (editalId) query.edital_id = editalId;
    if (campus_id) query.campus_id = campus_id;
    
    if (req.user && req.user.role !== 'admin') {
      query.usuario_id = req.user._id;
    } else if (!req.user) {
      // Public access to history should probably be restricted or empty
      return res.json({ success: true, data: [] });
    }

    const total = await ChatLog.countDocuments(query);
    const logs = await ChatLog.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('edital_id', 'titulo');

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit,
      },
    });
  } catch (error) {
    console.error("[API] History error:", error.message);
    res.status(500).json({ success: false, error: "Erro ao buscar histórico" });
  }
});

export default router;
