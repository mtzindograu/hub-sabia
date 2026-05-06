/**
 * Conversation Model
 * Groups chat interactions into a single session for the user
 */

import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  edital_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Edital',
    default: null,
  },
  titulo: {
    type: String,
    required: true,
    trim: true,
    default: 'Nova conversa',
  },
  last_message_at: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

// Indices for faster lookup
conversationSchema.index({ usuario_id: 1, last_message_at: -1 });
conversationSchema.index({ edital_id: 1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;
