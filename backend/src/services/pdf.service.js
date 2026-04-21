/**
 * PDF Processing Service
 * Handles PDF upload and text extraction
 *
 * @description Core service for processing academic notice PDFs
 */

import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
    throw error;
  }
}

/**
 * Validates a PDF file
 */
export function validatePDF(file) {
  const errors = [];

  if (!file) {
    return { valid: false, errors: ['No file provided'] };
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  const allowedMimeTypes = ['application/pdf'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    errors.push('Invalid file type. Only PDF files are allowed');
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf') {
    errors.push('Invalid file extension. Only .pdf files are allowed');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Extract text content from a PDF file
 * Tries multiple methods to extract text
 */
export async function extractTextFromPDF(pdfBuffer, originalName = 'temp.pdf') {
  console.log("==========================================================");
  console.log("[PDF] INICIANDO EXTRAÇÃO DE TEXTO");
  console.log(`[PDF] Arquivo: ${originalName}`);
  console.log(`[PDF] Buffer size: ${pdfBuffer.length} bytes`);
  console.log("==========================================================");

  // Method 1: Try normal extraction with pdf-parse
  try {
    console.log('[PDF] Tentando Método 1: Extração normal com pdf-parse...');
    const data = await pdfParse(pdfBuffer, {
      max: 0,
      version: 'v1.10.100'
    });

    const normalText = data.text.trim();
    console.log(`[PDF] Método 1: ${normalText.length} caracteres extraídos`);
    console.log(`[PDF] Preview do texto: "${normalText.slice(0, 200)}..."`);

    if (normalText.length >= 100) {
      console.log('[PDF] Método 1: SUCESSO - Texto suficiente extraído!');
      return {
        success: true,
        text: normalText,
        metadata: {
          pages: data.numpages,
          info: data.info,
          version: data.version,
          method: 'normal'
        }
      };
    }

    // If got some text but not enough, return it anyway
    if (normalText.length > 0) {
      console.log('[PDF] Texto extraído mas limitado');
      return {
        success: true,
        text: normalText,
        metadata: {
          pages: data.numpages,
          info: data.info,
          version: data.version,
          method: 'limited'
        }
      };
    }
  } catch (error) {
    console.error('[PDF] Erro no Método 1:', error.message);
  }

  // Method 2: Try with different version
  try {
    console.log('[PDF] Tentando Método 2: Extração alternativa...');
    const data = await pdfParse(pdfBuffer, {
      max: 0,
      version: 'v2.0.550'
    });

    const altText = data.text.trim();
    console.log(`[PDF] Método 2: ${altText.length} caracteres extraídos`);
    console.log(`[PDF] Preview do texto: "${altText.slice(0, 200)}..."`);

    if (altText.length >= 100) {
      console.log('[PDF] Método 2: SUCESSO!');
      return {
        success: true,
        text: altText,
        metadata: {
          pages: data.numpages,
          info: data.info,
          version: data.version,
          method: 'alternative'
        }
      };
    }

    if (altText.length > 0) {
      console.log('[PDF] Retornando texto alternativo limitado');
      return {
        success: true,
        text: altText,
        metadata: {
          pages: data.numpages,
          info: data.info,
          version: data.version,
          method: 'limited'
        }
      };
    }
  } catch (error) {
    console.error('[PDF] Erro no Método 2:', error.message);
  }

  // All methods failed - return empty text
  console.log('[PDF] Todos os métodos de extração falharam');
  console.log('[PDF] Retornando texto vazio - usar conteúdo manual se disponível');
  return {
    success: true,
    text: '',
    metadata: {
      pages: 0,
      method: 'failed',
      message: 'Não foi possível extrair texto do PDF. Use o campo de conteúdo manual.'
    }
  };
}

/**
 * Save uploaded file to disk
 */
export async function savePDFFile(fileBuffer, originalName) {
  await ensureUploadDir();

  const fileId = uuidv4();
  const ext = path.extname(originalName);
  const fileName = `${fileId}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  try {
    await fs.writeFile(filePath, fileBuffer);

    return {
      success: true,
      fileId,
      fileName,
      filePath,
      url: `/uploads/${fileName}`,
      size: fileBuffer.length
    };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Read a PDF file from disk
 */
export async function readPDFFile(fileName) {
  const filePath = path.join(UPLOAD_DIR, fileName);

  try {
    const buffer = await fs.readFile(filePath);
    return { success: true, buffer };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a PDF file from disk
 */
export async function deletePDFFile(fileName) {
  const filePath = path.join(UPLOAD_DIR, fileName);

  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clean text extracted from PDF
 */
export function cleanPDFText(text) {
  if (!text) return '';

  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[^\x20-\x7E\n\r\u00A0-\uFFFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .trim();
}

/**
 * Get PDF statistics
 */
export function getPDFStats(text) {
  if (!text) {
    return {
      characterCount: 0,
      wordCount: 0,
      lineCount: 0,
      estimatedTokens: 0
    };
  }

  const words = text.split(/\s+/).filter(word => word.length > 0);
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  return {
    characterCount: text.length,
    wordCount: words.length,
    lineCount: lines.length,
    estimatedTokens: Math.ceil(text.length / 4)
  };
}

export default {
  validatePDF,
  extractTextFromPDF,
  savePDFFile,
  readPDFFile,
  deletePDFFile,
  cleanPDFText,
  getPDFStats
};
