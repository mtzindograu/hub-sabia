<template>
  <DashboardLayout page-title="Chat Alunos">
    <div class="chat-alunos-page">
      <!-- Info bar -->
      <div class="info-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span>Chat entre alunos — troque experiências e dúvidas com outros estudantes</span>
        <span class="badge-new">Em breve</span>
      </div>

      <!-- Messages area -->
      <div class="messages-area" ref="messagesContainer">
        <!-- Welcome message -->
        <div class="welcome-message">
          <div class="welcome-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>Chat entre Alunos</h3>
          <p>Em breve você poderá conversar com outros estudantes aqui. Enquanto isso, use o <router-link to="/chat">Chat IA</router-link> para tirar dúvidas sobre editais.</p>
        </div>

        <!-- Mock messages (demo) -->
        <div class="mock-messages">
          <div class="mock-label">Exemplo de como será:</div>
          <div v-for="(msg, i) in mockMessages" :key="i" class="message-row" :class="msg.type">
            <div class="message-avatar">{{ msg.avatar }}</div>
            <div class="message-bubble" :class="msg.type">
              <div class="msg-sender">{{ msg.sender }} · {{ msg.time }}</div>
              <div class="msg-text">{{ msg.text }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input (disabled for now) -->
      <div class="input-area">
        <div class="input-wrapper disabled">
          <input
            type="text"
            placeholder="Chat disponível em breve..."
            disabled
          />
          <button class="send-btn" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'

const messagesContainer = ref(null)

const mockMessages = [
  {
    type: 'other',
    avatar: 'MA',
    sender: 'Maria Silva',
    time: '10:30',
    text: 'Alguém sabe qual o prazo de inscrição para o edital de bolsas?',
  },
  {
    type: 'other',
    avatar: 'JP',
    sender: 'João Pereira',
    time: '10:35',
    text: 'Oi Maria! Pelo que eu vi, as inscrições vão até o dia 27 de fevereiro. Mas confirma no edital!',
  },
  {
    type: 'other',
    avatar: 'AL',
    sender: 'Ana Lima',
    time: '10:40',
    text: 'Eu me inscrevi semana passada! Os documentos necessários são basicamente comprovante de matrícula e RG.',
  },
]

onMounted(() => {
  // Future: load real messages
})
</script>

<style scoped>
.chat-alunos-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  max-height: calc(100vh - 64px);
}

.info-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: #f0fdf4;
  border-bottom: 1px solid #dcfce7;
  font-size: 0.8125rem;
  color: #166534;
}

.info-bar svg {
  color: #16a34a;
  flex-shrink: 0;
}

.badge-new {
  background: #16a34a;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  margin-left: auto;
}

/* Messages */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f9fafb;
}

.welcome-message {
  text-align: center;
  padding: 2.5rem 1.5rem;
  margin-bottom: 2rem;
}

.welcome-icon {
  width: 56px;
  height: 56px;
  background: #f0fdf4;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: #16a34a;
}

.welcome-message h3 {
  font-size: 1.25rem;
  color: #111827;
  margin-bottom: 0.5rem;
}

.welcome-message p {
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 400px;
  margin: 0 auto;
}

.welcome-message a {
  color: #16a34a;
  font-weight: 500;
}

.mock-label {
  text-align: center;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Message rows */
.message-row {
  display: flex;
  align-items: flex-end;
  gap: 0.625rem;
  margin-bottom: 1rem;
}

.message-row.other {
  justify-content: flex-start;
}

.message-avatar {
  width: 32px;
  height: 32px;
  background: #16a34a;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 75%;
  padding: 0.75rem 1rem;
  border-radius: 14px 14px 14px 4px;
}

.message-bubble.other {
  background: white;
  border: 1px solid #e5e7eb;
}

.msg-sender {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #16a34a;
  margin-bottom: 0.25rem;
}

.msg-sender::after {
  content: '';
  font-weight: 400;
  color: #9ca3af;
}

.msg-text {
  font-size: 0.8125rem;
  color: #374151;
  line-height: 1.4;
}

/* Input */
.input-area {
  padding: 1rem 1.25rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
}

.input-wrapper.disabled {
  opacity: 0.6;
}

.input-wrapper input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: #9ca3af;
  outline: none;
  padding: 0.375rem 0;
}

.send-btn {
  background: #16a34a;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  background: #15803d;
}

.send-btn svg {
  width: 18px;
  height: 18px;
}
</style>
