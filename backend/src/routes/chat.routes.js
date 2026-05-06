/**
 * Chat Routes
 * API endpoints for AI-powered question answering and conversation management
 */

import express from "express";
import { processQuestion } from "../services/rag.service.js";
import { generateSuggestedQuestions } from "../services/groq.service.js";
import Edital from "../models/Edital.js";
import ChatLog from "../models/ChatLog.js";
import chatService from "../services/chat.service.js";
import { optionalAuthMiddleware, authMiddleware } from "../middleware/auth.middleware.js";

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
    if (req.user) {
      conversation = await chatService.getOrCreateConversation(
        req.user._id, 
        editalId, 
        conversation_id, 
        trimmedQuestion
      );
      conversation_id = conversation?._id;
    }

    // Process question through RAG pipeline
    const result = await processQuestion(trimmedQuestion, editalId);

    const tempoRespostaMs = Date.now() - startTime;

    // Log interaction (always happens, non-blocking)
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

    // Fire and forget logging
    chatService.logChatInteraction(logData).catch(err => {
      console.error("[API] Failed to log interaction:", err.message);
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to process question",
      });
    }

    res.json({
      success: true,
      data: {
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
    if (req.user) {
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

    // Process question
    const result = await processQuestion(pergunta, editalId);
    const tempoRespostaMs = Date.now() - startTime;

    // Log interaction
    const logData = {
      pergunta,
      resposta: result.response,
      campus_id,
      edital_id: editalId || result.metadata?.editalId || null,
      usuario_id: req.user?._id || null,
      conversation_id,
      tempoRespostaMs,
      status: result.success ? "success" : "error",
      error_message: result.success ? null : result.error,
      metadata: result.metadata
    };

    chatService.logChatInteraction(logData).catch(err => {
      console.error("[API] Failed to log interaction (stream):", err.message);
    });

    // Stream response word by word
    const words = result.response.split(" ");
    for (let i = 0; i < words.length; i++) {
      res.write(`data: ${JSON.stringify({ word: words[i], done: false })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    // Send final message with metadata
    res.write(
      `data: ${JSON.stringify({
        done: true,
        sources: result.sources,
        metadata: result.metadata,
        conversationId: conversation_id
      })}\n\n`,
    );

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
    const result = await generateSuggestedQuestions(content);

    res.json({
      success: true,
      data: {
        questions: result.success ? result.questions : [
          "Quais são os requisitos para participação?",
          "Qual é o prazo de inscrição?",
          "Quais documentos são necessários?",
        ],
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
