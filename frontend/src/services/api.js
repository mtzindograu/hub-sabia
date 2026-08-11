/**
 * HubSabia API Service
 * Centralized API client for backend communication
 *
 * @description Handles all HTTP requests to the backend
 */

import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    // Handle common errors
    const status = error.response?.status;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "An error occurred";

    // Prepare error report
    // CUIDADO: error.config.data pode ser objeto ou FormData — só serializa se for string JSON
    let payload_recebido = null;
    try {
      const raw = error.config?.data;
      if (typeof raw === "string" && raw) payload_recebido = JSON.parse(raw);
    } catch {
      // Corpo não serializável (FormData etc.) — reporta sem payload
    }

    const errorReport = {
      mensagem_erro: message,
      stack_erro: error.stack,
      rota_api: `${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      status_code: status,
      payload_recebido,
      origem_erro: 'frontend'
    };

    // Report error to backend (don't await, fire and forget)
    // Only report if it's NOT the error logging endpoint itself to avoid loops
    if (!error.config?.url?.includes('/logs/error')) {
      api.post('/logs/error', errorReport).catch(reportErr => {
        console.error('[API] Failed to report error to backend:', reportErr.message);
      });
    }

    if (error.response) {
      // 401 - Não autenticado: limpar dados e redirecionar para login
      if (status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        // Não redirecionar automaticamente — deixar o componente lidar com isso
        console.warn(
          "[API] Sessão expirada ou inválida — faça login novamente",
        );
      }

      // Preserva metadados do erro para os componentes (modais de créditos/gate)
      const err = new Error(message);
      err.status = status;
      err.code = error.response?.data?.code || null;
      err.reason = error.response?.data?.reason || null;
      return Promise.reject(err);
    } else if (error.request) {
      // Request was made but no response received
      console.error(
        "[API] No response received. Server may be offline or CORS issue.",
      );
      console.error("[API] Request details:", {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      });
      return Promise.reject(
        new Error(
          "Erro ao conectar com o servidor. Verifique se o backend está online.",
        ),
      );
    } else {
      // Error in request setup
      return Promise.reject(error);
    }
  },
);

// ============================================
// Edital API Endpoints
// ============================================

/**
 * Upload a new edital PDF
 * @param {FormData} formData - Form data with PDF file and metadata
 * @returns {Promise<Object>} Upload result
 */
export async function uploadEdital(formData) {
  return api.post("/edital/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 300000, // 5 minutes for file uploads and processing
  });
}

/**
 * Get all editais
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} List of editais
 */
export async function getEditais(params = {}) {
  return api.get("/editais", { params });
}

/**
 * Get a specific edital by ID
 * @param {string} id - Edital ID
 * @returns {Promise<Object>} Edital details
 */
export async function getEdital(id) {
  return api.get(`/edital/${id}`);
}

/**
 * Delete an edital
 * @param {string} id - Edital ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteEdital(id) {
  return api.delete(`/edital/${id}`);
}

/**
 * Get chunks for an edital
 * @param {string} id - Edital ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Edital chunks
 */
export async function getEditalChunks(id, params = {}) {
  return api.get(`/edital/${id}/chunks`, { params });
}

// ============================================
// Chat API Endpoints
// ============================================

/**
 * Ask a question about editais
 * @param {Object} data - Question data
 * @param {string} data.pergunta - The question
 * @param {string} [data.editalId] - Optional specific edital ID
 * @returns {Promise<Object>} Answer with sources
 */
export async function askQuestion(data) {
  return api.post("/chat/pergunta", data);
}

/**
 * Submit feedback for a chat interaction
 * @param {string} logId - Chat log ID
 * @param {number} feedback - 1 for positive, -1 for negative
 * @returns {Promise<Object>} Feedback result
 */
export async function submitFeedback(logId, feedback) {
  return api.post("/chat/feedback", { logId, feedback });
}

/**
 * Get suggested questions for an edital
 * @param {string} editalId - Edital ID
 * @returns {Promise<Object>} Suggested questions
 */
export async function getSuggestedQuestions(editalId) {
  return api.get(`/chat/sugestoes/${editalId}`);
}

/**
 * Get chat history
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Chat history
 */
export async function getChatHistory(params = {}) {
  return api.get("/chat/historico", { params });
}

/**
 * Get all conversations for current user
 * @returns {Promise<Object>} List of conversations
 */
export async function getConversations() {
  return api.get("/chat/conversas");
}

/**
 * Get messages for a specific conversation
 * @param {string} conversationId 
 * @returns {Promise<Object>} List of messages
 */
export async function getConversationMessages(conversationId) {
  return api.get(`/chat/conversa/${conversationId}`);
}

// ============================================
// Health Check
// ============================================

/**
 * Check API health status
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
  return api.get("/health");
}

// ============================================
// Auth API Endpoints
// ============================================

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.senha - User password
 * @param {string} [userData.nome] - User name
 * @param {string} [userData.role] - User role (admin or user)
 * @returns {Promise<Object>} Registration result
 */
export async function registerUser(userData) {
  return api.post("/auth/register", userData);
}

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.senha - User password
 * @returns {Promise<Object>} Login result with user and token
 */
export async function login(credentials) {
  return api.post("/auth/login", credentials);
}

/**
 * Logout user (client-side only)
 */
export function logout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");
}

/**
 * Get current user data
 * @returns {Promise<Object>} User data
 */
export async function getCurrentUser() {
  return api.get("/auth/me");
}

/**
 * Update user profile
 * @param {Object} updateData - Profile update data
 * @param {string} [updateData.nome] - New name
 * @param {string} [updateData.senha] - New password
 * @returns {Promise<Object>} Updated user
 */
export async function updateProfile(updateData) {
  return api.post("/auth/profile", updateData);
}

/**
 * Update Provider API Key
 * @param {string} provider - 'gemini', 'groq'
 * @param {string} apiKey - API Key (or null to remove)
 * @returns {Promise<Object>} Update result
 */
export async function updateProviderConfig(provider, apiKey) {
  return api.post("/auth/provider-config", { provider, apiKey });
}

/**
 * Update Preferred Provider
 * @param {string} provider - 'gemini' or 'groq'
 * @returns {Promise<Object>} Update result
 */
export async function updatePreferredProvider(provider) {
  return api.post("/auth/provider-preference", { provider });
}

/**
 * Mark user plan as acknowledged
 * @returns {Promise<Object>} Update result
 */
export async function acknowledgePlan() {
  return api.post("/auth/acknowledge-plan");
}

/**
 * Alterna o modo de uso: 'free' (créditos diários) ou 'own-key' (chave própria)
 * @param {'free'|'own-key'} mode
 * @returns {Promise<Object>} Update result
 */
export async function setPlanMode(mode) {
  return api.post("/auth/plan-mode", { mode });
}

/**
 * Get all users (admin only)
 * @returns {Promise<Object>} List of users
 */
export async function getAllUsers() {
  return api.get("/auth/users");
}

/**
 * Delete a user (admin only)
 * @param {string} userId - User ID to delete
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteUser(userId) {
  return api.delete(`/auth/users/${userId}`);
}

// Export default API instance
export default api;
