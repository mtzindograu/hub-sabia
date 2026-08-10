/**
 * Chat Routes
 * API endpoints for AI-powered question answering and conversation management
 */

import express from "express";
import { processQuestion } from "../services/rag.service.js";
import { creditsService } from "../services/credits.service.js";
import geminiService, { GEMINI_MODELS } from "../services/gemini.service.js";
import Edital from "../models/Edital.js";
import ChatLog from "../models/ChatLog.js";
import chatService from "../services/chat.service.js";
import { optionalAuthMiddleware, authMiddleware } from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import UsageLog from "../models/UsageLog.js";
import providerManager from "../services/provider-manager.js";

const router = express.Router();

/**
 * @route   POST /api/chat/pergunta
 * @desc    Ask a question about editais
 * @access  Public (Optional Auth)
 */
router.post("/pergunta", optionalAuthMiddleware, async (req, res) => {
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

    // Get or create conversation for logged in user
    let conversation = null;
    let userApiKey = null;
    let preferredProvider = 'gemini';

    if (req.user) {
      // Fetch user with API Keys and preference
      const user = await User.findById(req.user._id).select('+gemini_api_key +openai_api_key +claude_api_key');
      preferredProvider = user?.preferred_provider || 'gemini';
      
      // Debugging
      console.log(`[DEBUG API] User ID: ${req.user._id}, Preferred Provider: ${preferredProvider}`);
      
      if (preferredProvider === 'openai') {
        userApiKey = user?.openai_api_key;
      } else {
        userApiKey = user?.gemini_api_key || null;
      }
      
      console.log(`[DEBUG API] Selected User API Key exists: ${!!userApiKey}`);

      conversation = await chatService.getOrCreateConversation(
        req.user._id, 
        editalId, 
        conversation_id, 
        trimmedQuestion
      );
      conversation_id = conversation?._id;
    }

    // --- CREDIT CHECK ---
    const creditStatus = await creditsService.checkAndConsumeCredit(req.user);
    if (!creditStatus.canProceed) {
      return res.status(403).json({
        success: false,
        error: 'Créditos esgotados',
        reason: creditStatus.reason,
        resetIn: creditStatus.resetIn
      });
    }
    // ---------------------

    // Process question through RAG pipeline (with user API key and provider preference)
    const result = await processQuestion(trimmedQuestion, editalId, { 
      userApiKey, 
      provider: preferredProvider 
    });

    // --- CREDIT CONSUMPTION ---
    if (result.success) {
      await creditsService.decrementCredit(req.user._id);
    }
    // --------------------------

    const tempoRespostaMs = Date.now() - startTime;

    // Log interaction (always happens)
    const logData = {
      pergunta: trimmedQuestion,
      resposta: result.response || (result.success ? "" : "Erro no processamento"),
      campus_id,
      edital_id: editalId || result.metadata?.editalId || null,
      usuario_id: req.user?._id || null,
      conversation_id,
      tempoRespostaMs,
      status: result.success ? "success" : "error",
      error_message: result.error,
      metadata: result.metadata
    };

    const log = await chatService.logChatInteraction(logData);

    // Save detailed usage log if available
    if (result.metadata?.usage && req.user) {
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
      });
    }

    res.json({
      success: true,
      data: {
        id: log._id, // Return log ID for feedback
        pergunta: trimmedQuestion,
        resposta: result.response,
        fontes: result.sources,
        conversationId: conversation_id,
        metadata: {
          processingTime: result.metadata.processingTime,
          chunksUsed: result.metadata.chunksUsed,
          editalId: result.metadata.editalId,
        },
      },
    });
  } catch (error) {
    console.error("[API] Chat error:", error);
    res.status(500).json({
      success: false,
      error: "Ops! Não consegui processar sua pergunta agora 😅 Tenta de novo em instantes!",
    });
  }
});

/**
 * @route   POST /api/chat/pergunta/stream
 * @desc    Ask a question with streaming response (optional)
 * @access  Public (Optional Auth)
 */
router.post("/pergunta/stream", optionalAuthMiddleware, async (req, res) => {
  const startTime = Date.now();
  let campus_id = req.body.campus_id || null;
  let conversation_id = req.body.conversationId || null;

  try {
    const { pergunta, editalId } = req.body;

    if (!pergunta) {
      return res.status(400).json({
        success: false,
        error: "Pergunta é obrigatória",
      });
    }

    // Get or create conversation for logged in user
    let userApiKey = null;
    let preferredProvider = 'gemini';

    if (req.user) {
      const user = await User.findById(req.user._id).select('+gemini_api_key +openai_api_key +claude_api_key');
      preferredProvider = user?.preferred_provider || 'gemini';

      // Debugging
      console.log(`[DEBUG API] User ID: ${req.user._id}, Preferred Provider: ${preferredProvider}`);
      
      if (preferredProvider === 'openai') {
        userApiKey = user?.openai_api_key;
      } else {
        userApiKey = user?.gemini_api_key || null;
      }
      
      console.log(`[DEBUG API] Selected User API Key exists: ${!!userApiKey}`);

      const conversation = await chatService.getOrCreateConversation(
        req.user._id, 
        editalId, 
        conversation_id, 
        pergunta
      );
      conversation_id = conversation?._id;
    }

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Process question with streaming
    const stream = providerManager.streamResponse(pergunta, editalId ? [] : [], { 
      userApiKey, 
      provider: preferredProvider 
    });

    let fullResponse = "";
    let finalMetadata = null;

    for await (const chunk of stream) {
      if (chunk.error) {
        res.write(`data: ${JSON.stringify({ error: chunk.error, errorCategory: chunk.errorCategory })}\n\n`);
        break;
      }

      if (chunk.done) {
        finalMetadata = chunk.metadata;
        res.write(`data: ${JSON.stringify({ done: true, sources: [], metadata: finalMetadata, conversationId: conversation_id })}\n\n`);
      } else {
        fullResponse += chunk.text;
        res.write(`data: ${JSON.stringify({ word: chunk.text, done: false })}\n\n`);
      }
    }

    // Log interaction after stream finishes (best effort)
    if (fullResponse) {
      const logData = {
        pergunta,
        resposta: fullResponse,
        campus_id,
        edital_id: editalId || null,
        usuario_id: req.user?._id || null,
        conversation_id,
        tempoRespostaMs: Date.now() - startTime,
        status: "success",
        metadata: finalMetadata
      };
      chatService.logChatInteraction(logData).catch(e => console.error("Stream log error:", e));
    }

    res.end();
  } catch (error) {
    console.error("[API] Stream chat error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
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
    res.status(500).json({
      success: false,
      error: error.message
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/chat/feedback
 * @desc    Submit feedback for a chat interaction
 * @access  Public (Optional Auth)
 */
router.post("/feedback", async (req, res) => {
  try {
    const { logId, feedback } = req.body;

    if (!logId || ![1, -1].includes(feedback)) {
      return res.status(400).json({
        success: false,
        error: "Dados de feedback inválidos",
      });
    }

    const log = await ChatLog.findByIdAndUpdate(
      logId,
      { feedback },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({
        success: false,
        error: "Log de interação não encontrado",
      });
    }

    res.json({
      success: true,
      message: "Feedback enviado com sucesso",
    });
  } catch (error) {
    console.error("[API] Feedback error:", error);
    res.status(500).json({ success: false, error: error.message });
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
    
    // Fetch user's AI preference
    let userApiKey = null;
    let preferredProvider = 'gemini';
    if (req.user) {
      const user = await User.findById(req.user.id).select('+gemini_api_key +openai_api_key +claude_api_key');
      preferredProvider = user?.preferred_provider || 'gemini';
      
      // Debugging
      console.log(`[DEBUG API] User ID: ${req.user._id}, Preferred Provider: ${preferredProvider}`);
      
      if (preferredProvider === 'openai') {
        userApiKey = user?.openai_api_key;
      } else {
        userApiKey = user?.gemini_api_key || null;
      }
      
      console.log(`[DEBUG API] Selected User API Key exists: ${!!userApiKey}`);
    }

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
        userApiKey, 
        provider: preferredProvider,
        model: preferredProvider === 'gemini' ? GEMINI_MODELS.FAST : undefined 
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
    console.error("[API] Suggestions error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/chat/historico
 * @desc    Get audit history (Admin or user's self)
 * @access  Public (Optional Auth)
 */
router.get("/historico", optionalAuthMiddleware, async (req, res) => {
  try {
    const { editalId, limit = 20, offset = 0, campus_id } = req.query;

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
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .populate('edital_id', 'titulo');

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit),
      },
    });
  } catch (error) {
    console.error("[API] History error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
