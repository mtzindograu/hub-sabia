<template>
  <DashboardLayout page-title="Logs de Interação">
    <div class="logs-container">
      <div class="header-section">
        <div class="title-group">
          <h1 class="page-title">Histórico de Conversas 📊</h1>
          <p class="page-subtitle">Acompanhe as perguntas e respostas geradas pela IA</p>
        </div>
        <div class="filter-actions">
          <select v-model="filters.status" class="filter-select" @change="fetchLogs">
            <option value="">Todos os Status</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
          </select>
          <button class="btn btn-secondary" @click="fetchLogs" :disabled="loading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Atualizar
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="logs-stats">
        <div class="mini-stat-card">
          <span class="stat-label">Total de Interações</span>
          <span class="stat-value">{{ pagination.total }}</span>
        </div>
        <div class="mini-stat-card">
          <span class="stat-label">Taxa de Sucesso</span>
          <span class="stat-value text-success">{{ successRate }}%</span>
        </div>
        <div class="mini-stat-card">
          <span class="stat-label">Tempo Médio</span>
          <span class="stat-value">{{ avgResponseTime }}ms</span>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="table-card">
        <div v-if="loading" class="loading-overlay">
          <div class="spinner"></div>
          <p>Carregando logs...</p>
        </div>

        <div v-else-if="logs.length === 0" class="empty-logs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <h3>Nenhum registro encontrado</h3>
          <p>As interações do chat aparecerão aqui automaticamente.</p>
        </div>

        <table v-else class="logs-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Usuário</th>
              <th>Pergunta</th>
              <th>Edital</th>
              <th>Tempo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log._id" :class="{ 'row-error': log.status === 'error' }">
              <td class="td-date">{{ formatDate(log.createdAt) }}</td>
              <td class="td-user">
                <span v-if="log.usuario_id" class="user-badge">Logado</span>
                <span v-else class="guest-badge">Visitante</span>
              </td>
              <td class="td-question">
                <div class="truncate-text" :title="log.pergunta">{{ log.pergunta }}</div>
              </td>
              <td class="td-edital">
                <span v-if="log.edital_id" class="edital-link">
                  {{ log.edital_id.titulo }}
                </span>
                <span v-else class="text-muted">Global</span>
              </td>
              <td class="td-time">{{ log.tempoRespostaMs }}ms</td>
              <td class="td-status">
                <span :class="['status-pill', log.status]">
                  {{ log.status === 'success' ? 'Sucesso' : 'Erro' }}
                </span>
              </td>
              <td class="td-actions">
                <button class="btn-icon" @click="viewDetails(log)" title="Ver Detalhes">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="pagination.total > filters.limit" class="pagination">
          <button 
            :disabled="filters.offset === 0" 
            @click="changePage(-1)"
            class="btn-page"
          >
            Anterior
          </button>
          <span class="page-info">
            {{ currentRange }} de {{ pagination.total }}
          </span>
          <button 
            :disabled="!pagination.hasMore" 
            @click="changePage(1)"
            class="btn-page"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="selectedLog" class="modal-overlay" @click.self="selectedLog = null">
      <div class="modal-content log-details-modal">
        <div class="modal-header">
          <h3>Detalhes da Interação</h3>
          <button class="btn-close" @click="selectedLog = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-group">
            <label>Pergunta</label>
            <div class="detail-value box">{{ selectedLog.pergunta }}</div>
          </div>
          <div class="detail-group">
            <label>Resposta</label>
            <div class="detail-value box response">{{ selectedLog.resposta }}</div>
          </div>
          <div v-if="selectedLog.error_message" class="detail-group">
            <label class="text-error">Erro</label>
            <div class="detail-value error-box">{{ selectedLog.error_message }}</div>
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Data</label>
              <span>{{ formatDate(selectedLog.createdAt, true) }}</span>
            </div>
            <div class="detail-item">
              <label>Tempo de Resposta</label>
              <span>{{ selectedLog.tempoRespostaMs }}ms</span>
            </div>
            <div class="detail-item">
              <label>Campus</label>
              <span>{{ selectedLog.campus_id || 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <label>ID do Edital</label>
              <span>{{ selectedLog.edital_id?._id || selectedLog.edital_id || 'N/A' }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="selectedLog = null">Fechar</button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import { getChatHistory } from '../../services/api.js'
import { error as showError } from '../../utils/toast.js'

const logs = ref([])
const loading = ref(true)
const selectedLog = ref(null)

const filters = reactive({
  status: '',
  limit: 15,
  offset: 0
})

const pagination = reactive({
  total: 0,
  hasMore: false
})

onMounted(() => {
  fetchLogs()
})

async function fetchLogs() {
  try {
    loading.value = true
    const response = await getChatHistory(filters)
    logs.value = response.data || []
    pagination.total = response.pagination?.total || 0
    pagination.hasMore = response.pagination?.hasMore || false
  } catch (error) {
    showError('Erro ao carregar logs: ' + error.message)
  } finally {
    loading.value = false
  }
}

const successRate = computed(() => {
  if (logs.value.length === 0) return 0
  const successCount = logs.value.filter(l => l.status === 'success').length
  return Math.round((successCount / logs.value.length) * 100)
})

const avgResponseTime = computed(() => {
  if (logs.value.length === 0) return 0
  const sum = logs.value.reduce((acc, log) => acc + log.tempoRespostaMs, 0)
  return Math.round(sum / logs.value.length)
})

const currentRange = computed(() => {
  const start = filters.offset + 1
  const end = Math.min(filters.offset + filters.limit, pagination.total)
  return `${start}-${end}`
})

function changePage(delta) {
  filters.offset += delta * filters.limit
  if (filters.offset < 0) filters.offset = 0
  fetchLogs()
}

function formatDate(dateStr, full = false) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (full) {
    return date.toLocaleString('pt-BR')
  }
  return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function viewDetails(log) {
  selectedLog.value = log
}
</script>

<style scoped>
.logs-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0;
}

.page-subtitle {
  color: var(--color-gray-500);
  margin: 0.25rem 0 0;
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
}

.filter-select {
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-gray-700);
  font-size: 0.875rem;
}

/* Stats */
.logs-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.mini-stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray-500);
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.text-success { color: var(--color-success-600); }

/* Table */
.table-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  position: relative;
  min-height: 400px;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.logs-table th {
  background: var(--color-gray-50);
  padding: 1rem;
  font-weight: 600;
  color: var(--color-gray-700);
  border-bottom: 1px solid var(--color-border);
}

.logs-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-gray-600);
}

.row-error {
  background: rgba(239, 68, 68, 0.02);
}

.td-date { white-space: nowrap; }

.user-badge {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.guest-badge {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
}

.truncate-text {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-pill {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.status-pill.success { background: var(--color-success-100); color: var(--color-success-700); }
.status-pill.error { background: var(--color-error-100); color: var(--color-error-700); }

.btn-icon {
  background: none;
  border: none;
  color: var(--color-primary-600);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.btn-icon:hover { background: var(--color-primary-50); color: var(--color-primary-700); }
.btn-icon svg { width: 20px; height: 20px; }

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  gap: 1.5rem;
}

.btn-page {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
}

.btn-page:disabled { opacity: 0.5; cursor: not-allowed; }

.page-info { font-size: 0.875rem; color: var(--color-gray-500); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.log-details-modal {
  background: var(--color-surface);
  width: 90%;
  max-width: 700px;
  border-radius: var(--radius-xl);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 { margin: 0; font-size: 1.25rem; }

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-gray-400);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.detail-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray-500);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.detail-value.box {
  background: var(--color-gray-50);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  font-size: 0.9375rem;
  line-height: 1.6;
}

.detail-value.response {
  white-space: pre-wrap;
}

.error-box {
  background: var(--color-error-50);
  border: 1px solid var(--color-error-200);
  color: var(--color-error-700);
  border-radius: var(--radius-lg);
  padding: 1rem;
  font-family: monospace;
  font-size: 0.875rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  background: var(--color-gray-50);
  padding: 1rem;
  border-radius: var(--radius-lg);
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item label { margin-bottom: 0.25rem; }
.detail-item span { font-size: 0.875rem; font-weight: 600; color: var(--color-gray-900); }

.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

/* Utils */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-primary-100);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.empty-logs {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--color-gray-400);
}

.empty-logs svg { width: 64px; height: 64px; margin-bottom: 1rem; }
.empty-logs h3 { color: var(--color-gray-700); margin-bottom: 0.5rem; }

@media (max-width: 768px) {
  .header-section { flex-direction: column; align-items: flex-start; }
  .logs-stats { grid-template-columns: 1fr; }
  .detail-grid { grid-template-columns: 1fr; }
  .logs-table th:nth-child(4), .logs-table td:nth-child(4),
  .logs-table th:nth-child(5), .logs-table td:nth-child(5) { display: none; }
}
</style>
