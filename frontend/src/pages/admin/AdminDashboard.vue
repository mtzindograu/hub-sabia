<template>
  <DashboardLayout page-title="Painel Administrativo">
    <!-- Boas-vindas Admin -->
    <div class="welcome-section">
      <div class="welcome-content admin-gradient">
        <div class="welcome-text">
          <h1 class="welcome-title">Painel Administrativo</h1>
          <p class="welcome-subtitle">Gerencie editais, usuários e acompanhe as métricas do sistema</p>
        </div>
        <div class="welcome-actions">
          <button class="btn btn-white" @click="showUploadModal = true" aria-label="Adicionar novo edital">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Adicionar edital
          </button>
    </div>
</div>
</div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon icon-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ totalEditais }}</span>
          <span class="stat-label">Total de Editais</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ totalUsuarios }}</span>
          <span class="stat-label">Usuários Cadastrados</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ totalTrechos }}</span>
          <span class="stat-label">Trechos Indexados</span>
        </div>
      </div>
    </div>

    <!-- Ações Administrativas -->
    <div class="section">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        Ações rápidas
      </h2>
      <div class="quick-actions-grid">
        <button class="quick-action-card" @click="showUploadModal = true">
          <div class="action-icon-wrapper action-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="action-text">
            <span class="action-title">Adicionar Edital</span>
            <span class="action-desc">Faça upload de um novo edital PDF</span>
          </div>
          <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <router-link to="/admin/usuarios" class="quick-action-card">
          <div class="action-icon-wrapper action-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="action-text">
            <span class="action-title">Gerenciar Usuários</span>
            <span class="action-desc">Veja e gerencie os usuários</span>
          </div>
          <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </router-link>

        <router-link to="/admin/logs" class="quick-action-card">
          <div class="action-icon-wrapper action-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div class="action-text">
            <span class="action-title">Logs de Chat</span>
            <span class="action-desc">Veja o histórico de interações</span>
          </div>
          <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </router-link>

        <router-link to="/admin/editais" class="quick-action-card">
          <div class="action-icon-wrapper action-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <div class="action-text">
            <span class="action-title">Todos os Editais</span>
            <span class="action-desc">Gerencie os editais cadastrados</span>
          </div>
          <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </router-link>
      </div>
    </div>

    <!-- Editais Recentes -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Editais recentes
        </h2>
        <router-link to="/admin/editais" class="view-all-link">
          Ver todos
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </router-link>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando editais...</p>
      </div>

      <div v-else-if="editaisRecentes.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <h3>Nenhum edital cadastrado</h3>
        <p>Comece adicionando o primeiro edital ao sistema</p>
        <button class="btn btn-primary mt-4" @click="showUploadModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Adicionar Primeiro Edital
        </button>
      </div>

      <div v-else class="editais-list">
        <router-link
          v-for="edital in editaisRecentes"
          :key="edital.id"
          :to="`/admin/editais/${edital.id}`"
          class="edital-item"
        >
          <div class="edital-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="edital-info">
            <span class="edital-title">{{ edital.titulo }}</span>
            <span class="edital-meta">
              <span class="year-badge">{{ edital.ano }}</span>
              <span>{{ edital.chunkCount || 0 }} trechos</span>
            </span>
          </div>
          <svg class="edital-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </router-link>
      </div>
    </div>

    <!-- Upload Modal -->
    <EditalUploadModal 
      v-if="showUploadModal" 
      @close="showUploadModal = false"
      @success="loadStats"
    />
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import EditalUploadModal from '../../components/EditalUploadModal.vue'
import { getEditais, getAllUsers } from '../../services/api.js'
import { warning } from '../../utils/toast.js'

const totalEditais = ref(0)
const totalUsuarios = ref(0)
const totalTrechos = ref(0)
const editaisRecentes = ref([])
const loading = ref(true)
const showUploadModal = ref(false)

onMounted(async () => {
  await loadStats()
})

async function loadStats() {
  try {
    loading.value = true

    const editaisResponse = await getEditais()
    const editais = editaisResponse.data || []
    totalEditais.value = editais.length
    totalTrechos.value = editais.reduce((sum, e) => sum + (e.chunkCount || 0), 0)
    editaisRecentes.value = editais.slice(0, 5)

    try {
      const usersResponse = await getAllUsers()
      totalUsuarios.value = usersResponse.data?.length || 0
    } catch {
      totalUsuarios.value = 0
    }
  } catch (error) {
    console.error('Erro ao carregar stats:', error)
    warning('Não foi possível carregar todas as estatísticas.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.welcome-section {
  margin-bottom: 2.25rem;
}

.welcome-content.admin-gradient {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  overflow: hidden;
  padding: 2.25rem 2.5rem;
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-primary-600);
  border-radius: var(--radius-2xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.welcome-content.admin-gradient::after {
  content: '';
  position: absolute;
  right: -4rem;
  top: -5rem;
  width: 13rem;
  height: 13rem;
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius-full);
  opacity: 0.7;
}

.welcome-text,
.welcome-actions {
  position: relative;
  z-index: 1;
}

.welcome-title {
  margin: 0 0 0.5rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3vw, 2.35rem);
  font-weight: 600;
  letter-spacing: -0.025em;
}

.welcome-subtitle {
  max-width: 34rem;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.btn-white {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.7rem 1.15rem;
  border: 1px solid var(--color-primary-600);
  border-radius: var(--radius-lg);
  background: var(--color-primary-600);
  color: var(--color-text-inverse);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--transition-base), background var(--transition-base), box-shadow var(--transition-base);
}

.btn-white:hover {
  background: var(--color-primary-700);
  box-shadow: var(--shadow-primary);
  transform: translateY(-2px);
}

.btn-white:focus-visible {
  outline: 3px solid var(--color-primary-300);
  outline-offset: 3px;
}

.btn-white svg,
.btn-primary svg,
.btn-secondary svg {
  width: 18px;
  height: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 7rem;
  padding: 1.25rem 1.5rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base);
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--color-primary-600);
}

.stat-card:hover {
  border-color: var(--color-primary-300);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-icon,
.action-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: var(--radius-lg);
}

.stat-icon {
  width: 2.75rem;
  height: 2.75rem;
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}

.stat-icon svg {
  width: 21px;
  height: 21px;
}

.icon-success {
  background: var(--color-success-50);
  color: var(--color-success-600);
}

.icon-warning {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat-value {
  color: var(--color-text);
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.stat-label {
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 600;
}

.section {
  margin-bottom: 2.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 1rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.section-title svg {
  width: 19px;
  height: 19px;
  color: var(--color-primary-600);
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.quick-action-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  color: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: border-color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base);
}

.quick-action-card:hover {
  border-color: var(--color-primary-300);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.action-icon-wrapper {
  width: 2.7rem;
  height: 2.7rem;
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}

.action-icon-wrapper svg {
  width: 20px;
  height: 20px;
}

.action-success {
  background: var(--color-success-50);
  color: var(--color-success-600);
}

.action-warning {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
}

.action-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 0.2rem;
}

.action-title {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-desc {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-arrow {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  color: var(--color-gray-400);
  transition: color var(--transition-fast), transform var(--transition-fast);
}

.quick-action-card:hover .action-arrow {
  color: var(--color-primary-600);
  transform: translateX(3px);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-header .section-title {
  margin-bottom: 0;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-primary-600);
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
  transition: color var(--transition-fast);
}

.view-all-link:hover {
  color: var(--color-primary-700);
}

.view-all-link svg {
  width: 16px;
  height: 16px;
}

.editais-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.edital-item {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
  padding: 0.9rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  color: inherit;
  text-decoration: none;
  transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
}

.edital-item:hover {
  border-color: var(--color-primary-200);
  background: var(--color-primary-50);
  transform: translateX(2px);
}

.edital-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  border-radius: var(--radius-md);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}

.edital-icon svg {
  width: 19px;
  height: 19px;
}

.edital-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 0.3rem;
}

.edital-title {
  overflow: hidden;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edital-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.year-badge {
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  font-size: 0.68rem;
  font-weight: 800;
}

.edital-meta span:last-child {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.edital-arrow {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  color: var(--color-gray-400);
}

.loading-state,
.empty-state {
  padding: 3.5rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  text-align: center;
}

.empty-icon svg {
  width: 3.25rem;
  height: 3.25rem;
  margin-bottom: 1rem;
  color: var(--color-primary-300);
}

.empty-state h3 {
  margin: 0 0 0.4rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.25rem;
}

.empty-state p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.loading-state p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  margin: 0 auto 0.9rem;
  border: 3px solid var(--color-primary-100);
  border-top-color: var(--color-primary-600);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

.mt-4 {
  margin-top: 1.25rem;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.7rem 1.15rem;
  border-radius: var(--radius-lg);
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: transform var(--transition-base), background var(--transition-base), box-shadow var(--transition-base);
}

.btn-primary {
  border: 1px solid var(--color-primary-600);
  background: var(--color-primary-600);
  color: var(--color-text-inverse);
}

.btn-primary:hover {
  background: var(--color-primary-700);
  box-shadow: var(--shadow-primary);
  transform: translateY(-2px);
}

.btn-secondary {
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  border-color: var(--color-border-hover);
  background: var(--color-surface);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: color-mix(in srgb, var(--color-gray-900) 68%, transparent);
}

.modal-card {
  position: relative;
  z-index: var(--z-modal);
  width: 100%;
  max-width: 28rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-xl);
}

.modal-header {
  padding: 2rem 2rem 1rem;
  text-align: center;
}

.modal-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 1rem;
  border-radius: var(--radius-xl);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}

.modal-icon-wrapper svg {
  width: 26px;
  height: 26px;
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.25rem;
  font-weight: 800;
}

.modal-body {
  padding: 0 2rem;
  text-align: center;
}

.modal-body p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.modal-body strong {
  color: var(--color-text);
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem 2rem 2rem;
}

.modal-footer .btn-secondary,
.modal-footer .btn-primary {
  flex: 1;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: 1fr; }
}

@media (max-width: 720px) {
  .welcome-content.admin-gradient {
    align-items: flex-start;
    flex-direction: column;
    padding: 1.75rem 1.5rem;
  }

  .quick-actions-grid { grid-template-columns: 1fr; }
}

@media (max-width: 520px) {
  .section-header { align-items: flex-start; flex-direction: column; }
  .welcome-title { font-size: 1.75rem; }
  .welcome-actions,
  .btn-white { width: 100%; }
  .modal-footer { flex-direction: column; }
}
</style>
