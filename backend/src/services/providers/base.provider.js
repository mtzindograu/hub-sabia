/**
 * Base Provider Interface
 * Defines the contract for all AI providers
 */
export default class BaseProvider {
  async generateResponse(question, contextChunks, options) {
    throw new Error("Method generateResponse must be implemented");
  }

  async generateEmbedding(text, options) {
    throw new Error("Method generateEmbedding must be implemented");
  }

  async validateApiKey(apiKey) {
    throw new Error("Method validateApiKey must be implemented");
  }

  async extractMainPoints(editalContent, options) {
    throw new Error("Method extractMainPoints must be implemented");
  }

  async generateEditalSummary(editalContent, options) {
    throw new Error("Method generateEditalSummary must be implemented");
  }

  async *streamResponse(question, contextChunks, options) {
    throw new Error("Method streamResponse must be implemented");
  }
}
