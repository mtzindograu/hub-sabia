<template>
  <DashboardLayout page-title="Logs de Interação">
    <div class="logs-container">
      <div class="header-section">
        <div class="title-group">
          <h1 class="page-title">Histórico de conversas</h1>
          <p class="page-subtitle">Acompanhe as perguntas e respostas geradas pela IA</p>
        </div>
        <div class="filter-actions">
          <select v-model="filters.status" class="filter-select" aria-label="Filtrar por status" @change="fetchLogs">
            <option value="">Todos os status</option>
            <option value="success">Sucesso</option>
            <option value="error">Erro</option>
          </select>
          <button class="btn btn-secondary" @click="fetchLogs" :disabled="loading" aria-label="Atualizar histórico de conversas">
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

        <table v-else class="logs-table" aria-label="Histórico de conversas">
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
          <button class="btn-close" @click="selectedLog = null" aria-label="Fechar detalhes">&times;</button>
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
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem;
}

.page-title {
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.65rem, 3vw, 2.15rem);
  font-weight: 600;
  letter-spacing: -0.025em;
}

.page-subtitle {
  margin: 0.45rem 0 0;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.5;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex: 0 0 auto;
}

.filter-select {
  min-height: 2.7rem;
  padding: 0.55rem 2rem 0.55rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  outline: 0;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 0.82rem;
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.filter-select:focus-visible {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 2.7rem;
  padding: 0.6rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}

.btn-secondary:hover:not(:disabled) {
  border-color: var(--color-border-hover);
  background: var(--color-surface);
  transform: translateY(-2px);
}

.btn-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary:focus-visible,
.btn-page:focus-visible,
.btn-icon:focus-visible,
.btn-close:focus-visible {
  outline: 3px solid var(--color-primary-300);
  outline-offset: 2px;
}

.filter-actions svg {
  width: 17px;
  height: 17px;
}

.logs-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.mini-stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-height: 5.5rem;
  padding: 1rem 1.2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-base), transform var(--transition-base);
}

.mini-stat-card:hover {
  border-color: var(--color-primary-300);
  transform: translateY(-2px);
}

.stat-label {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.stat-value {
  color: var(--color-text);
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.025em;
}

.text-success {
  color: var(--color-success-600);
}

.table-card {
  position: relative;
  min-height: 24rem;
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.logs-table {
  width: 100%;
  min-width: 50rem;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.82rem;
}

.logs-table th {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
}

.logs-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  vertical-align: middle;
}

.logs-table tbody tr {
  transition: background var(--transition-fast);
}

.logs-table tbody tr:hover {
  background: var(--color-surface-2);
}

.logs-table tbody tr:last-child td {
  border-bottom: 0;
}

.row-error {
  box-shadow: inset 3px 0 0 var(--color-danger-500);
}

.td-date,
.td-time {
  color: var(--color-text-muted) !important;
  white-space: nowrap;
}

.td-question {
  min-width: 14rem;
}

.user-badge,
.guest-badge,
.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 800;
  white-space: nowrap;
}

.user-badge {
  background: var(--color-primary-100);
  color: var(--color-primary-800);
}

.guest-badge {
  background: var(--color-surface-2);
  color: var(--color-text-muted);
}

.truncate-text {
  max-width: 18rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edital-link {
  display: block;
  max-width: 12rem;
  overflow: hidden;
  color: var(--color-text);
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-pill.success {
  background: var(--color-success-50);
  color: var(--color-success-600);
}

.status-pill.error {
  background: var(--color-danger-50);
  color: var(--color-danger-600);
}

.text-muted {
  color: var(--color-text-muted);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-primary-600);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}

.btn-icon:hover {
  border-color: var(--color-primary-200);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  transform: translateY(-2px);
}

.btn-icon svg {
  width: 18px;
  height: 18px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid var(--color-border);
}

.btn-page {
  min-height: 2.3rem;
  padding: 0.5rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
}

.btn-page:hover:not(:disabled) {
  border-color: var(--color-primary-300);
  background: var(--color-primary-50);
  transform: translateY(-2px);
}

.btn-page:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.page-info {
  color: var(--color-text-muted);
  font-size: 0.78rem;
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

.log-details-modal {
  display: flex;
  flex-direction: column;
  width: min(100%, 44rem);
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.3rem;
}

.btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}

.btn-close:hover {
  background: var(--color-surface-2);
  color: var(--color-text);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  overflow-y: auto;
}

.detail-group label,
.detail-item label {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.detail-value.box {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

.detail-value.response {
  white-space: pre-wrap;
}

.text-error {
  color: var(--color-danger-600) !important;
}

.error-box {
  padding: 1rem;
  border: 1px solid var(--color-danger-500);
  border-radius: var(--radius-lg);
  background: var(--color-danger-50);
  color: var(--color-danger-700);
  font-family: var(--font-body);
  font-size: 0.85rem;
  line-height: 1.5;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--radius-lg);
  background: var(--color-surface-2);
}

.detail-item span {
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 700;
  word-break: break-word;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.btn-primary {
  min-height: 2.7rem;
  padding: 0.6rem 1rem;
  border: 1px solid var(--color-primary-600);
  border-radius: var(--radius-lg);
  background: var(--color-primary-600);
  color: var(--color-text-inverse);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);
}

.btn-primary:hover {
  background: var(--color-primary-700);
  box-shadow: var(--shadow-primary);
  transform: translateY(-2px);
}

.spinner {
  width: 2.25rem;
  height: 2.25rem;
  margin: 0 auto 1rem;
  border: 3px solid var(--color-primary-100);
  border-top-color: var(--color-primary-600);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
}

.loading-overlay p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

.empty-logs {
  padding: 5rem 2rem;
  color: var(--color-text-muted);
  text-align: center;
}

.empty-logs svg {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
  color: var(--color-primary-300);
}

.empty-logs h3 {
  margin: 0 0 0.45rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.3rem;
}

.empty-logs p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .header-section {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-actions {
    width: 100%;
  }

  .filter-select,
  .filter-actions .btn-secondary {
    flex: 1;
  }

  .logs-stats {
    grid-template-columns: 1fr;
  }

  .logs-table {
    min-width: 0;
  }

  .logs-table th:nth-child(4),
  .logs-table td:nth-child(4),
  .logs-table th:nth-child(5),
  .logs-table td:nth-child(5) {
    display: none;
  }
}

@media (max-width: 520px) {
  .filter-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-select,
  .filter-actions .btn-secondary {
    width: 100%;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    gap: 0.6rem;
  }
}
</style>
