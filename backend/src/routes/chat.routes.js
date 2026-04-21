/**
 * Chat Routes
 * API endpoints for AI-powered question answering
 *
 * @description Handles RAG-based chat interactions
 */

import express from "express";
import { processQuestion } from "../services/rag.service.js";
import { generateSuggestedQuestions } from "../services/groq.service.js";
import Edital from "../models/Edital.js";

const router = express.Router();

/**
 * @route   POST /api/chat/pergunta
 * @desc    Ask a question about editais
 * @access  Public
 */
router.post("/pergunta", async (req, res) => {
  try {
    console.log("[API] Processing chat question...");

    const { pergunta, editalId, historico } = req.body;

    // Validate input
    if (!pergunta || typeof pergunta !== "string") {
      return res.status(400).json({
        success: false,
        error: "Pergunta é obrigatória",
      });
    }

    // Trim and validate length
    const trimmedQuestion = pergunta.trim();
    if (trimmedQuestion.length < 5) {
      return res.status(400).json({
        success: false,
        error: "Pergunta muito curta. Por favor, forneça mais detalhes.",
      });
    }

    if (trimmedQuestion.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Pergunta muito longa. Por favor, resuma sua dúvida.",
      });
    }

    // Process question through RAG pipeline
    const result = await processQuestion(trimmedQuestion, editalId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || "Failed to process question",
      });
    }

    // Note: Chat history logging would require a separate ChatHistory model
    // For now, we skip this to keep it simple

    res.json({
      success: true,
      data: {
        pergunta: trimmedQuestion,
        resposta: result.response,
        fontes: result.sources,
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
      error:
        "Ops! Não consegui processar sua pergunta agora 😅 Tenta de novo em instantes!",
    });
  }
});

/**
 * @route   POST /api/chat/pergunta/stream
 * @desc    Ask a question with streaming response (optional)
 * @access  Public
 */
router.post("/pergunta/stream", async (req, res) => {
  try {
    const { pergunta, editalId } = req.body;

    if (!pergunta) {
      return res.status(400).json({
        success: false,
        error: "Pergunta é obrigatória",
      });
    }

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Process question
    const result = await processQuestion(pergunta, editalId);

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
 * @route   GET /api/chat/sugestoes/:editalId
 * @desc    Get suggested questions for an edital
 * @access  Public
 */
router.get("/sugestoes/:editalId", async (req, res) => {
  try {
    const { editalId } = req.params;

    // Get some chunks from the edital to generate suggestions
    const edital = await Edital.findById(editalId);
    
    if (!edital || edital.chunks.length === 0) {
      // Return default questions if no chunks available
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

    // Get first 5 chunks
    const chunks = edital.chunks.slice(0, 5);
    const content = chunks.map((c) => c.conteudo).join("\n\n");
    
    // Generate suggested questions
    const result = await generateSuggestedQuestions(content);

    res.json({
      success: true,
      data: {
        questions: result.success
          ? result.questions
          : [
              "Quais são os requisitos para participação?",
              "Qual é o prazo de inscrição?",
              "Quais documentos são necessários?",
            ],
      },
    });
  } catch (error) {
    console.error("[API] Suggestions error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/chat/historico
 * @desc    Get chat history for an edital (optional)
 * @access  Public
 * @note    This endpoint returns empty array since we don't have chat history storage yet
 */
router.get("/historico", async (req, res) => {
  try {
    const { editalId, limit = 20, offset = 0 } = req.query;

    // Return empty array for now (chat history would require a separate model)
    res.json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("[API] History error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
