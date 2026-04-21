<template>
  <div class="edital-quickview-overlay" @click.self="$emit('close')">
    <div class="edital-quickview">
      <!-- Header -->
      <div class="quickview-header">
        <div class="header-left">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="header-info">
            <h2>{{ edital.titulo }}</h2>
            <div class="header-meta">
              <span class="badge">{{ edital.ano }}</span>
              <span class="meta-text">{{ edital.chunkCount || 0 }} trechos indexados</span>
            </div>
          </div>
        </div>
        <button class="btn-close" @click="$emit('close')" title="Fechar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="quickview-content">
        <!-- Objetivo Principal -->
        <section v-if="edital.objetivo_principal" class="content-section highlight">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Objetivo Principal
          </h3>
          <p class="section-text">{{ edital.objetivo_principal }}</p>
        </section>

        <!-- Informações Grid -->
        <div class="info-grid">
          <div v-if="edital.publico_alvo" class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="info-icon">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
            <div class="info-content">
              <h4>Público-alvo</h4>
              <p>{{ edital.publico_alvo }}</p>
            </div>
          </div>

          <div v-if="edital.vagas" class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="info-icon">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <div class="info-content">
              <h4>Vagas</h4>
              <p>{{ edital.vagas }}</p>
            </div>
          </div>

          <div v-if="edital.inscricoes_periodo" class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="info-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <div class="info-content">
              <h4>Inscrições</h4>
              <p>{{ edital.inscricoes_periodo }}</p>
            </div>
          </div>
        </div>

        <!-- Palavras-chave -->
        <section v-if="edital.palavras_chave && edital.palavras_chave.length > 0" class="content-section">
          <h3>Palavras-chave</h3>
          <div class="tags-container">
            <span v-for="(tag, index) in edital.palavras_chave" :key="index" class="tag">
              {{ tag }}
            </span>
          </div>
        </section>

        <!-- Prazos -->
        <section v-if="edital.prazos_importantes && edital.prazos_importantes.length > 0" class="content-section deadlines">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Prazos Importantes
          </h3>
          <div class="deadline-list">
            <div v-for="(prazo, index) in edital.prazos_importantes" :key="index" class="deadline-item">
              <div class="deadline-marker"></div>
              <span class="deadline-text">{{ prazo }}</span>
            </div>
          </div>
        </section>

        <!-- Requisitos -->
        <section v-if="edital.requisitos && edital.requisitos.length > 0" class="content-section">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Requisitos
          </h3>
          <ul class="requirements-list">
            <li v-for="(requisito, index) in edital.requisitos" :key="index" class="requirement-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="check-icon">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{{ requisito }}</span>
            </li>
          </ul>
        </section>
      </div>

      <!-- Footer Actions -->
      <div class="quickview-footer">
        <button class="btn-action btn-secondary" @click="$emit('close')">
          Fechar
        </button>
        <button class="btn-action btn-primary" @click="$emit('chat')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Fazer Perguntas
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  edital: {
    type: Object,
    required: true
  }
})

defineEmits(['close', 'chat'])
</script>

<style scoped>
.edital-quickview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.edital-quickview {
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  max-width: 800px;
  width: 100%;
  max-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header */
.quickview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-primary);
}

.header-icon svg {
  width: 24px;
  height: 24px;
  color: var(--color-text-inverse);
}

.header-info h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.badge {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
}

.meta-text {
  font-size: 0.8125rem;
  color: var(--color-gray-500);
}

.btn-close {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-gray-500);
  transition: all var(--transition-fast);
}

.btn-close:hover {
  background: var(--color-surface-2);
  color: var(--color-gray-700);
}

.btn-close svg {
  width: 20px;
  height: 20px;
}

/* Content */
.quickview-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

.content-section {
  margin-bottom: 1.5rem;
}

.content-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  width: 18px;
  height: 18px;
  color: var(--color-primary-600);
}

.section-text {
  color: var(--color-gray-600);
  line-height: 1.7;
  font-size: 0.9375rem;
  white-space: pre-line;
  margin: 0;
}

/* Highlight Section */
.content-section.highlight {
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  background: var(--color-surface-2);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
}

.info-icon {
  width: 36px;
  height: 36px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon svg {
  width: 18px;
  height: 18px;
  color: var(--color-primary-600);
}

.info-content h4 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin: 0 0 0.375rem 0;
}

.info-content p {
  font-size: 0.8125rem;
  color: var(--color-gray-600);
  line-height: 1.5;
  white-space: pre-line;
  margin: 0;
}

/* Tags */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid var(--color-primary-100);
}

/* Deadlines */
.content-section.deadlines {
  background: var(--color-warning-50);
  border: 1px solid #fef3c7;
  border-radius: var(--radius-lg);
  padding: 1.25rem;
}

.deadline-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.deadline-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.deadline-marker {
  width: 8px;
  height: 8px;
  background: var(--color-warning-500);
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

.deadline-text {
  font-size: 0.875rem;
  color: var(--color-warning-700);
  line-height: 1.5;
  white-space: pre-line;
}

/* Requirements */
.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.requirement-item {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: var(--color-primary-600);
  flex-shrink: 0;
  margin-top: 2px;
}

.requirement-item span {
  font-size: 0.875rem;
  color: var(--color-primary-800);
  line-height: 1.5;
  white-space: pre-line;
}

/* Footer */
.quickview-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.25rem 2rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-2);
  border-radius: 0 0 var(--radius-2xl) var(--radius-2xl);
}

.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-action svg {
  width: 18px;
  height: 18px;
}

.btn-primary {
  background: var(--color-primary-600);
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--color-primary-700);
  box-shadow: var(--shadow-primary);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-gray-700);
  border: 1.5px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-gray-100);
  border-color: var(--color-gray-300);
}

/* Responsive */
@media (max-width: 768px) {
  .edital-quickview-overlay {
    padding: 1rem;
  }

  .quickview-header,
  .quickview-content,
  .quickview-footer {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .quickview-footer {
    flex-direction: column;
  }

  .btn-action {
    flex: 1;
  }
}
</style>
