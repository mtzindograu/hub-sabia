/**
 * Text Chunking Utilities
 * Helper functions for text processing and chunking
 * 
 * @description Common utilities for text manipulation
 */

/**
 * Count words in text
 * @param {string} text - Text to count
 * @returns {number} Word count
 */
export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Count sentences in text
 * @param {string} text - Text to count
 * @returns {number} Sentence count
 */
export function countSentences(text) {
  if (!text) return 0;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.length;
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 200, suffix = '...') {
  if (!text || text.length <= maxLength) return text || '';
  
  // Try to break at a sentence or word boundary
  const breakPoint = text.lastIndexOf('.', maxLength);
  if (breakPoint > maxLength * 0.5) {
    return text.slice(0, breakPoint + 1) + suffix;
  }
  
  const wordBreak = text.lastIndexOf(' ', maxLength);
  if (wordBreak > maxLength * 0.5) {
    return text.slice(0, wordBreak) + suffix;
  }
  
  return text.slice(0, maxLength) + suffix;
}

/**
 * Highlight search terms in text
 * @param {string} text - Original text
 * @param {string} searchTerm - Term to highlight
 * @param {string} highlightTag - HTML tag for highlighting
 * @returns {string} Text with highlights
 */
export function highlightText(text, searchTerm, highlightTag = 'mark') {
  if (!text || !searchTerm) return text || '';
  
  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  return text.replace(regex, `<${highlightTag}>$1</${highlightTag}>`);
}

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract keywords from text
 * @param {string} text - Text to analyze
 * @param {number} count - Number of keywords to extract
 * @returns {Array<string>} Keywords
 */
export function extractKeywords(text, count = 10) {
  if (!text) return [];
  
  // Common Portuguese stop words
  const stopWords = new Set([
    'a', 'o', 'e', 'de', 'da', 'do', 'que', 'em', 'para', 'com',
    'um', 'uma', 'os', 'as', 'por', 'mais', 'na', 'no', 'se', 'mas',
    'como', 'foi', 'ao', 'ser', 'tem', 'seu', 'sua', 'ou', 'quando',
    'muito', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela',
    'até', 'isso', 'ela', 'entre', 'depois', 'sem', 'mesmo', 'aos',
    'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'você', 'protocolo',
    'estão', 'minha', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual'
  ]);
  
  // Extract words
  const words = text.toLowerCase()
    .replace(/[^\wàáâãéêíóôõúç\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Count frequencies
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Sort by frequency and return top
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

/**
 * Clean and normalize text
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
export function cleanText(text) {
  if (!text) return '';
  
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove excessive spaces
    .replace(/[ \t]+/g, ' ')
    // Remove trailing whitespace per line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Final trim
    .trim();
}

/**
 * Check if text contains specific keywords
 * @param {string} text - Text to search
 * @param {Array<string>} keywords - Keywords to find
 * @returns {Object} Match information
 */
export function containsKeywords(text, keywords) {
  if (!text || !keywords || keywords.length === 0) {
    return { found: false, matches: [] };
  }
  
  const lowerText = text.toLowerCase();
  const matches = keywords.filter(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
  
  return {
    found: matches.length > 0,
    matches,
    matchCount: matches.length
  };
}

/**
 * Split text at natural boundaries
 * @param {string} text - Text to split
 * @returns {Array<string>} Text segments
 */
export function splitAtNaturalBoundaries(text) {
  if (!text) return [];
  
  // Split by paragraph breaks first
  return text.split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

export default {
  countWords,
  countSentences,
  truncateText,
  highlightText,
  extractKeywords,
  cleanText,
  containsKeywords,
  splitAtNaturalBoundaries
};
