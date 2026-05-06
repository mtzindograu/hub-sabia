/**
 * Chat Service
 * Handles conversation persistence and interaction logging
 */

import Conversation from '../models/Conversation.js';
import ChatLog from '../models/ChatLog.js';

/**
 * Get or create a conversation for a user
 * @param {string} userId 
 * @param {string} editalId 
 * @param {string} conversationId 
 * @param {string} firstQuestion 
 */
export async function getOrCreateConversation(userId, editalId, conversationId, firstQuestion) {
  if (!userId) return null;

  let conversation = null;

  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, usuario_id: userId });
  }

  if (!conversation) {
    // Create new conversation
    conversation = await Conversation.create({
      usuario_id: userId,
      edital_id: editalId || null,
      titulo: firstQuestion ? firstQuestion.substring(0, 50) + (firstQuestion.length > 50 ? '...' : '') : 'Nova conversa'
    });
  }

  return conversation;
}

/**
 * Log a chat interaction and update conversation
 * @param {Object} data - Chat interaction data
 */
export async function logChatInteraction(data) {
  try {
    const { 
      pergunta, 
      resposta, 
      campus_id, 
      edital_id, 
      usuario_id, 
      conversation_id,
      tempoRespostaMs, 
      status, 
      error_message, 
      metadata 
    } = data;

    // Create log entry
    const log = await ChatLog.create({
      pergunta,
      resposta,
      campus_id,
      edital_id,
      usuario_id,
      conversation_id,
      tempoRespostaMs,
      status,
      error_message,
      metadata
    });

    // Update conversation timestamp if it exists
    if (conversation_id) {
      await Conversation.findByIdAndUpdate(conversation_id, {
        last_message_at: Date.now()
      });
    }

    console.log(`[ChatService] Interaction logged: ${status}`);
    return log;
  } catch (error) {
    console.error("[ChatService] CRITICAL: Failed to save chat interaction:", error.message);
    throw error;
  }
}

/**
 * List conversations for a user
 * @param {string} userId 
 */
export async function getUserConversations(userId) {
  return await Conversation.find({ usuario_id: userId })
    .sort({ last_message_at: -1 })
    .populate('edital_id', 'titulo');
}

/**
 * Get messages for a specific conversation
 * @param {string} conversationId 
 * @param {string} userId 
 */
export async function getConversationMessages(conversationId, userId) {
  // Verify ownership
  const conversation = await Conversation.findOne({ _id: conversationId, usuario_id: userId });
  if (!conversation) return [];

  return await ChatLog.find({ conversation_id: conversationId })
    .sort({ createdAt: 1 });
}

export default {
  getOrCreateConversation,
  logChatInteraction,
  getUserConversations,
  getConversationMessages
};
