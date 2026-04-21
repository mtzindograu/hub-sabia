/**
 * HubSabia Backend Server - Vercel Serverless Entry Point
 * Academic Notice AI System with RAG Pipeline
 *
 * @description Express app configured for Vercel serverless deployment
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import editalRoutes from './routes/edital.routes.js';
import chatRoutes from './routes/chat.routes.js';
import authRoutes from './routes/auth.routes.js';

// Load environment variables
dotenv.config();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Determine allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://hub-sabia-teste-frontend.vercel.app',
];

// Add frontend URL from env if defined
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Add Vercel deployment URLs automatically
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
  allowedOrigins.push(`https://www.${process.env.VERCEL_URL}`);
}

// Add custom production frontend URL if defined
if (process.env.PRODUCTION_FRONTEND_URL) {
  allowedOrigins.push(process.env.PRODUCTION_FRONTEND_URL);
}

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like server-to-server, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow if origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In production, allow all origins if no specific FRONTEND_URL is set
      // This allows the API to be accessed from any frontend
      if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} from ${req.ip}`);
    next();
  });
}

// Debug endpoint to test connection
app.get('/api/debug', (req, res) => {
  console.log('[DEBUG] Debug endpoint accessed');
  res.json({
    status: 'debug',
    timestamp: new Date().toISOString(),
    ip: req.ip,
    headers: req.headers,
    message: 'Backend is reachable!'
  });
});

// ============================================
// API ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HubSabia API',
    version: '1.0.0',
    database: 'MongoDB'
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/edital', editalRoutes);

// Rota para listar todos os editais
app.get('/api/editais', async (req, res) => {
  try {
    const { ano, search, limit = 20, offset = 0 } = req.query;

    // Import model
    const Edital = (await import('./models/Edital.js')).default;

    const result = await Edital.buscar({ ano, search, limit, offset });

    const editaisWithStats = result.editais.map(edital => ({
      id: edital._id.toString(),
      titulo: edital.titulo,
      descricao: edital.descricao,
      objetivo_principal: edital.objetivo_principal,
      publico_alvo: edital.publico_alvo,
      vagas: edital.vagas,
      inscricoes_periodo: edital.inscricoes_periodo,
      contatos: edital.contatos,
      palavras_chave: edital.palavras_chave || [],
      requisitos: typeof edital.requisitos === 'string'
        ? edital.requisitos.split('\n').filter(r => r.trim())
        : (edital.requisitos || []),
      etapas: typeof edital.etapas === 'string'
        ? edital.etapas.split('\n').filter(e => e.trim())
        : (edital.etapas || []),
      documentos_necessarios: typeof edital.documentos_necessarios === 'string'
        ? edital.documentos_necessarios.split('\n').filter(d => d.trim())
        : (edital.documentos_necessarios || []),
      prazos_importantes: typeof edital.prazos_importantes === 'string'
        ? edital.prazos_importantes.split('\n').filter(p => p.trim())
        : (edital.prazos_importantes || []),
      ano: edital.ano,
      arquivoUrl: edital.arquivo_url,
      chunkCount: edital.getChunkCount(),
      createdAt: edital.createdAt,
      updatedAt: edital.updatedAt,
    }));

    res.json({
      success: true,
      data: editaisWithStats,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[API] List editais error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Rota para obter edital específico por ID
app.get('/api/edital/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const Edital = (await import('./models/Edital.js')).default;

    const edital = await Edital.findById(id);

    if (!edital) {
      return res.status(404).json({
        success: false,
        error: "Edital not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: edital._id.toString(),
        titulo: edital.titulo,
        descricao: edital.descricao,
        objetivo_principal: edital.objetivo_principal,
        publico_alvo: edital.publico_alvo,
        vagas: edital.vagas,
        inscricoes_periodo: edital.inscricoes_periodo,
        contatos: edital.contatos,
        palavras_chave: edital.palavras_chave,
        requisitos: edital.requisitos,
        etapas: edital.etapas,
        documentos_necessarios: edital.documentos_necessarios,
        prazos_importantes: edital.prazos_importantes,
        ano: edital.ano,
        arquivoUrl: edital.arquivo_url,
        createdAt: edital.createdAt,
        updatedAt: edital.updatedAt,
        ragStats: edital.getRAGStats(),
      },
    });
  } catch (error) {
    console.error("[API] Get edital error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Rota para obter chunks de um edital
app.get('/api/edital/:id/chunks', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    const Edital = (await import('./models/Edital.js')).default;

    const edital = await Edital.findById(id);

    if (!edital) {
      return res.status(404).json({
        success: false,
        error: "Edital not found",
      });
    }

    const sortedChunks = edital.chunks.sort((a, b) => a.chunk_index - b.chunk_index);

    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedChunks = sortedChunks.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedChunks.map((chunk) => ({
        id: chunk._id.toString(),
        index: chunk.chunk_index,
        conteudo: chunk.conteudo,
        wordCount: chunk.conteudo.split(/\s+/).length,
        createdAt: chunk._id.getTimestamp(),
      })),
      pagination: {
        total: sortedChunks.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("[API] Get chunks error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.use('/api/chat', chatRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: err.name || 'Error',
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// SERVER STARTUP (Only for local development)
// ============================================

// Global error handlers to prevent server crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Only start listening if running locally (not on Vercel)
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';

if (!isVercel) {
  // Start server with database connection (local development only)
  async function startServer() {
    try {
      const { connectDB } = await import('./config/database.js');
      await connectDB();

      const PORT = process.env.PORT || 3001;
      const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
      app.listen(PORT, HOST, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎓 HubSabia Backend Server Started                      ║
║                                                           ║
║   Port: ${PORT}                                              ║
║   Host: ${HOST === '0.0.0.0' ? '0.0.0.0 (producao)' : '127.0.0.1 (localhost)'}                             ║
║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
║   Database: MongoDB ✅                                    ║
║   URLs:                                                   ║
║   • http://${HOST === '0.0.0.0' ? 'SEU-IP' : '127.0.0.1'}:${PORT}                                 ║
║   • http://localhost:${PORT}                                 ║
║                                                           ║
║   API Endpoints:                                          ║
║   • GET  /api/health                                      ║
║   • POST /api/edital/upload                               ║
║   • GET  /api/editais                                     ║
║   • POST /api/chat/pergunta                               ║
║                                                           ║
║   Press Ctrl+C to stop the server                         ║
╚═══════════════════════════════════════════════════════════╝
  `);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  startServer();
}

// Export app for Vercel serverless
export default app;
