<template>
  <DashboardLayout page-title="Dashboard">
    <!-- Boas-vindas -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">Olá, {{ userFirstName }}! 👋</h1>
          <p class="welcome-subtitle">Use a inteligência artificial para explorar editais acadêmicos e tirar suas dúvidas</p>
        </div>
        <div class="welcome-actions">
          <router-link to="/chat" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Fazer uma Pergunta
          </router-link>
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
          <span class="stat-label">Editais Disponíveis</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ totalTrechos }}</span>
          <span class="stat-label">Trechos Indexados</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ hoje }}</span>
          <span class="stat-label">Hoje</span>
        </div>
      </div>
    </div>

    <!-- Ações Rápidas -->
    <div class="section">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        Ações Rápidas
      </h2>
      <div class="quick-actions-grid">
        <router-link to="/editais" class="quick-action-card">
          <div class="action-icon-wrapper action-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <div class="action-text">
            <span class="action-title">Ver Editais</span>
            <span class="action-desc">Explore todos os editais disponíveis</span>
          </div>
          <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </router-link>

        <router-link to="/chat" class="quick-action-card">
          <div class="action-icon-wrapper action-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="action-text">
            <span class="action-title">Chat com IA</span>
            <span class="action-desc">Faça perguntas sobre os editais</span>
          </div>
          <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </router-link>

        <router-link to="/perfil" class="quick-action-card">
          <div class="action-icon-wrapper action-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="action-text">
            <span class="action-title">Meu Perfil</span>
            <span class="action-desc">Gerencie suas informações</span>
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
        <router-link to="/editais" class="view-all-link">
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
        <h3>Nenhum edital disponível</h3>
        <p>Os editais aparecerão aqui quando forem adicionados ao sistema</p>
      </div>

      <div v-else class="editais-list">
        <router-link
          v-for="edital in editaisRecentes"
          :key="edital.id"
          :to="`/dashboard/editais/${edital.id}`"
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
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import { getEditais } from '../../services/api.js'

const totalEditais = ref(0)
const totalTrechos = ref(0)
const editaisRecentes = ref([])
const loading = ref(true)
const currentUser = ref(null)

const userFirstName = computed(() => {
  if (!currentUser.value) return 'Usuário'
  const nome = currentUser.value.nome || currentUser.value.email?.split('@')[0] || 'Usuário'
  return nome.split(' ')[0]
})

const hoje = computed(() => {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
})

onMounted(async () => {
  // Carregar usuário
  const stored = localStorage.getItem('user')
  if (stored) {
    try { currentUser.value = JSON.parse(stored) } catch { currentUser.value = null }
  }

  // Carregar editais
  try {
    const response = await getEditais()
    const editais = response.data || []
    totalEditais.value = editais.length
    totalTrechos.value = editais.reduce((sum, e) => sum + (e.chunkCount || 0), 0)
    editaisRecentes.value = editais.slice(0, 5)
  } catch (error) {
    console.error('Erro ao carregar editais:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* Boas-vindas */
.welcome-section {
  margin-bottom: 2rem;
}

.welcome-content {
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  border-radius: var(--radius-2xl);
  padding: 2rem 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  overflow: hidden;
}

.welcome-content::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 300px;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
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
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  max-width: 500px;
}

.welcome-actions {
  position: relative;
  z-index: 1;
}

.welcome-actions .btn {
  background: white;
  color: var(--color-primary-700);
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: all 150ms ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.welcome-actions .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.welcome-actions .btn svg {
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

.icon-primary {
  background: var(--color-primary-600);
}

.icon-success {
  background: var(--color-success-500);
}

.icon-info {
  background: var(--color-info-500);
}

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

.action-green { background: var(--color-primary-600); }
.action-blue { background: var(--color-info-500); }
.action-purple { background: #8b5cf6; }

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
  .welcome-content {
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
}
</style>
