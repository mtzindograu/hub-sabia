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

        <!-- Tips -->
        <div class="sidebar-section tips-section">
          <label class="section-label">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Dicas
          </label>
          <ul class="tips-list">
            <li>Seja específico em suas perguntas</li>
            <li>Pergunte sobre prazos e requisitos</li>
            <li>Mencione o nome do edital</li>
          </ul>
        </div>
      </aside>

      <!-- Chat Area -->
      <main class="chat-main">
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
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import MessageBubble from "../components/MessageBubble.vue";
import {
  askQuestion,
  getEditais,
  getSuggestedQuestions,
} from "../services/api.js";
import { error as showError } from "../utils/toast.js";
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

// Check login status
onMounted(async () => {
  isLoggedIn.value = !!localStorage.getItem("auth_token");

  await loadEditais();

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

async function loadEditais() {
  // Evitar requisições duplicadas
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
    });

    // Add assistant message
    messages.value.push({
      type: "assistant",
      content: response.data.resposta,
      sources: response.data.fontes,
      metadata: response.data.metadata,
    });
  } catch (error) {
    showError(
      error.message ||
        "Não foi possível processar sua pergunta. Tente novamente.",
    );
    messages.value.push({
      type: "error",
      content:
        "Não foi possível processar sua pergunta. Verifique sua conexão e tente novamente.",
    });
  } finally {
    loading.value = false;
  }
}

function askSuggested(question) {
  userInput.value = question;
  sendMessage();
}

function scrollToBottom() {
  if (!messagesContainer.value) return;

  // Use requestAnimationFrame para garantir que o DOM foi atualizado
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

// Watch messages to auto-scroll
watch(
  messages,
  () => {
    nextTick(() => {
      scrollToBottom();
    });
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
}

.chat-sidebar.closed {
  display: none;
}

.sidebar-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
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
  margin-bottom: 1rem;
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

/* Tips */
.tips-section {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 1rem;
  border: 1px solid var(--color-border);
}

.tips-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0;
  margin: 0;
}

.tips-list li {
  font-size: 0.75rem;
  color: var(--color-gray-500);
  padding-left: 1rem;
  position: relative;
  line-height: 1.4;
}

.tips-list li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--color-primary-500);
  font-weight: bold;
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
  max-height: 600px;
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
  height: fit;
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

.scroll-bottom:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-500);
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

/* Responsive */
@media (max-width: 768px) {
  .chat-wrapper {
    margin: 0.5rem;
  }

  .chat-public-header {
    padding: 0.625rem 1rem;
  }

  .btn-back-home span {
    display: none;
  }

  .header-actions-public {
    gap: 0.5rem;
  }

  .btn-ghost-login {
    padding: 0.5rem;
  }

  .btn-create-account {
    padding: 0.5rem 0.875rem;
    font-size: 0.8125rem;
  }

  .chat-page {
    grid-template-columns: 1fr;
    height: 100%;
    min-height: calc(100vh - 120px);
    margin: 0;
    border-radius: 0;
  }

  .chat-sidebar {
    display: none;
  }

  .toggle-sidebar {
    display: none;
  }

  .quick-start {
    flex-direction: column;
    align-items: center;
  }

  .quick-edital {
    width: 100%;
    max-width: none;
    justify-content: center;
  }
}
</style>
