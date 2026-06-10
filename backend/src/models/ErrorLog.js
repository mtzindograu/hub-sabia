/**
 * ErrorLog Model
 * Stores system errors from both frontend and backend for monitoring and debugging
 */

import mongoose from 'mongoose';

const errorLogSchema = new mongoose.Schema({
  mensagem_erro: {
    type: String,
    required: true,
  },
  stack_erro: {
    type: String,
    default: null,
  },
  rota_api: {
    type: String,
    default: null,
  },
  status_code: {
    type: Number,
    default: 500,
  },
  usuario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  campus_id: {
    type: String,
    default: null,
  },
  payload_recebido: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  origem_erro: {
    type: String,
    enum: ['frontend', 'backend', 'api_externa'],
    required: true,
    default: 'backend',
  },
  horario: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: false, // We use 'horario' instead
});

// Indices for filtering and performance
errorLogSchema.index({ horario: -1 });
errorLogSchema.index({ origem_erro: 1 });
errorLogSchema.index({ usuario_id: 1 });
errorLogSchema.index({ status_code: 1 });

const ErrorLog = mongoose.models.ErrorLog || mongoose.model('ErrorLog', errorLogSchema);

export default ErrorLog;
