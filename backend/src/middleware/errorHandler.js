import ErrorLog from '../models/ErrorLog.js';

/**
 * Error Handling Middleware
 * Centralized error handling for the API
 *
 * @description Provides consistent error responses
 */

/**
 * Global error handler middleware
 * NOTA: NUNCA persiste req.body (pode conter senhas e API keys).
 */
export async function errorHandler(err, req, res, next) {
  // Extract info for logging (sem payload do corpo — dados sensíveis)
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || 'Internal Server Error';
  const stack = err.stack;
  const path = req.path;
  const method = req.method;
  const userId = req.user?._id || null;

  // Log error for debugging (console)
  console.error('Error:', {
    message: errorMessage,
    code: err.errorCode,
    stack: process.env.NODE_ENV === 'development' ? stack : undefined,
    path: path,
    method: method,
    timestamp: new Date().toISOString()
  });

  // Persist to MongoDB (Fire and forget, don't wait to respond to user)
  // Wrapped in try/catch to ensure it doesn't break the system
  try {
    ErrorLog.create({
      mensagem_erro: errorMessage,
      stack_erro: stack,
      rota_api: `${method} ${path}`,
      status_code: statusCode,
      usuario_id: userId,
      origem_erro: 'backend',
      horario: new Date()
    }).catch(dbErr => {
      console.error('[ErrorLogger] Failed to save error to MongoDB:', dbErr.message);
    });
  } catch (logErr) {
    console.error('[ErrorLogger] Critical error in logging middleware:', logErr.message);
  }
  
  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 10MB.',
      code: 'FILE_TOO_LARGE',
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field.',
      code: 'UNEXPECTED_FILE',
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle JSON parsing errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body.',
      code: 'INVALID_JSON',
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle generic errors (nunca expõe error.message cru ao cliente em produção)
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' || statusCode >= 500
      ? 'Um erro inesperado ocorreu'
      : err.message,
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
}

export default {
  errorHandler
};
