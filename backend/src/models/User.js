/**
 * User Model
 * Represents a user in the system (admin or regular user)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Formato de email inválido'],
  },
  senha_hash: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    select: false, // Nunca retornar por padrão (defesa em profundidade)
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  nome: {
    type: String,
    trim: true,
    default: '',
  },
  currentPlan: {
    type: Object,
    default: {
      id: 'free_hubsabia',
      name: 'Plano Gratuito HubSabia',
      type: 'free'
    }
  },
  remainingCredits: {
    type: Number,
    default: 20
  },
  lastCreditReset: {
    type: Date,
    default: Date.now
  },
  usingOwnApiKey: {
    type: Object,
    default: {
      active: false,
      provider: null,
      configuredAt: null
    }
  },
  planAcknowledged: {
    type: Boolean,
    default: false
  },
  gemini_api_key: {
    type: String,
    default: null,
    select: false, // Don't return by default in queries
  },
  openai_api_key: {
    type: String,
    default: null,
    select: false, // Don't return by default in queries
  },
  claude_api_key: {
    type: String,
    default: null,
    select: false, // Don't return by default in queries
  },
  preferred_provider: {
    type: String,
    enum: ['gemini', 'openai', 'claude'],
    default: 'gemini',
  },
}, {
  timestamps: true, // Adiciona createdAt e updatedAt automaticamente
});

// Index para buscas por role (email já tem índice por causa do unique: true)
userSchema.index({ role: 1 });

// Virtual para senha (não persiste no banco; hash feito no pre('save') async)
userSchema.virtual('senha').set(function(senha) {
  this._senha = senha;
});

// Hash assíncrono (não bloqueia o event loop, ao contrário do hashSync)
// IMPORTANTE: pre('validate') — a validação do Mongoose roda ANTES dos hooks pre('save'),
// então o hash precisa existir quando o validador required de senha_hash executa.
userSchema.pre('validate', async function() {
  if (this._senha) {
    this.senha_hash = await bcrypt.hash(this._senha, 10);
  }
});

// Método para validar senha
userSchema.methods.validarSenha = async function(senha) {
  return bcrypt.compare(senha, this.senha_hash);
};

// Método para retornar dados sem senha
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.senha_hash;
  delete user.__v;
  return user;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
