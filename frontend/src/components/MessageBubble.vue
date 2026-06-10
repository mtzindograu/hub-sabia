<template>
  <div class="message-bubble" :class="[message.type]">
    <!-- User Message -->
    <div v-if="message.type === 'user'" class="user-message">
      <div class="message-content">
        <p>{{ message.content }}</p>
      </div>
      <div class="message-avatar user">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    </div>
    
    <!-- Assistant Message -->
    <div v-else-if="message.type === 'assistant'" class="assistant-message">
      <div class="message-avatar assistant">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A1.5 1.5 0 1 0 9 14.5 1.5 1.5 0 0 0 7.5 13m9 0a1.5 1.5 0 1 0 1.5 1.5 1.5 1.5 0 0 0-1.5-1.5M12 17.5a1.5 1.5 0 1 0 1.5-1.5 1.5 1.5 0 0 0-1.5 1.5"/>
        </svg>
      </div>
      <div class="message-body">
        <div class="message-content">
          <div class="formatted-text" v-html="formatText(message.content)"></div>
        </div>
        
        <!-- Sources -->
        <div v-if="showSources && message.sources && message.sources.length > 0" class="sources-section">
          <button class="sources-toggle" @click="showSourcesList = !showSourcesList">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {{ message.sources.length }} fonte(s) utilizada(s)
            <svg class="chevron" :class="{ rotated: showSourcesList }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          
          <div v-if="showSourcesList" class="sources-list">
            <div v-for="source in message.sources" :key="source.id" class="source-item">
              <div class="source-header">
                <span class="source-title">{{ source.editalTitulo }}</span>
                <span class="source-relevance" :class="source.relevance.toLowerCase()">
                  {{ source.relevance }} relevância
                </span>
              </div>
              <p class="source-excerpt">{{ source.excerpt }}</p>
            </div>
          </div>
        </div>
        
        <!-- Metadata -->
        <div v-if="message.metadata || message.id" class="message-meta">
          <div class="meta-info">
            <span v-if="message.metadata?.provider" class="provider-badge" :class="message.metadata.provider">
              {{ formatProvider(message.metadata.provider) }}
            </span>
            <span v-if="message.metadata?.processingTime">
              Processado em {{ message.metadata.processingTime }}ms
            </span>
            <span v-if="message.metadata?.chunksUsed">
              {{ message.metadata.chunksUsed }} trechos analisados
            </span>
          </div>
          
          <!-- Feedback -->
          <div v-if="message.type === 'assistant' && message.id" class="feedback-actions">
            <button 
              class="feedback-btn" 
              :class="{ active: feedback === 1 }"
              @click="handleFeedback(1)"
              :disabled="feedback !== null"
              title="Resposta útil"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
            </button>
            <button 
              class="feedback-btn" 
              :class="{ active: feedback === -1 }"
              @click="handleFeedback(-1)"
              :disabled="feedback !== null"
              title="Resposta não ajudou"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Error Message -->
    <div v-else-if="message.type === 'error'" class="error-message">
      <div class="message-avatar error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <div class="message-content error">
        <p>{{ message.content }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { submitFeedback } from '../services/api'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  showSources: {
    type: Boolean,
    default: false
  }
})

const showSourcesList = ref(false)
const feedback = ref(props.message.feedback || null)

async function handleFeedback(value) {
  if (!props.message.id || feedback.value !== null) return
  
  try {
    feedback.value = value
    await submitFeedback(props.message.id, value)
  } catch (error) {
    console.error('Failed to submit feedback:', error)
    feedback.value = null // Reset on error
  }
}

function formatText(text) {
  if (!text) return ''
  
  // Convert markdown-like formatting to HTML
  let formatted = text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Lists
    .replace(/^- (.*?)(?=<br>|$)/gm, '<li>$1</li>')
  
  // Wrap consecutive list items in ul
  formatted = formatted.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>')
  
  return formatted
}

function formatProvider(provider) {
  const providers = {
    'gemini-user': 'Gemini (Minha Chave)',
    'gemini-system': 'Gemini (Sistema)',
  }
  return providers[provider] || provider
}
</script>

<style scoped>
.message-bubble {
  margin-bottom: 1.5rem;
}

/* User Message */
.user-message {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.user-message .message-content {
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  color: var(--color-surface);
  border-radius: var(--radius-xl);
  border-top-right-radius: var(--radius-sm);
  padding: 0.875rem 1.25rem;
  max-width: 70%;
}

.user-message .message-content p {
  margin: 0;
  line-height: 1.5;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-avatar svg {
  width: 18px;
  height: 18px;
}

.message-avatar.user {
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
}

/* Assistant Message */
.assistant-message {
  display: flex;
  gap: 0.75rem;
}

.message-avatar.assistant {
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  color: var(--color-text-inverse);
}

.message-body {
  flex: 1;
  max-width: calc(100% - 50px);
}

.assistant-message .message-content {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  border-top-left-radius: var(--radius-sm);
  padding: 1rem 1.25rem;
}

.formatted-text {
  line-height: 1.7;
  color: var(--color-text);
}

.formatted-text :deep(strong) {
  font-weight: 600;
  color: var(--color-text);
}

.formatted-text :deep(ul) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.formatted-text :deep(li) {
  margin-bottom: 0.25rem;
}

/* Sources */
.sources-section {
  margin-top: 0.75rem;
}

.sources-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.sources-toggle:hover {
  background: var(--color-surface-2);
}

.sources-toggle svg {
  width: 16px;
  height: 16px;
}

.chevron {
  margin-left: auto;
  transition: transform 0.2s;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.sources-list {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.source-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.source-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
}

.source-relevance {
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.source-relevance.alta {
  background: var(--color-primary-100);
  color: var(--color-primary-600);
}

.source-relevance.média {
  background: #fef3c7;
  color: var(--color-warning-600);
}

.source-relevance.baixa {
  background: #fee2e2;
  color: var(--color-danger-600);
}

.source-excerpt {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* Message Meta */
.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.6875rem;
  color: var(--color-text-muted);
}

.meta-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.provider-badge {
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: var(--color-surface-2);
  color: var(--color-gray-600);
}

.provider-badge.gemini-user {
  background: var(--color-primary-100);
  color: var(--color-primary-700);
}

.dark .provider-badge.gemini-user {
  background: rgba(22, 163, 74, 0.2);
  color: var(--color-primary-400);
}

.feedback-actions {
  display: flex;
  gap: 0.5rem;
}

.feedback-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: var(--radius-sm);
}

.feedback-btn:hover:not(:disabled) {
  background: var(--color-surface-2);
  color: var(--color-primary-600);
}

.feedback-btn.active {
  color: var(--color-primary-600);
  background: var(--color-primary-50);
}

.feedback-btn:disabled {
  cursor: default;
  opacity: 0.7;
}

.feedback-btn svg {
  width: 14px;
  height: 14px;
}

/* Error Message */
.error-message {
  display: flex;
  gap: 0.75rem;
}

.message-avatar.error {
  background: var(--color-danger-50);
  color: var(--color-danger-600);
}

.error-message .message-content {
  background: var(--color-danger-50);
  border: 1px solid var(--color-danger-500);
  border-radius: var(--radius-xl);
  border-top-left-radius: var(--radius-sm);
  padding: 0.875rem 1.25rem;
  max-width: 70%;
}

.error-message .message-content p {
  margin: 0;
  color: var(--color-danger-700);
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 640px) {
  .user-message .message-content,
  .assistant-message .message-content {
    max-width: 85%;
  }
}
</style>