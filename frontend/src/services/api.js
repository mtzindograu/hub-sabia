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
  (error) => {
    // Handle common errors
    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.error ||
        error.response.data?.message ||
        "An error occurred";

      // 401 - Não autenticado: limpar dados e redirecionar para login
      if (status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        // Não redirecionar automaticamente — deixar o componente lidar com isso
        console.warn(
          "[API] Sessão expirada ou inválida — faça login novamente",
        );
      }

      // 403 - Acesso negado: mensagem amigável
      if (status === 403) {
        console.warn(
          "[API] Acesso negado — você não tem permissão para esta ação",
        );
        return Promise.reject(
          new Error(
            "Acesso negado — você não tem permissão para realizar esta ação",
          ),
        );
      }

      return Promise.reject(new Error(message));
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
    timeout: 60000, // 1 minute for file uploads
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
  return api.put("/auth/profile", updateData);
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
