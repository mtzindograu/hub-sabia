/**
 * Auth Service - Gerenciamento de Autenticação com MongoDB
 * Handles user registration, login, and JWT token management
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hubsabia-secret-key-change-in-production';
const JWT_EXPIRATION = '24h';

// Domínios de email IF aceitos
const IF_EMAIL_DOMAINS = ['ifpr.edu.br', 'ifsp.edu.br', 'ifsc.edu.br', 'ifrs.edu.br', 'ifba.edu.br'];

/**
 * Verifica se email é de instituição IF
 * @param {string} email - Email para verificar
 * @returns {boolean} True se for email IF
 */
export function isValidIFEmail(email) {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return IF_EMAIL_DOMAINS.includes(domain);
}

/**
 * Hash de senha
 * @param {string} senha - Senha em texto puro
 * @returns {Promise<string>} - Senha hasheada
 */
export async function hashSenha(senha) {
  const saltRounds = 10;
  return bcrypt.hash(senha, saltRounds);
}

/**
 * Validar senha contra hash
 * @param {string} senha - Senha em texto puro
 * @param {string} senhaHash - Hash da senha
 * @returns {Promise<boolean>} - true se válido
 */
export async function validateSenha(senha, senhaHash) {
  return bcrypt.compare(senha, senhaHash);
}

/**
 * Gerar token JWT
 * @param {object} user - Dados do usuário
 * @returns {string} - Token JWT
 */
export function generateToken(user) {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION
  });
}

/**
 * Verificar token JWT
 * @param {string} token - Token JWT
 * @returns {object|null} - Payload do token ou null se inválido
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Registrar novo usuário
 * @param {object} userData - Dados do usuário
 * @returns {Promise<object>} - Usuário criado (sem senha)
 */
export async function registerUser(userData) {
  const { email, senha, role = 'user', nome } = userData;

  // Verificar se email já existe
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email já cadastrado');
  }

  // Criar usuário usando o virtual setter do schema
  const user = new User({
    email,
    role,
    nome
  });
  
  // Setar senha (o virtual setter fará o hash)
  user.senha = senha;

  await user.save();

  // Retornar usuário sem senha
  return {
    _id: user._id.toString(),
    id: user._id.toString(), // Para compatibilidade
    email: user.email,
    role: user.role,
    nome: user.nome,
    has_gemini_key: !!user.gemini_api_key,
    has_openai_key: !!user.openai_api_key,
    has_claude_key: !!user.claude_api_key,
    preferred_provider: user.preferred_provider,
    currentPlan: user.currentPlan,
    remainingCredits: user.remainingCredits,
    usingOwnApiKey: user.usingOwnApiKey,
    planAcknowledged: user.planAcknowledged || false,
    createdAt: user.createdAt,
  };
}

/**
 * Fazer login
 * @param {string} email - Email do usuário
 * @param {string} senha - Senha do usuário
 * @returns {Promise<object>} - Usuário e token
 */
export async function login(email, senha) {
  // Buscar usuário por email
  // Selecionar chaves para os flags
  const user = await User.findOne({ email }).select('+gemini_api_key +openai_api_key +claude_api_key');

  if (!user) {
    throw new Error('Email ou senha inválidos');
  }

  // Validar senha
  const senhaValida = await user.validarSenha(senha);

  if (!senhaValida) {
    throw new Error('Email ou senha inválidos');
  }

  // Gerar token
  const token = generateToken(user);

  // Retornar usuário (sem senha) e token
  return {
    user: {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      nome: user.nome,
      has_gemini_key: !!user.gemini_api_key,
      has_openai_key: !!user.openai_api_key,
      has_claude_key: !!user.claude_api_key,
      preferred_provider: user.preferred_provider,
    },
    token
  };
}

/**
 * Buscar usuário por ID
 * @param {string} userId - ID do usuário
 * @returns {Promise<object|null>} - Usuário ou null
 */
export async function getUserById(userId) {
  // Selecionar chaves para os flags
  const user = await User.findById(userId).select('+gemini_api_key +openai_api_key +claude_api_key');

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    nome: user.nome,
    has_gemini_key: !!user.gemini_api_key,
    has_openai_key: !!user.openai_api_key,
    has_claude_key: !!user.claude_api_key,
    preferred_provider: user.preferred_provider,
    currentPlan: user.currentPlan,
    remainingCredits: user.remainingCredits,
    usingOwnApiKey: user.usingOwnApiKey,
    planAcknowledged: user.planAcknowledged || false,
    createdAt: user.createdAt,
  };
}

/**
 * Buscar usuário por email
 * @param {string} email - Email do usuário
 * @returns {Promise<object|null>} - Usuário ou null
 */
export async function getUserByEmail(email) {
  const user = await User.findOne({ email }).select('+gemini_api_key +openai_api_key +claude_api_key');

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    nome: user.nome,
    has_gemini_key: !!user.gemini_api_key,
    has_openai_key: !!user.openai_api_key,
    has_claude_key: !!user.claude_api_key,
    preferred_provider: user.preferred_provider,
    currentPlan: user.currentPlan,
    remainingCredits: user.remainingCredits,
    usingOwnApiKey: user.usingOwnApiKey,
    planAcknowledged: user.planAcknowledged || false,
    createdAt: user.createdAt,
  };
}

/**
 * Atualizar perfil do usuário
 * @param {string} userId - ID do usuário
 * @param {object} updateData - Dados para atualizar
 * @returns {Promise<object>} - Usuário atualizado
 */
export async function updateUserProfile(userId, updateData) {
  const { nome, senha } = updateData;

  const updateFields = {};

  if (nome !== undefined) {
    updateFields.nome = nome;
  }

  if (senha !== undefined) {
    updateFields.senha_hash = await hashSenha(senha);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateFields,
    { new: true, runValidators: true }
  ).select('+gemini_api_key +openai_api_key +claude_api_key');

  if (!updatedUser) {
    throw new Error('Usuário não encontrado');
  }

  return {
    id: updatedUser._id.toString(),
    _id: updatedUser._id.toString(),
    email: updatedUser.email,
    role: updatedUser.role,
    nome: updatedUser.nome,
    has_gemini_key: !!updatedUser.gemini_api_key,
    has_openai_key: !!updatedUser.openai_api_key,
    has_claude_key: !!updatedUser.claude_api_key,
    preferred_provider: updatedUser.preferred_provider,
    currentPlan: updatedUser.currentPlan,
    remainingCredits: updatedUser.remainingCredits,
    usingOwnApiKey: updatedUser.usingOwnApiKey,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  };
}

/**
 * Listar todos os usuários (apenas admin)
 * @returns {Promise<Array>} - Lista de usuários
 */
export async function listAllUsers() {
  const users = await User.find()
    .select('-senha_hash +gemini_api_key +openai_api_key +claude_api_key')
    .sort({ createdAt: -1 });

  return users.map(user => ({
    id: user._id.toString(),
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
    nome: user.nome,
    has_gemini_key: !!user.gemini_api_key,
    has_openai_key: !!user.openai_api_key,
    has_claude_key: !!user.claude_api_key,
    preferred_provider: user.preferred_provider,
    currentPlan: user.currentPlan,
    remainingCredits: user.remainingCredits,
    usingOwnApiKey: user.usingOwnApiKey,
    planAcknowledged: user.planAcknowledged || false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

/**
 * Deletar usuário (apenas admin)
 * @param {string} userId - ID do usuário
 * @returns {Promise<boolean>} - true se deletado
 */
export async function deleteUser(userId) {
  const deletedUser = await User.findByIdAndDelete(userId);

  if (!deletedUser) {
    throw new Error('Usuário não encontrado');
  }

  return true;
}

/**
 * Atualizar configuração de provider (API Key)
 * @param {string} userId - ID do usuário
 * @param {string} provider - Nome do provider (gemini, openai, claude)
 * @param {string|null} apiKey - Chave de API
 * @returns {Promise<boolean>} - true se atualizado
 */
export async function updateProviderConfig(userId, provider, apiKey) {
  const updateField = {};
  
  if (provider === 'gemini') {
    updateField.gemini_api_key = apiKey;
  } else if (provider === 'openai') {
    updateField.openai_api_key = apiKey;
  } else if (provider === 'claude') {
    updateField.claude_api_key = apiKey;
  } else {
    throw new Error('Provider não suportado');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateField,
    { new: true }
  );

  if (!updatedUser) {
    throw new Error('Usuário não encontrado');
  }

  return true;
}

/**
 * Atualizar preferência de provider
 * @param {string} userId - ID do usuário
 * @param {string} provider - Nome do provider
 * @returns {Promise<boolean>} - true se atualizado
 */
export async function updatePreferredProvider(userId, provider) {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { preferred_provider: provider },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error('Usuário não encontrado');
  }

  return true;
}

/**
 * Atualizar chave de API do Gemini para o usuário (Legado)
 * @param {string} userId - ID do usuário
 * @param {string|null} apiKey - Chave de API do Gemini
 * @returns {Promise<boolean>} - true se atualizado
 */
export async function updateGeminiKey(userId, apiKey) {
  return updateProviderConfig(userId, 'gemini', apiKey);
}
