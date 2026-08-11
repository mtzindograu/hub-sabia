<template>
  <DashboardLayout :page-title="edital?.titulo || 'Edital'">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando edital...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <h3>Erro ao carregar edital</h3>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="goBack">Voltar para lista</button>
    </div>

    <!-- Content -->
    <template v-else-if="edital">
      <!-- Back button -->
      <button class="btn-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Voltar para lista
      </button>

      <!-- Header -->
      <header class="edital-header">
        <div class="header-main">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="header-info">
            <div class="title-row">
              <h1>{{ edital.titulo }}</h1>
              <span class="badge-year">{{ edital.ano }}</span>
            </div>
            <div class="header-meta">
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                {{ edital.chunkCount || 0 }} trechos indexados
              </span>
              <span class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Adicionado em {{ formatDate(edital.createdAt) }}
              </span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" @click="goToChat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Fazer Perguntas
          </button>
          <button v-if="isAdmin" class="btn btn-danger" @click="handleDelete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Excluir
          </button>
        </div>
      </header>

      <!-- Objetivo Principal -->
      <section v-if="edital.objetivo_principal" class="edital-section highlight-section">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Objetivo Principal
        </h2>
        <p class="section-text">{{ edital.objetivo_principal }}</p>
      </section>

      <!-- Informações Grid -->
      <section class="edital-section">
        <h2>Informações do Edital</h2>
        <div class="info-grid">
          <div v-if="edital.publico_alvo" class="info-card">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="info-content">
              <h3>Público-alvo</h3>
              <p>{{ edital.publico_alvo }}</p>
            </div>
          </div>

          <div v-if="edital.vagas" class="info-card">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            </div>
            <div class="info-content">
              <h3>Vagas</h3>
              <p>{{ edital.vagas }}</p>
            </div>
          </div>

          <div v-if="edital.inscricoes_periodo" class="info-card">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div class="info-content">
              <h3>Inscrições</h3>
              <p>{{ edital.inscricoes_periodo }}</p>
            </div>
          </div>

          <div v-if="edital.contatos" class="info-card">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div class="info-content">
              <h3>Contatos</h3>
              <p class="contatos-text">{{ edital.contatos }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Palavras-chave -->
      <section v-if="edital.palavras_chave && edital.palavras_chave.length > 0" class="edital-section">
        <h2>Palavras-chave</h2>
        <div class="tags-container">
          <span v-for="(tag, index) in edital.palavras_chave" :key="index" class="tag">
            {{ tag }}
          </span>
        </div>
      </section>

      <!-- Prazos -->
      <section v-if="edital.prazos_importantes && edital.prazos_importantes.length > 0" class="edital-section deadlines-section">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Prazos Importantes
        </h2>
        <div class="deadlines-list">
          <div v-for="(prazo, index) in edital.prazos_importantes" :key="index" class="deadline-item">
            <div class="deadline-marker"></div>
            <div class="deadline-content">{{ prazo }}</div>
          </div>
        </div>
      </section>

      <!-- Requisitos -->
      <section v-if="edital.requisitos && edital.requisitos.length > 0" class="edital-section">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Requisitos
        </h2>
        <ul class="requirements-list">
          <li v-for="(requisito, index) in edital.requisitos" :key="index" class="requirement-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="check-icon">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{{ requisito }}</span>
          </li>
        </ul>
      </section>

      <!-- Etapas -->
      <section v-if="edital.etapas && edital.etapas.length > 0" class="edital-section">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          Etapas do Processo
        </h2>
        <div class="stages-list">
          <div v-for="(etapa, index) in edital.etapas" :key="index" class="stage-item">
            <span class="stage-number">{{ index + 1 }}</span>
            <span class="stage-text">{{ etapa }}</span>
          </div>
        </div>
      </section>

      <!-- Documentos -->
      <section v-if="edital.documentos_necessarios && edital.documentos_necessarios.length > 0" class="edital-section">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Documentos Necessários
        </h2>
        <ul class="documents-list">
          <li v-for="(doc, index) in edital.documentos_necessarios" :key="index" class="document-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="doc-icon">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>{{ doc }}</span>
          </li>
        </ul>
      </section>
    </template>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import { getEdital } from '../../services/api.js'
import { success, error as showError } from '../../utils/toast.js'

const route = useRoute()
const router = useRouter()

const edital = ref(null)
const loading = ref(true)
const error = ref('')

// Verificar se é admin
const isAdmin = computed(() => {
  const user = localStorage.getItem('user')
  if (!user) return false
  try {
    return JSON.parse(user).role === 'admin'
  } catch {
    return false
  }
})

async function loadEdital() {
  try {
    loading.value = true
    error.value = ''

    const id = route.params.id
    const response = await getEdital(id)
    edital.value = normalizeEdital(response.data)
  } catch (err) {
    console.error('Erro ao carregar edital:', err)
    error.value = 'Não foi possível carregar este edital. Ele pode ter sido removido ou não existe.'
    showError('Erro ao carregar edital.')
  } finally {
    loading.value = false
  }
}

function normalizeEdital(data) {
  return {
    ...data,
    requisitos: normalizeStringArray(data.requisitos),
    etapas: normalizeStringArray(data.etapas),
    documentos_necessarios: normalizeStringArray(data.documentos_necessarios),
    prazos_importantes: normalizeStringArray(data.prazos_importantes),
    palavras_chave: Array.isArray(data.palavras_chave) ? data.palavras_chave : [],
    contatos: formatContatos(data.contatos),
  }
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) return value.filter(item => item.trim())
  if (typeof value === 'string' && value.trim()) {
    return value.split('\n').filter(item => item.trim())
  }
  return []
}

function formatContatos(value) {
  if (!value) return ''
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join('\n')
    }
    return String(value)
  } catch {
    return value
  }
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function goBack() {
  router.push(isAdmin.value ? '/admin/editais' : '/dashboard/editais')
}

function goToChat() {
  router.push(`/chat/${edital.value.id}`)
}

async function handleDelete() {
  const confirmed = confirm(`Tem certeza que deseja excluir este edital?\n\n"${edital.value.titulo}"\n\nEsta ação não pode ser desfeita.`)
  
  if (!confirmed) return
  
  try {
    const { deleteEdital } = await import('../../services/api.js')
    await deleteEdital(edital.value.id)
    success('Edital excluído com sucesso!')
    router.push(isAdmin.value ? '/admin/editais' : '/dashboard/editais')
  } catch (error) {
    showError('Erro ao excluir edital: ' + (error.message || 'Tente novamente'))
  }
}

watch(() => route.params.id, () => {
  loadEdital()
})

onMounted(() => {
  loadEdital()
})
</script>

<style scoped>
/* Loading & Error */
.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-gray-500);
}

.error-icon {
  width: 64px;
  height: 64px;
  color: var(--color-danger-500);
  margin-bottom: 1rem;
}

.error-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
}

.error-state p {
  margin-bottom: 1.5rem;
}

/* Back Button */
.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-600);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 1.5rem;
}

.btn-back:hover {
  background: var(--color-surface-2);
  color: var(--color-primary-600);
  border-color: var(--color-primary-400);
}

.btn-back svg {
  width: 18px;
  height: 18px;
}

/* Header */
.edital-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 2rem;
}

.header-main {
  display: flex;
  gap: 1.25rem;
  flex: 1;
  min-width: 0;
}

.header-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-primary);
}

.header-icon svg {
  width: 28px;
  height: 28px;
  color: var(--color-text-inverse);
}

.header-info {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.title-row h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0;
  line-height: 1.3;
}

.badge-year {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.meta-item svg {
  width: 16px;
  height: 16px;
}

/* Sections */
.edital-section {
  margin-bottom: 2rem;
}

.edital-section h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  width: 20px;
  height: 20px;
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
.highlight-section {
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.info-card {
  background: var(--color-surface-2);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
}

.info-icon {
  width: 44px;
  height: 44px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.info-icon svg {
  width: 22px;
  height: 22px;
  color: var(--color-primary-600);
}

.info-content h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin: 0 0 0.375rem 0;
}

.info-content p {
  font-size: 0.875rem;
  color: var(--color-gray-600);
  line-height: 1.5;
  white-space: pre-line;
  margin: 0;
}

.contatos-text {
  font-size: 0.875rem;
  color: var(--color-gray-600);
  line-height: 1.6;
  white-space: pre-line;
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
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--color-primary-100);
}

/* Deadlines */
.deadlines-section {
  background: var(--color-warning-50);
  border: 1px solid var(--color-warning-100, rgba(245, 158, 11, 0.2));
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}

.deadlines-list {
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

.deadline-content {
  font-size: 0.9375rem;
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
  gap: 0.75rem;
}

.requirement-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-md);
  padding: 0.875rem 1rem;
}

.check-icon {
  width: 18px;
  height: 18px;
  color: var(--color-primary-600);
  flex-shrink: 0;
  margin-top: 2px;
}

.requirement-item span {
  font-size: 0.9375rem;
  color: var(--color-primary-800);
  line-height: 1.5;
  white-space: pre-line;
}

/* Stages */
.stages-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.stage-number {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  color: var(--color-text-inverse);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9375rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-primary);
}

.stage-text {
  font-size: 0.9375rem;
  color: var(--color-gray-700);
  line-height: 1.5;
  white-space: pre-line;
}

/* Documents */
.documents-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.document-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-md);
  padding: 0.875rem 1rem;
}

.doc-icon {
  width: 18px;
  height: 18px;
  color: var(--color-primary-600);
  flex-shrink: 0;
  margin-top: 2px;
}

.document-item span {
  font-size: 0.9375rem;
  color: var(--color-primary-800);
  line-height: 1.5;
  white-space: pre-line;
}

/* Responsive */
@media (max-width: 768px) {
  .edital-header {
    flex-direction: column;
    gap: 1.5rem;
  }

  .header-actions {
    width: 100%;
    display: flex;
    gap: 0.75rem;
  }

  .header-actions .btn {
    flex: 1;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .title-row h1 {
    font-size: 1.25rem;
  }
}

.btn-danger {
  background: var(--color-danger-500);
  color: var(--color-text-inverse);
}

.btn-danger:hover {
  background: var(--color-danger-600);
  box-shadow: var(--shadow-danger);
}
</style>
