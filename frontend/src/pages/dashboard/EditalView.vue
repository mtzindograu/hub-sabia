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
.loading-state, .error-state { min-height: 360px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1.5rem; color: var(--color-text-muted); text-align: center; }
.loading-state p, .error-state p { margin: 0.8rem 0 1.25rem; font-size: 0.85rem; }
.error-icon { width: 50px; height: 50px; margin-bottom: 0.4rem; color: var(--color-danger-500); }
.error-state h3 { margin: 0; color: var(--color-text); font-family: var(--font-display); font-size: 1.4rem; font-weight: 600; }
.btn-back { display: inline-flex; align-items: center; gap: 0.45rem; margin-bottom: 1.75rem; padding: 0.55rem 0.8rem; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text-secondary); cursor: pointer; font: inherit; font-size: 0.8rem; font-weight: 700; transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast); }
.btn-back:hover { border-color: var(--color-primary-300); background: var(--color-primary-50); color: var(--color-primary-700); transform: translateX(-2px); }
.btn-back svg { width: 17px; height: 17px; }
.edital-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 2rem; margin-bottom: 2.5rem; padding-bottom: 1.75rem; border-bottom: 1px solid var(--color-border); }
.header-main { display: flex; gap: 1rem; min-width: 0; flex: 1; }
.header-icon { width: 52px; height: 52px; display: grid; place-items: center; flex-shrink: 0; border-radius: var(--radius-xl); background: var(--color-primary-600); color: var(--color-text-inverse); }
.header-icon svg { width: 26px; height: 26px; }
.header-info { min-width: 0; flex: 1; }
.title-row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.65rem; margin-bottom: 0.65rem; }
.title-row h1 { margin: 0; color: var(--color-text); font-family: var(--font-display); font-size: clamp(1.7rem, 3.5vw, 2.5rem); font-weight: 600; letter-spacing: -0.04em; line-height: 1.05; }
.badge-year { padding: 0.25rem 0.55rem; border-radius: var(--radius-sm); background: var(--color-primary-50); color: var(--color-primary-700); font-size: 0.72rem; font-weight: 800; }
.header-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 0.8rem 1.25rem; }
.meta-item { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--color-text-muted); font-size: 0.76rem; }
.meta-item svg { width: 15px; height: 15px; }
.header-actions { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 0.6rem; }
.header-actions .btn { min-height: 40px; }
.header-actions .btn-danger { background: var(--color-danger-500); color: var(--color-text-inverse); }
.header-actions .btn-danger:hover { background: var(--color-danger-600); }

.edital-section { margin-bottom: 2.25rem; }
.edital-section h2 { display: flex; align-items: center; gap: 0.45rem; margin: 0 0 0.9rem; color: var(--color-text); font-family: var(--font-display); font-size: 1.35rem; font-weight: 600; letter-spacing: -0.02em; }
.section-icon { width: 19px; height: 19px; color: var(--color-primary-600); }
.section-text { margin: 0; color: var(--color-text-secondary); font-size: 0.9rem; line-height: 1.75; white-space: pre-line; }
.highlight-section { padding: 1.35rem 1.5rem; border: 1px solid var(--color-primary-100); border-radius: var(--radius-xl); background: var(--color-primary-50); }
.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(235px, 1fr)); gap: 0.75rem; }
.info-card { display: flex; gap: 0.8rem; min-width: 0; padding: 1rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); }
.info-icon { width: 36px; height: 36px; display: grid; place-items: center; flex-shrink: 0; border-radius: var(--radius-md); background: var(--color-primary-50); color: var(--color-primary-700); }
.info-icon svg { width: 19px; height: 19px; }
.info-content { min-width: 0; }
.info-content h3 { margin: 0 0 0.25rem; color: var(--color-text-muted); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
.info-content p, .contatos-text { margin: 0; color: var(--color-text-secondary); font-size: 0.84rem; line-height: 1.55; white-space: pre-line; }
.tags-container { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.tag { padding: 0.35rem 0.65rem; border: 1px solid var(--color-primary-100); border-radius: var(--radius-full); background: var(--color-primary-50); color: var(--color-primary-700); font-size: 0.75rem; font-weight: 700; }
.deadlines-section { padding: 1.35rem 1.5rem; border: 1px solid var(--color-warning-500); border-radius: var(--radius-xl); background: var(--color-warning-50); }
.deadlines-list, .requirements-list, .stages-list, .documents-list { display: flex; flex-direction: column; gap: 0.55rem; margin: 0; padding: 0; }
.deadlines-list, .requirements-list, .documents-list { list-style: none; }
.deadline-item { display: flex; align-items: flex-start; gap: 0.65rem; }
.deadline-marker { width: 7px; height: 7px; margin-top: 0.45rem; flex-shrink: 0; border-radius: var(--radius-full); background: var(--color-warning-500); }
.deadline-content { color: var(--color-warning-700); font-size: 0.85rem; line-height: 1.55; white-space: pre-line; }
.requirement-item, .document-item { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.8rem 0.9rem; border: 1px solid var(--color-primary-100); border-radius: var(--radius-lg); background: var(--color-primary-50); }
.check-icon, .doc-icon { width: 17px; height: 17px; margin-top: 0.1rem; flex-shrink: 0; color: var(--color-primary-600); }
.requirement-item span, .document-item span { color: var(--color-text-secondary); font-size: 0.85rem; line-height: 1.55; white-space: pre-line; }
.stage-item { display: flex; align-items: center; gap: 0.85rem; padding: 0.8rem 0.9rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); }
.stage-number { width: 28px; height: 28px; display: grid; place-items: center; flex-shrink: 0; border-radius: var(--radius-full); background: var(--color-primary-600); color: var(--color-text-inverse); font-size: 0.75rem; font-weight: 800; }
.stage-text { color: var(--color-text-secondary); font-size: 0.85rem; line-height: 1.55; white-space: pre-line; }

@media (max-width: 760px) { .edital-header { flex-direction: column; gap: 1.25rem; } .header-actions { width: 100%; justify-content: flex-start; } .header-actions .btn { flex: 1; } .info-grid { grid-template-columns: 1fr; } }
@media (max-width: 460px) { .header-actions { flex-direction: column; align-items: stretch; } .header-actions .btn { width: 100%; } .highlight-section, .deadlines-section { padding: 1.1rem; } }
</style>
