/**
 * Error Logging Routes
 * API endpoints for reporting errors from the frontend
 */

import express from 'express';
import ErrorLog from '../models/ErrorLog.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/logs/error
 * @desc    Log an error from the frontend
 * @access  Public (Optional Auth)
 */
router.post('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { 
      mensagem_erro, 
      stack_erro, 
      rota_api, 
      status_code, 
      campus_id, 
      payload_recebido,
      origem_erro 
    } = req.body;

    if (!mensagem_erro) {
      return res.status(400).json({ success: false, error: 'Mensagem de erro é obrigatória' });
    }

    // Create log entry
    await ErrorLog.create({
      mensagem_erro,
      stack_erro,
      rota_api,
      status_code: status_code || 0,
      usuario_id: req.user?._id || null,
      campus_id,
      payload_recebido,
      origem_erro: origem_erro || 'frontend',
      horario: new Date()
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('[ErrorLogger] Failed to save frontend error:', error.message);
    // We still return 200/201 to the frontend so it doesn't try to log the logging failure recursively
    res.status(200).json({ success: false, error: 'Failed to log error' });
  }
});

export default router;
