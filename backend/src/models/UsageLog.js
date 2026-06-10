/**
 * UsageLog Model
 * Tracks AI consumption (tokens and estimated costs) across providers
 */

import mongoose from 'mongoose';

const usageLogSchema = new mongoose.Schema({
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: String,
    required: true,
    enum: ['gemini', 'openai', 'claude', 'mistral', 'grok'],
  },
  model: {
    type: String,
    required: true,
  },
  prompt_tokens: {
    type: Number,
    default: 0,
  },
  completion_tokens: {
    type: Number,
    default: 0,
  },
  total_tokens: {
    type: Number,
    default: 0,
  },
  estimated_cost: {
    type: Number,
    default: 0,
  },
  request_type: {
    type: String,
    enum: ['chat', 'embedding', 'extraction', 'summary', 'edital_summary', 'edital_extraction'],
    default: 'chat',
  },
  metadata: {
    type: Object,
    default: {},
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Indices for analytics
usageLogSchema.index({ usuario_id: 1, createdAt: -1 });
usageLogSchema.index({ provider: 1, model: 1 });
usageLogSchema.index({ createdAt: -1 });

const UsageLog = mongoose.models.UsageLog || mongoose.model('UsageLog', usageLogSchema);

export default UsageLog;
