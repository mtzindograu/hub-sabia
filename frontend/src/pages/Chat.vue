<template>
  <div class="chat-wrapper">
    <!-- Header para visitantes -->
    <header v-if="!isLoggedIn" class="chat-public-header">
      <router-link to="/" class="btn-back-home">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>HubSabia</span>
      </router-link>
      <div class="header-actions-public">
        <ThemeToggle />
        <router-link to="/login" class="btn-ghost-login">Entrar</router-link>
        <router-link to="/login?tab=register" class="btn-create-account"
          >Criar Conta</router-link
        >
      </div>
    </header>

    <div class="chat-page">
      <!-- Sidebar -->
      <aside class="chat-sidebar" :class="{ closed: sidebarClosed }">
        <div class="sidebar-header">
          <div class="header-top">
            <h2>HubSabia AI</h2>
            <button
              class="close-sidebar"
              @click="sidebarClosed = true"
              v-if="!sidebarClosed"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p>Faça perguntas sobre editais acadêmicos</p>
        </div>

        <!-- New Chat Button -->
        <div class="sidebar-section text-center" style="align-self: flex-start">
          <button class="btn btn-primary btn-new-chat" @click="startNewChat">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova Conversa
          </button>
        </div>

        <!-- Edital Selector -->
        <div class="sidebar-section">
          <label class="section-label">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              />
            </svg>
            Filtrar por Edital
          </label>
          <select
            v-model="selectedEditalId"
            class="form-select"
            @change="onEditalChange"
          >
            <option :value="null">Todos os editais</option>
            <option
              v-for="edital in editais"
              :key="edital.id"
              :value="edital.id"
            >
              {{ edital.titulo }} ({{ edital.ano }})
            </option>
          </select>
        </div>

        <!-- Chat History (Only for logged users) -->
        <div
          v-if="isLoggedIn && conversations.length > 0"
          class="sidebar-section history-section"
        >
          <label class="section-label">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 8v4l3 2" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            Histórico
          </label>
          <div class="history-list">
            <button
              v-for="conv in conversations"
              :key="conv._id"
              :class="[
                'history-item',
                { active: currentConversationId === conv._id },
              ]"
              @click="loadConversation(conv._id)"
            >
              <div class="history-item-content">
                <span class="history-title">{{ conv.titulo }}</span>
                <span class="history-date">{{
                  formatDate(conv.last_message_at)
                }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Suggested Questions -->
        <div v-if="suggestedQuestions.length > 0" class="sidebar-section">
          <label class="section-label">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Perguntas Sugeridas
          </label>
          <div class="suggested-list">
            <button
              v-for="(question, index) in suggestedQuestions"
              :key="index"
              class="suggested-item"
              @click="askSuggested(question)"
            >
              {{ question }}
            </button>
          </div>
        </div>
      </aside>

      <!-- AI Provider Onboarding Overlay -->
      <main class="chat-main">
        <PlanSelectionModal 
          :is-visible="isPlanSelectionModalVisible" 
          @select-plan="handleAcknowledgePlan"
        />

        <div v-if="isLoggedIn && userData" class="chat-header-actions">
           <CurrentPlanCard :user="userData" @open-modal="isPlanSelectionModalVisible = true" />
        </div>

        <!-- Credits Exhausted Modal -->
        <div v-if="isExhaustedModalVisible" class="credit-modal-overlay">
          <div class="credit-modal">
            <div class="credit-modal-header">
              <h1>Créditos de hoje usados</h1>
              <p>Você usou os 20 créditos gratuitos disponíveis.</p>
            </div>
            <div class="credit-modal-body">
              <p class="credit-modal-note">
                Sua cota renova automaticamente em 24h. Sem esperar? Configure sua
                própria chave de IA para uso ilimitado.
              </p>
              <router-link to="/perfil" class="btn btn-primary btn-block">
                Usar minha chave de IA
              </router-link>
              <button class="btn btn-ghost btn-block" @click="isExhaustedModalVisible = false">
                Fechar
              </button>
            </div>
          </div>
        </div>

        <!-- Auth Gate: visitantes e sessões expiradas não usam a IA -->
        <div v-else-if="!isLoggedIn || authGateVisible" class="auth-gate">
          <div class="auth-gate-card">
            <div class="auth-gate-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2>Entre para usar o Chat IA</h2>
            <p>Crie uma conta ou faça login para perguntar sobre editais.</p>
            <router-link to="/login" class="btn btn-primary btn-block">Entrar</router-link>
            <router-link to="/login?tab=register" class="btn btn-outline btn-block">Criar conta</router-link>
          </div>
        </div>

        <!-- Normal Chat Content -->
        <template v-else>
          <!-- Toggle Sidebar Button -->
          <button
            class="toggle-sidebar"
            @click="sidebarClosed = false"
            v-if="sidebarClosed"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 8L22 12L18 16" />
              <path d="M2 12H22" />
            </svg>
          </button>

          <!-- Messages Container -->
          <div ref="messagesContainer" class="messages-container">
            <!-- Welcome Message -->
            <div v-if="messages.length === 0" class="welcome-message">
              <div class="welcome-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  />
                </svg>
              </div>
              <h2>Olá! Como posso ajudar?</h2>
              <p>
                {{
                  selectedEditalId
                    ? "Faça perguntas sobre este edital específico."
                    : "Selecione um edital ou pergunte sobre todos os editais disponíveis."
                }}
              </p>

              <!-- Quick Start Buttons -->
              <div class="quick-start" v-if="editais.length > 0">
                <button
                  v-for="edital in editais.slice(0, 3)"
                  :key="edital.id"
                  class="quick-edital"
                  @click="selectEdital(edital.id)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    />
                  </svg>
                  {{ edital.titulo.slice(0, 30)
                  }}{{ edital.titulo.length > 30 ? "..." : "" }}
                </button>
              </div>
            </div>

            <!-- Messages -->
            <div v-else class="messages-list">
              <MessageBubble
                v-for="(message, index) in messages"
                :key="index"
                :message="message"
                :showSources="message.type === 'assistant'"
              />
            </div>

            <!-- Loading Indicator -->
            <div v-if="loading" class="loading-message">
              <div class="loading-bubble">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="loading-text">Analisando editais...</span>
              </div>
            </div>

            <!-- Scroll to bottom button -->
            <button
              v-show="showScrollButton"
              class="scroll-bottom"
              @click="scrollToBottom"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <!-- Input Area -->
          <div class="input-area">
            <form @submit.prevent="sendMessage" class="input-form">
              <div class="input-wrapper">
                <textarea
                  ref="inputField"
                  v-model="userInput"
                  placeholder="Digite sua pergunta sobre editais..."
                  rows="1"
                  @keydown.enter.exact.prevent="sendMessage"
                  @input="autoResize"
                ></textarea>
                <button
                  type="submit"
                  class="send-button"
                  :disabled="!userInput.trim() || loading"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </form>
            <p class="input-hint">
              Pressione Enter para enviar • IA baseada em RAG
            </p>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import MessageBubble from "../components/MessageBubble.vue";
import CurrentPlanCard from "../components/CurrentPlanCard.vue";
import PlanSelectionModal from "../components/PlanSelectionModal.vue";
import {
  askQuestion,
  getEditais,
  getSuggestedQuestions,
  getConversations,
  getConversationMessages,
  acknowledgePlan,
  getCurrentUser,
} from "../services/api.js";
import { error as showError, success as showSuccess } from "../utils/toast.js";
import ThemeToggle from "../components/ThemeToggle.vue";

const route = useRoute();
const router = useRouter();

// State
const messages = ref([]);
const userInput = ref("");
const loading = ref(false);
const editais = ref([]);
const selectedEditalId = ref(null);
const suggestedQuestions = ref([]);
const messagesContainer = ref(null);
const inputField = ref(null);
const sidebarClosed = ref(false);
const showScrollButton = ref(false);
const editaisLoaded = ref(false);
const isLoggedIn = ref(false);
const userData = ref(null);
const isPlanSelectionModalVisible = ref(false);
const isExhaustedModalVisible = ref(false);
const isPlanAcknowledged = ref(true);
const authGateVisible = ref(false);

// History management
const conversations = ref([]);
const currentConversationId = ref(null);

// Check login status and data
onMounted(async () => {
  isLoggedIn.value = !!localStorage.getItem("auth_token");

  await loadEditais();

  if (isLoggedIn.value) {
    fetchConversations();
    checkUserKey();
  }

  // Check for edital ID in route
  if (route.params.id) {
    selectedEditalId.value = route.params.id;
    await loadSuggestedQuestions(route.params.id);
  }

  // Scroll event listener
  messagesContainer.value?.addEventListener("scroll", handleScroll);

  // Initial scroll to bottom
  scrollToBottom();
});

async function refreshUserData() {
  try {
    const response = await getCurrentUser();
    // O interceptor retorna {success, data} — extrair o usuário real
    const user = response?.data || response;
    if (user && user.email) {
      userData.value = user;
      isPlanAcknowledged.value = !!user.planAcknowledged;
      // Update local cache (objeto usuário real — nunca o wrapper)
      localStorage.setItem("user", JSON.stringify(user));
    }
  } catch (err) {
    console.error("Error refreshing user data:", err);
  }
}

function checkUserKey() {
  const stored = localStorage.getItem("user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.email) {
        userData.value = parsed;
        isPlanAcknowledged.value = !!parsed.planAcknowledged;
      }
    } catch {
      // dados corrompidos — ignora
    }
  }
  
  if (isLoggedIn.value) {
    refreshUserData();
  }
  
  isPlanSelectionModalVisible.value = isLoggedIn.value && !isPlanAcknowledged.value;
}

async function handleAcknowledgePlan() {
  try {
    await acknowledgePlan();
    await refreshUserData();
    isPlanSelectionModalVisible.value = false;
    isPlanAcknowledged.value = true;
    showSuccess('Plano atualizado com sucesso!');
  } catch (err) {
    console.error("Error acknowledging plan:", err);
    showError('Erro ao atualizar plano.');
  }
}

async function fetchConversations() {
  try {
    const response = await getConversations();
    conversations.value = response.data || [];
  } catch (error) {
    console.error("Error fetching conversations:", error);
  }
}

async function loadConversation(id) {
  try {
    loading.value = true;
    currentConversationId.value = id;
    const response = await getConversationMessages(id);

    // Transform logs into messages
    const transformedMessages = [];
    response.data.forEach((log) => {
      transformedMessages.push({
        type: "user",
        content: log.pergunta,
        timestamp: log.createdAt,
      });
      if (log.resposta) {
        transformedMessages.push({
          id: log._id,
          type: "assistant",
          content: log.resposta,
          sources: log.metadata?.sources || [],
          timestamp: log.createdAt,
          feedback: log.feedback,
        });
      }
    });

    messages.value = transformedMessages;

    const conv = conversations.value.find((c) => c._id === id);
    if (conv && conv.edital_id) {
      selectedEditalId.value = conv.edital_id._id || conv.edital_id;
    }
  } catch (error) {
    showError("Erro ao carregar histórico");
  } finally {
    loading.value = false;
  }
}

function startNewChat() {
  messages.value = [];
  currentConversationId.value = null;
}

async function loadEditais() {
  if (editaisLoaded.value) return;
  try {
    const response = await getEditais();
    editais.value = response.data || [];
    editaisLoaded.value = true;
  } catch (error) {
    console.error("Error loading editais:", error);
  }
}

async function loadSuggestedQuestions(editalId) {
  try {
    const response = await getSuggestedQuestions(editalId);
    suggestedQuestions.value = response.data?.questions || [];
  } catch (error) {
    console.error("Error loading suggestions:", error);
    suggestedQuestions.value = [];
  }
}

function onEditalChange() {
  if (selectedEditalId.value) {
    loadSuggestedQuestions(selectedEditalId.value);
  } else {
    suggestedQuestions.value = [];
  }
}

function selectEdital(id) {
  selectedEditalId.value = id;
  loadSuggestedQuestions(id);
}

async function sendMessage() {
  const question = userInput.value.trim();
  if (!question || loading.value) return;

  // Add user message
  messages.value.push({
    type: "user",
    content: question,
  });

  // Clear input
  userInput.value = "";
  if (inputField.value) {
    inputField.value.style.height = "auto";
  }

  // Show loading
  loading.value = true;

  try {
    // Send question to API
    const response = await askQuestion({
      pergunta: question,
      editalId: selectedEditalId.value,
      conversationId: currentConversationId.value,
    });

    if (!currentConversationId.value && response.data.conversationId) {
      currentConversationId.value = response.data.conversationId;
      fetchConversations();
    }

    // Add assistant message
    messages.value.push({
      id: response.data.id,
      type: "assistant",
      content: response.data.resposta,
      sources: response.data.fontes,
      metadata: response.data.metadata,
    });

    // Contador vivo: atualiza créditos com o valor pós-débito da API
    if (response.data.creditStatus && userData.value) {
      userData.value = {
        ...userData.value,
        remainingCredits: response.data.creditStatus.remaining,
      };
      localStorage.setItem("user", JSON.stringify(userData.value));
    }
  } catch (error) {
    if (error.status === 401) {
      // Sessão expirada ou inválida — volta para o gate de login
      authGateVisible.value = true;
      isLoggedIn.value = false;
    } else if (error.code === "CREDITS_EXHAUSTED") {
      isExhaustedModalVisible.value = true;
    } else {
      showError(error.message || "Erro ao processar pergunta");
      messages.value.push({
        type: "error",
        content: "Erro de conexão. Tente novamente.",
      });
    }
  }
 finally {
    loading.value = false;
  }
}

function askSuggested(question) {
  userInput.value = question;
  sendMessage();
}

function scrollToBottom() {
  if (!messagesContainer.value) return;
  requestAnimationFrame(() => {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: "smooth",
    });
  });
}

function handleScroll() {
  if (!messagesContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  showScrollButton.value = scrollHeight - scrollTop - clientHeight > 200;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString("pt-BR") +
    " " +
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

watch(
  messages,
  () => {
    nextTick(() => scrollToBottom());
  },
  { deep: true },
);

function autoResize() {
  if (inputField.value) {
    inputField.value.style.height = "auto";
    inputField.value.style.height =
      Math.min(inputField.value.scrollHeight, 150) + "px";
  }
}
</script>

<style scoped>
.chat-wrapper {
  min-height: calc(100vh - 140px);
  margin: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-page {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100%;
  min-height: calc(100vh - 220px);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex: 1;
}

/* Header para visitantes */
.chat-public-header {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.btn-back-home {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-gray-700);
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  transition: all 150ms ease;
}

.btn-back-home:hover {
  background: var(--color-surface-2);
  color: var(--color-primary-600);
}

.btn-back-home svg {
  width: 20px;
  height: 20px;
}

.header-actions-public {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-ghost-login {
  color: var(--color-gray-600);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  transition: all 150ms ease;
}

.btn-ghost-login:hover {
  background: var(--color-surface-2);
  color: var(--color-gray-900);
}

.btn-create-account {
  background: var(--color-primary-600);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  padding: 0.5rem 1.125rem;
  border-radius: var(--radius-md);
  transition: all 150ms ease;
}

.btn-create-account:hover {
  background: var(--color-primary-700);
  box-shadow: var(--shadow-primary);
}

/* Sidebar */
.chat-sidebar {
  background: var(--color-gray-50);
  padding: 1rem;
  overflow-y: auto;
  border-right: 1px solid var(--color-border);
  transition: width var(--transition-slow);
  display: flex;
  flex-direction: column;
}

.chat-sidebar.closed {
  display: none;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.sidebar-header h2 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.close-sidebar {
  background: none;
  border: none;
  padding: 0.375rem;
  cursor: pointer;
  color: var(--color-gray-500);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.close-sidebar svg {
  width: 16px;
  height: 16px;
}

.close-sidebar:hover {
  background: var(--color-surface-2);
  color: var(--color-gray-700);
}

.sidebar-header p {
  color: var(--color-gray-500);
  font-size: 0.75rem;
}

/* Sidebar Sections */
.sidebar-section {
  margin-bottom: 1.25rem;
}

.btn-new-chat {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.45rem 0.875rem;
  font-weight: 600;
  font-size: 0.8125rem;
  width: auto;
  margin: 0 auto;
}

.btn-new-chat svg {
  width: 14px;
  height: 14px;
}

.text-center {
  text-align: center;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray-600);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

.section-label svg {
  width: 14px;
  height: 14px;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  background: var(--color-surface);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--color-text);
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

/* History List */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.history-item {
  text-align: left;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  background: var(--color-surface-2);
  border-color: var(--color-primary-300);
}

.history-item.active {
  background: var(--color-primary-50);
  border-color: var(--color-primary-500);
}

.history-item-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.history-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-date {
  font-size: 0.6875rem;
  color: var(--color-gray-500);
}

/* Suggested Questions */
.suggested-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suggested-item {
  text-align: left;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-gray-700);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.suggested-item:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-500);
  color: var(--color-primary-700);
  transform: translateX(4px);
}

/* Chat Main */
.chat-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* Toggle Sidebar Button */
.toggle-sidebar {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 10;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.4rem;
  cursor: pointer;
  color: var(--color-gray-500);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
}

.toggle-sidebar:hover {
  background: var(--color-surface-2);
  color: var(--color-primary-600);
}

.toggle-sidebar svg {
  width: 18px;
  height: 18px;
}

/* Messages Container */
.messages-container {
  flex: 1;
  overflow-y: scroll;
  padding: 1rem;
  scroll-behavior: smooth;
  background: var(--color-bg);
  position: relative;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Welcome Message */
.welcome-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  text-align: center;
  color: var(--color-gray-500);
  padding: 2rem;
}

.welcome-icon {
  width: 60px;
  height: 60px;
  background: var(--color-primary-600);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.welcome-icon svg {
  width: 30px;
  height: 30px;
  color: var(--color-text-inverse);
}

.welcome-message h2 {
  font-size: 1.5rem;
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
}

.welcome-message p {
  color: var(--color-gray-500);
  font-size: 1rem;
  max-width: 400px;
}

/* Quick Start */
.quick-start {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
  justify-content: center;
}

.quick-edital {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--color-gray-700);
  cursor: pointer;
  transition: all var(--transition-fast);
  max-width: 200px;
}

.quick-edital:hover {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  transform: translateY(-2px);
  box-shadow: var(--shadow-primary);
}

.quick-edital svg {
  width: 16px;
  height: 16px;
  color: var(--color-primary-600);
}

/* Loading Message */
.loading-message {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1rem;
}

.loading-bubble {
  background: var(--color-surface-2);
  border-radius: var(--radius-lg);
  border-top-left-radius: var(--radius-sm);
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: var(--color-gray-400);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.loading-text {
  font-size: 0.875rem;
  color: var(--color-gray-500);
}

/* Scroll Bottom Button */
.scroll-bottom {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  width: 36px;
  height: 36px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
}

.scroll-bottom svg {
  width: 18px;
  height: 18px;
  color: var(--color-primary-600);
}

/* Input Area */
.input-area {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.input-form {
  display: flex;
  gap: 0.5rem;
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: flex-end;
  background: var(--color-surface-2);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.4rem;
  transition: all var(--transition-fast);
}

.input-wrapper:focus-within {
  border-color: var(--color-primary-500);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.input-wrapper textarea {
  flex: 1;
  border: none;
  background: transparent;
  resize: none;
  padding: 0.5rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  max-height: 150px;
  font-family: inherit;
  color: var(--color-text);
}

.input-wrapper textarea:focus {
  outline: none;
}

.send-button {
  width: 36px;
  height: 36px;
  background: var(--color-primary-600);
  border: none;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  background: var(--color-primary-700);
}
.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.send-button svg {
  width: 16px;
  height: 16px;
  color: var(--color-text-inverse);
}

.input-hint {
  font-size: 0.75rem;
  color: var(--color-gray-400);
  text-align: center;
  margin-top: 0.5rem;
}

/* AI Provider Onboarding Styles */
.chat-header-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 50;
}

/* ===== Gate de login (visitantes / sessão expirada) ===== */
.auth-gate {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.auth-gate-card {
  max-width: 360px;
  width: 100%;
  text-align: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 2rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.auth-gate-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto;
  border-radius: var(--radius-lg);
  background: var(--color-primary-50);
  color: var(--color-primary-600);
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-gate-icon svg {
  width: 24px;
  height: 24px;
}

.auth-gate-card h2 {
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 600;
  margin: 0;
}

.auth-gate-card p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 0.5rem;
}

/* ===== Modal de créditos esgotados ===== */
.credit-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.credit-modal {
  max-width: 400px;
  width: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 2rem 1.75rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.credit-modal-header h1 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.375rem;
}

.credit-modal-header p {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  margin: 0;
}

.credit-modal-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.credit-modal-note {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin: 0 0 0.5rem;
}
</style>