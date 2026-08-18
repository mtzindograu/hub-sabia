/**
 * Auth Routes - Rotas de Autenticação
 * POST /api/auth/register - Registrar novo usuário
 * POST /api/auth/login - Login
 * POST /api/auth/logout - Logout (opcional, frontend apenas remove token)
 * GET /api/auth/me - Dados do usuário atual
 * PUT /api/auth/profile - Atualizar perfil
 * POST /api/auth/provider-config - Configurar chave de API para um provider
 * POST /api/auth/provider-preference - Definir provider preferido
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { registerUser, login, getUserById, updateUserProfile, listAllUsers, deleteUser, updateProviderConfig, updatePreferredProvider } from '../services/auth.service.js';
import { authMiddleware, isAdmin } from '../middleware/auth.middleware.js';
import providerManager from '../services/provider-manager.js';

const router = Router();
export function isDuplicateEmailError(error) {
  return error?.code === 11000 || error?.message === 'Email já cadastrado';
}

// Anti força-bruta: login/registro limitados por IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
});

/**
 * @route   POST /api/auth/register
 * @desc    Registrar novo usuário
 * @access  Público
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, senha, role, nome } = req.body;

    // Validações básicas
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        message: 'Email e senha são obrigatórios'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido',
        message: 'Formato de email inválido'
      });
    }

    // Validar tamanho da senha
    if (senha.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Senha fraca',
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    const userRole = 'user'; // SEMPRE 'user'

    const newUser = await registerUser({
      email,
      senha,
      role: userRole,
      nome
    });

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'Usuário registrado com sucesso'
    });

  } catch (error) {
    console.error('[AUTH] Register error:', error);
    if (isDuplicateEmailError(error)) {
      return res.status(409).json({
        success: false,
        error: 'Este email já está cadastrado.',
        message: 'Este email já está cadastrado.',
      });
    }
    res.status(500).json({ success: false, error: 'Erro interno', message: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Fazer login
 * @access  Público
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
    }

    const result = await login(email, senha);

    res.json({
      success: true,
      data: { user: result.user, token: result.token },
      message: 'Login realizado com sucesso'
    });

  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.status(401).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Dados do usuário atual
 * @access  Privado
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Atualizar perfil
 * @access  Privado
 */
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    const updatedUser = await updateUserProfile(req.user.id, req.body);
    res.json({ success: true, data: updatedUser, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/auth/users
 * @desc    Listar todos os usuários (apenas admin)
 * @access  Admin
 */
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await listAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/auth/provider-config
 * @desc    Configurar chave de API para um provider (Gemini, OpenAI, etc.)
 * @access  Privado
 */
router.post('/provider-config', authMiddleware, async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !['gemini', 'groq'].includes(provider)) {
      return res.status(400).json({ success: false, error: 'Provider inválido ou não suportado' });
    }

    if (!apiKey) {
      await updateProviderConfig(req.user.id, provider, null);
      return res.json({ success: true, message: `Chave do ${provider} removida com sucesso` });
    }

    const trimmedKey = typeof apiKey === 'string' ? apiKey.trim() : apiKey;
    const isValid = await providerManager.validateApiKey(trimmedKey, provider);

    if (!isValid) {
      return res.status(400).json({ success: false, error: `A chave do ${provider} fornecida é inválida` });
    }

    await updateProviderConfig(req.user.id, provider, trimmedKey);
    res.json({ success: true, message: `Chave do ${provider} configurada com sucesso` });
  } catch (error) {
    console.error('[AUTH] Provider config error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/auth/provider-preference
 * @desc    Definir provider preferido do usuário
 * @access  Privado
 */
router.post('/provider-preference', authMiddleware, async (req, res) => {
  try {
    const { provider } = req.body;

    if (!provider || !['gemini', 'groq'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Provider inválido ou não suportado'
      });
    }
    await updatePreferredProvider(req.user.id, provider);
    res.json({ success: true, message: `Preferência de provider atualizada para: ${provider}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/auth/acknowledge-plan
 * @desc    Marcar o plano do usuário como aceito
 * @access  Privado
 */
router.post('/acknowledge-plan', authMiddleware, async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.id }, { planAcknowledged: true });
    res.json({ success: true, message: 'Plano aceito com sucesso' });
  } catch (error) {
    console.error('[AUTH] Error acknowledging plan for user:', req.user.id, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/auth/plan-mode
 * @desc    Alternar entre o Plano da Página (créditos diários) e a chave própria
 * @access  Privado
 */
router.post('/plan-mode', authMiddleware, async (req, res) => {
  try {
    const { mode } = req.body;

    if (mode === 'free') {
      await User.updateOne(
        { _id: req.user.id },
        { $set: { usingOwnApiKey: { active: false, provider: null, configuredAt: null } } }
      );
      return res.json({ success: true, data: { mode: 'free' }, message: 'Plano da página ativado — 20 créditos por dia' });
    }

    if (mode === 'own-key') {
      // Precisa de pelo menos uma chave configurada
      const user = await User.findById(req.user.id).select('+gemini_api_key +groq_api_key');
      const provider = user?.gemini_api_key ? 'gemini' : (user?.groq_api_key ? 'groq' : null);
      if (!provider) {
        return res.status(400).json({
          success: false,
          error: 'Configure uma chave de IA antes de usar este modo',
          code: 'NO_KEY_CONFIGURED'
        });
      }
      await User.updateOne(
        { _id: req.user.id },
        { $set: { usingOwnApiKey: { active: true, provider, configuredAt: new Date() } } }
      );
      return res.json({ success: true, data: { mode: 'own-key', provider }, message: `Chave própria ativada (${provider})` });
    }

    return res.status(400).json({ success: false, error: 'Modo inválido', code: 'INVALID_MODE' });
  } catch (error) {
    console.error('[AUTH] Plan mode error:', error.message);
    res.status(500).json({ success: false, error: 'Erro ao alterar o modo de uso' });
  }
});

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Deletar usuário (apenas admin)
 * @access  Admin
 */
router.delete('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Você não pode deletar sua própria conta' });
    }
    await deleteUser(req.params.id);
    res.json({ success: true, message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
