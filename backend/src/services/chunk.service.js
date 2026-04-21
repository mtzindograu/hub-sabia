/**
 * Text Chunking Service
 * Splits text into semantic chunks for RAG processing
 *
 * @description Implements various chunking strategies for optimal retrieval
 */

/**
 * Default chunking configuration
 */
const DEFAULT_CONFIG = {
  chunkSize: 1000, // Target characters per chunk (aumentado para mais contexto)
  chunkOverlap: 250, // Aumentado de 200 para 250 para mais continuidade
  minChunkSize: 100, // Minimum chunk size
  maxChunkSize: 2000, // Maximum chunk size
  separators: ["\n\n", "\n", ". ", " ", ""], // Hierarchy of separators
  preserveParagraphs: true,
  preserveSections: true, // NEW: tenta preservar seções do documento
};

/**
 * Split text into chunks with configurable strategy
 * @param {string} text - Text to split
 * @param {Object} config - Chunking configuration
 * @returns {Array<Object>} Array of text chunks with metadata
 */
export function splitTextIntoChunks(text, config = {}) {
  const options = { ...DEFAULT_CONFIG, ...config };

  if (!text || text.trim().length === 0) {
    return [];
  }

  // Clean text first
  let cleanedText = text.trim();

  // LIMITADOR DE SEGURANÇA
  if (cleanedText.length > 300000) {
    cleanedText = cleanedText.slice(0, 300000);
  }

  // Choose chunking strategy based on text structure
  if (options.preserveParagraphs && hasParagraphStructure(cleanedText)) {
    return chunkByParagraphs(cleanedText, options);
  }

  return chunkBySeparators(cleanedText, options);
}

/**
 * Check if text has paragraph structure
 * @param {string} text - Text to analyze
 * @returns {boolean} True if text has clear paragraphs
 */
function hasParagraphStructure(text) {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs.length > 1 && paragraphs.every((p) => p.trim().length > 50);
}

/**
 * Chunk text by preserving paragraph boundaries
 * @param {string} text - Text to chunk
 * @param {Object} options - Chunking options
 * @returns {Array<Object>} Chunked text
 */
function chunkByParagraphs(text, options) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const chunks = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();

    // If single paragraph exceeds max size, split it further
    if (trimmedParagraph.length > options.maxChunkSize) {
      // Save current chunk if not empty
      if (currentChunk.length >= options.minChunkSize) {
        chunks.push(
          createChunkObject(
            currentChunk.trim(),
            chunkIndex++,
            chunks.length > 0 ? chunks[chunks.length - 1] : null,
          ),
        );
        currentChunk = "";
      }

      // Split large paragraph
      const subChunks = chunkBySeparators(trimmedParagraph, options);
      subChunks.forEach((subChunk, idx) => {
        chunks.push({
          ...subChunk,
          index: chunkIndex++,
        });
      });
      continue;
    }

    // Check if adding paragraph exceeds chunk size
    const potentialChunk =
      currentChunk.length > 0
        ? `${currentChunk}\n\n${trimmedParagraph}`
        : trimmedParagraph;

    if (
      potentialChunk.length > options.chunkSize &&
      currentChunk.length >= options.minChunkSize
    ) {
      // Save current chunk and start new one with overlap
      chunks.push(
        createChunkObject(
          currentChunk.trim(),
          chunkIndex++,
          chunks.length > 0 ? chunks[chunks.length - 1] : null,
        ),
      );

      // Start new chunk with last sentence for overlap
      const overlapText = getOverlapText(currentChunk, options.chunkOverlap);
      currentChunk = overlapText
        ? `${overlapText}\n\n${trimmedParagraph}`
        : trimmedParagraph;
    } else {
      currentChunk = potentialChunk;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim().length >= options.minChunkSize) {
    chunks.push(
      createChunkObject(
        currentChunk.trim(),
        chunkIndex,
        chunks.length > 0 ? chunks[chunks.length - 1] : null,
      ),
    );
  }

  return chunks;
}

/**
 * Chunk text using separator hierarchy
 * @param {string} text - Text to chunk
 * @param {Object} options - Chunking options
 * @returns {Array<Object>} Chunked text
 */
function chunkBySeparators(text, options) {
  const chunks = [];
  let remainingText = text;
  let chunkIndex = 0;
  let previousChunk = null;

  while (remainingText.length > 0) {
    let chunkEnd = Math.min(options.chunkSize, remainingText.length);

    // Try to find a good breaking point
    if (chunkEnd < remainingText.length) {
      chunkEnd = findBestBreakPoint(remainingText, chunkEnd, options);
    }

    const chunkText = remainingText.slice(0, chunkEnd).trim();

    if (chunkText.length >= options.minChunkSize) {
      chunks.push(createChunkObject(chunkText, chunkIndex++, previousChunk));
      previousChunk = chunks[chunks.length - 1];
    }

    // Move forward with overlap
    const nextStart = chunkEnd - options.chunkOverlap;

    remainingText = remainingText.slice(nextStart > 0 ? nextStart : chunkEnd);
  }

  return chunks;
}

/**
 * Find the best point to break text
 * @param {string} text - Full text
 * @param {number} targetEnd - Target end position
 * @param {Object} options - Chunking options
 * @returns {number} Best break position
 */
function findBestBreakPoint(text, targetEnd, options) {
  const searchStart = Math.max(options.minChunkSize, targetEnd - 200);
  const searchText = text.slice(searchStart, targetEnd + 200);

  // Try each separator in order of preference
  for (const separator of options.separators) {
    // Look backward from target position
    const lastSeparatorIndex = searchText.lastIndexOf(separator);

    if (lastSeparatorIndex !== -1) {
      const breakPoint = searchStart + lastSeparatorIndex + separator.length;
      if (
        breakPoint >= options.minChunkSize &&
        breakPoint <= options.maxChunkSize
      ) {
        return breakPoint;
      }
    }
  }

  // If no good break point found, use target position
  return targetEnd;
}

/**
 * Get overlap text from the end of a chunk
 * @param {string} text - Chunk text
 * @param {number} overlapSize - Desired overlap size
 * @returns {string} Overlap text
 */
function getOverlapText(text, overlapSize) {
  if (text.length <= overlapSize) return text;

  const overlap = text.slice(-overlapSize);

  // Start from the first complete sentence if possible
  const sentenceStart = overlap.indexOf(". ");
  if (sentenceStart !== -1 && sentenceStart < overlap.length - 20) {
    return overlap.slice(sentenceStart + 2);
  }

  // Start from the first complete word
  const wordStart = overlap.indexOf(" ");
  if (wordStart !== -1) {
    return overlap.slice(wordStart + 1);
  }

  return overlap;
}

/**
 * Create a chunk object with metadata
 * @param {string} text - Chunk text
 * @param {number} index - Chunk index
 * @param {Object} previousChunk - Previous chunk for continuity
 * @returns {Object} Chunk object
 */
function createChunkObject(text, index, previousChunk) {
  return {
    index,
    conteudo: text,
    wordCount: text.split(/\s+/).filter((w) => w.length > 0).length,
    characterCount: text.length,
    hasPreviousContext: previousChunk !== null,
  };
}

/**
 * Merge small chunks together
 * @param {Array<Object>} chunks - Array of chunks
 * @param {number} minSize - Minimum chunk size
 * @returns {Array<Object>} Merged chunks
 */
export function mergeSmallChunks(
  chunks,
  minSize = DEFAULT_CONFIG.minChunkSize,
) {
  if (chunks.length <= 1) return chunks;

  const merged = [];
  let current = null;

  for (const chunk of chunks) {
    if (!current) {
      current = { ...chunk };
      continue;
    }

    if (current.characterCount < minSize) {
      // Merge with current
      current.conteudo = `${current.conteudo}\n\n${chunk.conteudo}`;
      current.characterCount = current.conteudo.length;
      current.wordCount = current.conteudo
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
    } else {
      merged.push(current);
      current = { ...chunk };
    }
  }

  if (current) {
    merged.push(current);
  }

  // Reindex
  return merged.map((chunk, index) => ({ ...chunk, index }));
}

/**
 * Get chunking statistics
 * @param {Array<Object>} chunks - Array of chunks
 * @returns {Object} Chunking statistics
 */
export function getChunkingStats(chunks) {
  if (!chunks || chunks.length === 0) {
    return {
      totalChunks: 0,
      totalCharacters: 0,
      totalWords: 0,
      averageChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
    };
  }

  const sizes = chunks.map((c) => c.characterCount);

  return {
    totalChunks: chunks.length,
    totalCharacters: sizes.reduce((a, b) => a + b, 0),
    totalWords: chunks.reduce((a, c) => a + c.wordCount, 0),
    averageChunkSize: Math.round(
      sizes.reduce((a, b) => a + b, 0) / sizes.length,
    ),
    minChunkSize: Math.min(...sizes),
    maxChunkSize: Math.max(...sizes),
  };
}

export default {
  splitTextIntoChunks,
  mergeSmallChunks,
  getChunkingStats,
  DEFAULT_CONFIG,
};
