/**
 * Gemini Service Bridge
 * Maintains backward compatibility with existing code (embedding.service, routes, etc.)
 */

import { geminiProvider, GEMINI_MODELS, autoDiscoverModels } from "./providers/gemini.provider.js";

// Re-exporting GEMINI_MODELS and autoDiscoverModels (Source of Truth is in gemini.provider.js)
export { GEMINI_MODELS, autoDiscoverModels };

// Re-exporting methods bound to the singleton instance
export const generateResponse = geminiProvider.generateResponse.bind(geminiProvider);
export const generateEmbedding = geminiProvider.generateEmbedding.bind(geminiProvider);
export const validateApiKey = geminiProvider.validateApiKey.bind(geminiProvider);
export const extractMainPoints = geminiProvider.extractMainPoints.bind(geminiProvider);
export const generateEditalSummary = geminiProvider.generateEditalSummary.bind(geminiProvider);

// Default export as the singleton provider
export default geminiProvider;
