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
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
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
}, {
  timestamps: true, // Adiciona createdAt e updatedAt automaticamente
});

// Index para buscas por role (email já tem índice por causa do unique: true)
userSchema.index({ role: 1 });

// Virtual para senha (não persiste no banco)
userSchema.virtual('senha').set(function(senha) {
  this._senha = senha;
  this.senha_hash = bcrypt.hashSync(senha, 10);
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

// Método estático para buscar por email e senha
userSchema.statics.autenticar = async function(email, senha) {
  const user = await this.findOne({ email });
  if (!user) return null;
  
  const senhaValida = await user.validarSenha(senha);
  if (!senhaValida) return null;
  
  return user;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
