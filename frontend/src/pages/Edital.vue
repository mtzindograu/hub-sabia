<template>
  <div class="edital-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner large"></div>
      <p>Carregando edital...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <h3>Erro ao carregar edital</h3>
      <p>{{ error }}</p>
      <router-link to="/" class="btn btn-primary">Voltar ao Início</router-link>
    </div>

    <!-- Edital Content -->
    <template v-else-if="edital">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <router-link to="/">Início</router-link>
        <span class="separator">/</span>
        <span class="current">{{ edital.titulo }}</span>
      </nav>

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
            <h1>{{ edital.titulo }}</h1>
            <div class="header-meta">
              <span class="badge badge-primary">{{ edital.ano }}</span>
              <span class="meta-text">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                {{ edital.ragStats?.totalChunks || 0 }} trechos indexados
              </span>
              <span class="meta-text">
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
          <router-link :to="`/chat/${edital.id}`" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Fazer Perguntas
          </router-link>
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
        <p class="objetivo-text">{{ edital.objetivo_principal }}</p>
      </section>

      <!-- Informações Principais Grid -->
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
          <span 
            v-for="(tag, index) in edital.palavras_chave" 
            :key="index"
            class="tag"
          >
            {{ tag }}
          </span>
        </div>
      </section>

      <!-- Prazos Importantes -->
      <section v-if="edital.prazos_importantes && edital.prazos_importantes.length > 0" class="edital-section">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Prazos Importantes
        </h2>
        <div class="deadlines-list">
          <div 
            v-for="(prazo, index) in edital.prazos_importantes" 
            :key="index"
            class="deadline-item"
          >
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
          <div 
            v-for="(etapa, index) in edital.etapas" 
            :key="index"
            class="stage-item"
          >
            <span class="stage-number">{{ index + 1 }}</span>
            <span class="stage-text">{{ etapa }}</span>
          </div>
        </div>
      </section>

      <!-- Documentos Necessários -->
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getEdital } from '../services/api.js'

const route = useRoute()

const edital = ref(null)
const loading = ref(true)
const error = ref('')

async function loadEdital() {
  try {
    loading.value = true
    error.value = ''

    const id = route.params.id
    console.log('[Edital] Carregando edital ID:', id)

    // Load edital details
    const response = await getEdital(id)
    console.log('[Edital] Resposta da API:', response)

    const data = response.data
    edital.value = normalizeEdital(data)

    console.log('[Edital] Edital carregado:', edital.value)
  } catch (err) {
    console.error('[Edital] Erro ao carregar:', err)
    error.value = err.message || 'Erro ao carregar edital'
  } finally {
    loading.value = false
  }
}

// Normaliza campos string → arrays
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
  // Se é string JSON, tenta parsear
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

// Watch for route changes
watch(() => route.params.id, () => {
  loadEdital()
})

onMounted(() => {
  loadEdital()
})
</script>

<style scoped>
.edital-page {
  max-width: 900px;
  margin: 0 auto;
}

/* Loading & Error States */
.loading-state,
.error-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner.large {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

.error-icon {
  width: 64px;
  height: 64px;
  color: #ef4444;
  margin-bottom: 1rem;
}

/* Breadcrumb */
.breadcrumb {
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.breadcrumb a {
  color: #16a34a;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.separator {
  margin: 0 0.5rem;
}

.current {
  color: #334155;
}

/* Header */
.edital-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 2rem;
}

.header-main {
  display: flex;
  gap: 1.25rem;
}

.header-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.header-info h1 {
  font-size: 1.75rem;
  margin-bottom: 0.75rem;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-text {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #64748b;
  font-size: 0.875rem;
}

.meta-text svg {
  width: 16px;
  height: 16px;
}

/* Sections */
.edital-section {
  margin-bottom: 2.5rem;
}

.edital-section h2 {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  color: #0f172a;
}

.section-icon {
  width: 20px;
  height: 20px;
  color: #16a34a;
}

/* Highlight Section */
.highlight-section {
  background: #16a34a15;
  border: 1px solid #16a34a30;
  border-radius: 16px;
  padding: 1.5rem;
}

.objetivo-text {
  color: #475569;
  line-height: 1.7;
  font-size: 1rem;
  white-space: pre-line;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  gap: 1rem;
}

.info-icon {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon svg {
  width: 20px;
  height: 20px;
  color: #16a34a;
}

.info-content h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.375rem;
}

.info-content p {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
  white-space: pre-line;
}

.contatos-text {
  font-size: 0.875rem;
  color: #64748b;
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
  background: #16a34a15;
  color: #16a34a;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Deadlines */
.deadlines-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.deadline-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 10px;
  padding: 1rem;
}

.deadline-marker {
  width: 8px;
  height: 8px;
  background: #f59e0b;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

.deadline-content {
  font-size: 0.9375rem;
  color: #92400e;
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
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  border-radius: 10px;
  padding: 1rem;
}

.check-icon {
  width: 18px;
  height: 18px;
  color: #16a34a;
  flex-shrink: 0;
  margin-top: 2px;
}

.requirement-item span {
  font-size: 0.9375rem;
  color: #166534;
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
}

.stage-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.stage-text {
  font-size: 0.9375rem;
  color: #475569;
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
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 1rem;
}

.doc-icon {
  width: 18px;
  height: 18px;
  color: #b45309;
  flex-shrink: 0;
  margin-top: 2px;
}

.document-item span {
  font-size: 0.9375rem;
  color: #92400e;
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
  }

  .header-actions .btn {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
