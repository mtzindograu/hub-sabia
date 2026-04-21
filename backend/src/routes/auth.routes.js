/**
 * Auth Routes - Rotas de Autenticação
 * POST /api/auth/register - Registrar novo usuário
 * POST /api/auth/login - Login
 * POST /api/auth/logout - Logout (opcional, frontend apenas remove token)
 * GET /api/auth/me - Dados do usuário atual
 * PUT /api/auth/profile - Atualizar perfil
 */

import { Router } from 'express';
import { registerUser, login, getUserById, updateUserProfile, listAllUsers, deleteUser } from '../services/auth.service.js';
import { authMiddleware, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Registrar novo usuário
 * @access Público
 */
router.post('/register', async (req, res) => {
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

    // Forçar role 'user' para TODOS os novos registros
    // Apenas um script de seed/manual no banco pode criar admins
    // Isso previne que qualquer usuário se registre como admin
    const userRole = 'user'; // SEMPRE 'user' — ignorar campo role do request

    console.log(`[AUTH] Registrando novo usuário: ${email}, role: ${userRole}`);

    // Criar usuário
    const newUser = await registerUser({
      email,
      senha,
      role: userRole,
      nome
    });

    console.log(`[AUTH] Usuário criado com sucesso: ${newUser.id}, role: ${newUser.role}`);

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'Usuário registrado com sucesso'
    });

  } catch (error) {
    console.error('[AUTH] Register error:', error);

    if (error.message === 'Email já cadastrado') {
      return res.status(409).json({
        success: false,
        error: 'Conflito',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: error.message
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Fazer login
 * @access Público
 */
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    console.log(`[AUTH] Tentativa de login: email=${email}`);

    // Validações básicas
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        message: 'Email e senha são obrigatórios'
      });
    }

    // Fazer login
    const result = await login(email, senha);

    console.log(`[AUTH] Login bem-sucedido: ${result.user.email}, role=${result.user.role}`);

    res.json({
      success: true,
      data: {
        user: result.user,
        token: result.token
      },
      message: 'Login realizado com sucesso'
    });

  } catch (error) {
    console.error('[AUTH] Login error:', error);

    if (error.message === 'Email ou senha inválidos') {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: error.message
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Fazer logout (apenas para consistência de API)
 * @access Privado
 */
router.post('/logout', authMiddleware, async (req, res) => {
  // Logout é feito no frontend removendo o token
  // Esta rota é apenas para consistência de API
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

/**
 * @route GET /api/auth/me
 * @desc Obter dados do usuário autenticado
 * @access Privado
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('[AUTH] Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/auth/profile
 * @desc Atualizar perfil do usuário
 * @access Privado
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nome, senha } = req.body;

    // Não permitir mudança de role pelo perfil
    const updatedUser = await updateUserProfile(req.user.id, {
      nome,
      senha
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    console.error('[AUTH] Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: error.message
    });
  }
});

/**
 * @route GET /api/auth/users
 * @desc Listar todos os usuários (apenas admin)
 * @access Admin
 */
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await listAllUsers();

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('[AUTH] List users error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/auth/users/:id
 * @desc Deletar usuário (apenas admin)
 * @access Admin
 */
router.delete('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir que admin se delete
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Operação não permitida',
        message: 'Você não pode deletar sua própria conta'
      });
    }

    await deleteUser(id);

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    console.error('[AUTH] Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno',
      message: error.message
    });
  }
});

export default router;
