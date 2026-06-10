/**
 * ChatLog Model
 * Stores history of chat interactions for analytics and improvement
 */

import mongoose from 'mongoose';

const chatLogSchema = new mongoose.Schema({
  pergunta: {
    type: String,
    required: true,
    trim: true,
  },
  resposta: {
    type: String,
    required: true,
  },
  campus_id: {
    type: String,
    default: null,
  },
  edital_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Edital',
    default: null,
  },
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    default: null,
  },
  tempoRespostaMs: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'error'],
    required: true,
  },
  error_message: {
    type: String,
    default: null,
  },
  feedback: {
    type: Number, // 1 for thumbs up, -1 for thumbs down
    enum: [1, -1, null],
    default: null,
  },
  metadata: {
    type: Object,
    default: {},
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }, // Only need createdAt
});

// Indices for analytics
chatLogSchema.index({ campus_id: 1 });
chatLogSchema.index({ edital_id: 1 });
chatLogSchema.index({ usuario_id: 1 });
chatLogSchema.index({ status: 1 });
chatLogSchema.index({ feedback: 1 });
chatLogSchema.index({ createdAt: -1 });

const ChatLog = mongoose.models.ChatLog || mongoose.model('ChatLog', chatLogSchema);

export default ChatLog;
