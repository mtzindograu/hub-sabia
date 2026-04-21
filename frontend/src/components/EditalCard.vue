<template>
  <div class="edital-card" @click="$emit('view')">
    <!-- Header do Card -->
    <div class="card-header">
      <div class="header-left">
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="header-info">
          <span class="card-year">{{ edital.ano }}</span>
          <span v-if="edital.chunkCount" class="chunk-count">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            {{ edital.chunkCount }} trechos
          </span>
        </div>
      </div>
    </div>

    <!-- Título -->
    <h3 class="card-title">{{ edital.titulo }}</h3>

    <!-- Descrição/Objetivo -->
    <p v-if="truncatedDescription" class="card-description">
      {{ truncatedDescription }}
    </p>

    <!-- Palavras-chave -->
    <div v-if="visibleTags.visible.length > 0" class="card-tags">
      <span
        v-for="(tag, index) in visibleTags.visible"
        :key="index"
        class="tag"
      >
        {{ tag }}
      </span>
      <span
        v-if="visibleTags.hasMore"
        class="tag more"
      >
        +{{ visibleTags.moreCount }}
      </span>
    </div>

    <!-- Informações adicionais -->
    <div class="card-meta">
      <div v-if="truncatedPublico" class="meta-item" :title="edital.publico_alvo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
        <span>{{ truncatedPublico }}</span>
      </div>
    </div>

    <!-- Ações (botões) -->
    <div class="card-actions" @click.stop>
      <button class="btn-action btn-chat" @click="$emit('chat')" title="Fazer perguntas sobre este edital">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Perguntar</span>
      </button>
      
      <button class="btn-action btn-details" @click="$emit('view')" title="Ver detalhes completos">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <span>Detalhes</span>
      </button>

      <button
        v-if="isAdmin && showFullActions"
        class="btn-action btn-delete"
        @click="handleDelete"
        title="Excluir edital"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        <span>Excluir</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  edital: {
    type: Object,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  showFullActions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['view', 'chat', 'deleted'])

// Pré-computar valores para evitar re-cálculo em cada render
const truncatedTitle = computed(() => {
  return truncateText(props.edital.titulo, 80)
})

const truncatedDescription = computed(() => {
  const text = props.edital.objetivo_principal || props.edital.descricao
  return text ? truncateText(text, 150) : ''
})

const truncatedPublico = computed(() => {
  return props.edital.publico_alvo ? truncateText(props.edital.publico_alvo, 35) : ''
})

const visibleTags = computed(() => {
  const tags = props.edital.palavras_chave || []
  return {
    visible: tags.slice(0, 4),
    hasMore: tags.length > 4,
    moreCount: tags.length - 4
  }
})

function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

async function handleDelete() {
  const confirmed = confirm(`Tem certeza que deseja excluir este edital?\n\n"${props.edital.titulo}"\n\nEsta ação não pode ser desfeita.`)

  if (!confirmed) return

  try {
    const { deleteEdital } = await import('../services/api.js')
    await deleteEdital(props.edital.id)
    emit('deleted', props.edital.id)
  } catch (error) {
    alert('Erro ao excluir edital: ' + (error.message || 'Tente novamente'))
  }
}
</script>

<style scoped>
.edital-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease;
  border: 1.5px solid var(--color-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  will-change: transform;
}

.edital-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: var(--color-primary-300);
}

.edital-card:active {
  transform: translateY(0);
  transition-duration: 50ms;
}

/* Header do Card */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex: 1;
  min-width: 0;
}

.card-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon svg {
  width: 22px;
  height: 22px;
  color: var(--color-text-inverse);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
}

.card-year {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  align-self: flex-start;
}

.chunk-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  color: var(--color-gray-500);
}

.chunk-count svg {
  width: 12px;
  height: 12px;
}

/* Título */
.card-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-gray-900);
  line-height: 1.4;
  margin: 0;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

/* Descrição */
.card-description {
  color: var(--color-gray-600);
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Tags */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.tag {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-sm);
  font-size: 0.6875rem;
  font-weight: 600;
  border: 1px solid var(--color-primary-100);
}

.tag.more {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
  border-color: var(--color-border);
}

/* Meta informações */
.card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: var(--color-gray-600);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.meta-item svg {
  width: 16px;
  height: 16px;
  color: var(--color-primary-600);
  flex-shrink: 0;
  margin-top: 1px;
}

/* Ações (botões) */
.card-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem 0.875rem;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex: 1;
  white-space: nowrap;
}

.btn-action svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.btn-action span {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Botão Perguntar (primário) */
.btn-chat {
  background: var(--color-primary-600);
  color: var(--color-text-inverse);
}

.btn-chat:hover {
  background: var(--color-primary-700);
}

/* Botão Detalhes (secundário) */
.btn-details {
  background: var(--color-surface-2);
  color: var(--color-gray-700);
  border: 1.5px solid var(--color-border);
}

.btn-details:hover {
  background: var(--color-gray-100);
  border-color: var(--color-primary-400);
  color: var(--color-primary-700);
}

/* Botão Excluir (danger) */
.btn-delete {
  background: var(--color-danger-50);
  color: var(--color-danger-600);
  border: 1.5px solid var(--color-danger-100, #fecaca);
}

.btn-delete:hover {
  background: var(--color-danger-500);
  color: var(--color-text-inverse);
  border-color: var(--color-danger-500);
}

/* Responsivo */
@media (max-width: 640px) {
  .edital-card {
    padding: 1.25rem;
  }

  .card-actions {
    flex-wrap: wrap;
  }

  .btn-action {
    flex: 1 1 calc(50% - 0.25rem);
    min-width: 0;
  }

  .btn-action span {
    display: none;
  }

  .btn-action {
    padding: 0.625rem;
  }

  .btn-action svg {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 480px) {
  .edital-card {
    padding: 1rem;
  }

  .card-title {
    font-size: 1rem;
  }

  .card-description {
    font-size: 0.8125rem;
    -webkit-line-clamp: 2;
  }

  .card-icon {
    width: 42px;
    height: 42px;
  }

  .card-icon svg {
    width: 20px;
    height: 20px;
  }
}
</style>
