<template>
  <DashboardLayout page-title="Painel Administrativo">
    <!-- Boas-vindas Admin -->
    <div class="welcome-section">
      <div class="welcome-content admin-gradient">
        <div class="welcome-text">
          <h1 class="welcome-title">Painel Administrativo ⚙️</h1>
          <p class="welcome-subtitle">Gerencie editais, usuários e acompanhe as métricas do sistema</p>
        </div>
        <div class="welcome-actions">
          <button class="btn btn-white" @click="showUploadModal = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Adicionar Edital
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
        Ações Administrativas
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Editais Recentes
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
    <div v-if="showUploadModal" class="modal-overlay" @click.self="showUploadModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <h3>Adicionar Edital</h3>
        </div>
        <div class="modal-body">
          <p>Para adicionar um novo edital, acesse a página de <strong>Editais</strong> e use o botão de upload.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showUploadModal = false">Fechar</button>
          <router-link to="/admin/editais" class="btn btn-primary">
            Ir para Editais
          </router-link>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
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
/* Boas-vindas */
.welcome-section {
  margin-bottom: 2rem;
}

.welcome-content.admin-gradient {
  background: linear-gradient(135deg, #1e293b, #334155);
  border-radius: var(--radius-2xl);
  padding: 2rem 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  overflow: hidden;
}

.welcome-content.admin-gradient::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 300px;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  transform: translate(50px, -50px);
}

.welcome-text {
  position: relative;
  z-index: 1;
}

.welcome-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem;
}

.welcome-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  max-width: 500px;
}

.welcome-actions {
  position: relative;
  z-index: 1;
}

.btn-white {
  background: white;
  color: #1e293b;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-white:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.btn-white svg {
  width: 18px;
  height: 18px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--color-border);
  transition: box-shadow 150ms ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 22px;
  height: 22px;
  color: white;
}

.icon-primary { background: var(--color-primary-600); }
.icon-success { background: var(--color-success-500); }
.icon-warning { background: var(--color-warning-500); }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--color-gray-500);
}

/* Sections */
.section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title svg {
  width: 20px;
  height: 20px;
  color: var(--color-primary-600);
}

/* Quick Actions */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.quick-action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  text-decoration: none;
  transition: all 150ms ease;
  cursor: pointer;
}

.quick-action-card:hover {
  border-color: var(--color-primary-300);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.action-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-icon-wrapper svg {
  width: 22px;
  height: 22px;
  color: white;
}

.action-primary { background: var(--color-primary-600); }
.action-success { background: var(--color-success-500); }
.action-warning { background: var(--color-warning-500); }

.action-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.action-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-gray-900);
}

.action-desc {
  font-size: 0.8125rem;
  color: var(--color-gray-500);
}

.action-arrow {
  width: 18px;
  height: 18px;
  color: var(--color-gray-400);
  flex-shrink: 0;
  transition: transform 150ms ease, color 150ms ease;
}

.quick-action-card:hover .action-arrow {
  transform: translateX(4px);
  color: var(--color-primary-600);
}

/* Section Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-primary-600);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 150ms ease;
}

.view-all-link svg {
  width: 16px;
  height: 16px;
}

.view-all-link:hover {
  color: var(--color-primary-700);
}

/* Editais List */
.editais-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  padding: 0.75rem;
}

.edital-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.125rem;
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: inherit;
  transition: background 150ms ease;
}

.edital-item:hover {
  background: var(--color-surface-2);
}

.edital-icon {
  width: 42px;
  height: 42px;
  background: var(--color-primary-50);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-600);
  flex-shrink: 0;
}

.edital-icon svg {
  width: 20px;
  height: 20px;
}

.edital-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.edital-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-gray-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edital-meta {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 0.25rem;
}

.year-badge {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.6875rem;
  font-weight: 600;
}

.edital-meta span:last-child {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.edital-arrow {
  width: 18px;
  height: 18px;
  color: var(--color-gray-400);
  flex-shrink: 0;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.empty-icon svg {
  width: 56px;
  height: 56px;
  color: var(--color-gray-300);
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin: 0 0 0.375rem;
}

.empty-state p {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin: 0;
}

.mt-4 {
  margin-top: 1.25rem;
}

.btn-primary {
  background: var(--color-primary-600);
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: all 150ms ease;
}

.btn-primary:hover {
  background: var(--color-primary-700);
  box-shadow: var(--shadow-primary);
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

.btn-secondary {
  background: var(--color-surface-2);
  color: var(--color-gray-700);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  border: 1px solid var(--color-border);
  cursor: pointer;
  text-decoration: none;
  transition: all 150ms ease;
}

.btn-secondary:hover {
  background: var(--color-gray-200);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  max-width: 440px;
  width: 100%;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  animation: modalIn 0.2s ease;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 2rem 2rem 1rem;
  text-align: center;
}

.modal-icon-wrapper {
  width: 56px;
  height: 56px;
  background: var(--color-primary-50);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.modal-icon-wrapper svg {
  width: 28px;
  height: 28px;
  color: var(--color-primary-600);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0;
}

.modal-body {
  padding: 0 2rem;
  text-align: center;
}

.modal-body p {
  font-size: 0.9375rem;
  color: var(--color-gray-600);
  line-height: 1.6;
  margin: 0;
}

.modal-body strong {
  color: var(--color-gray-900);
}

.modal-footer {
  padding: 1.5rem 2rem 2rem;
  display: flex;
  gap: 0.75rem;
}

.modal-footer .btn-secondary,
.modal-footer .btn-primary {
  flex: 1;
  justify-content: center;
}

/* Responsivo */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .welcome-content.admin-gradient {
    flex-direction: column;
    text-align: center;
    padding: 1.75rem 1.5rem;
  }

  .welcome-subtitle {
    max-width: none;
  }

  .welcome-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 640px) {
  .welcome-title {
    font-size: 1.375rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .modal-footer {
    flex-direction: column;
  }
}
</style>
