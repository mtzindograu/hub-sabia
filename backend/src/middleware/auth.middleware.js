/**
 * Middleware de Autenticação
 * Verifica token JWT e adiciona usuário ao request
 */

import { verifyToken, getUserById } from '../services/auth.service.js';

/**
 * Middleware para extrair token do header
 * Formato esperado: Authorization: Bearer <token>
 */
export function extractToken(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}

/**
 * Middleware de autenticação
 * Verifica se o usuário está autenticado e adiciona req.user
 */
export async function authMiddleware(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado',
        message: 'Token de acesso não fornecido'
      });
    }
    
    // Verificar token
    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: 'Token expirado ou inválido'
      });
    }
    
    // Buscar usuário no banco
    const user = await getUserById(payload.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado',
        message: 'Usuário não existe mais no sistema'
      });
    }
    
    // Adicionar usuário ao request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    // Token forjado com id malformado → CastError do Mongoose
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: 'Token expirado ou inválido'
      });
    }
    // Falha de infraestrutura: deixa o errorHandler responder (não pendura a request)
    next(error);
  }
}

/**
 * Middleware para verificar se é admin
 * Deve ser usado após o authMiddleware
 */
export function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Não autenticado',
      message: 'Faça login primeiro'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado',
      message: 'Você não tem permissão para realizar esta ação'
    });
  }
  
  next();
}

/**
 * Middleware opcional de autenticação
 * Não falha se não houver token, apenas deixa req.user como undefined
 * Útil para rotas que funcionam diferente para usuários logados
 */
export async function optionalAuthMiddleware(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (token) {
      const payload = verifyToken(token);
      
      if (payload) {
        const user = await getUserById(payload.id);
        
        if (user) {
          req.user = user;
          req.token = token;
        }
      }
    }
    
    next();
  } catch (error) {
    // Token forjado com id malformado: segue como anônimo (rota é opcional)
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      return next();
    }
    next(error);
  }
}
