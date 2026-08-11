<template>
  <DashboardLayout page-title="Gerenciar Usuários">
    <!-- Stats -->
    <div class="users-header">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="searchTerm"
          type="search"
          placeholder="Buscar por nome ou email..."
          aria-label="Buscar usuários por nome ou email"
          class="search-input"
        />
      </div>
      <div class="users-count">
        <span class="count-badge">{{ filteredUsers.length }} usuário{{ filteredUsers.length !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- Users Table -->
    <div class="table-container">
      <table class="users-table" aria-label="Usuários cadastrados">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>Email</th>
            <th>Tipo</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id" class="table-row">
            <td class="user-cell">
              <div class="user-avatar-sm">{{ getUserInitials(user) }}</div>
              <span class="user-name-cell">{{ user.nome || 'Sem nome' }}</span>
            </td>
            <td class="email-cell">{{ user.email }}</td>
            <td>
              <span class="role-badge" :class="user.role">
                {{ user.role === 'admin' ? 'Administrador' : 'Usuário' }}
              </span>
            </td>
            <td class="date-cell">{{ formatDate(user.createdAt) }}</td>
            <td>
              <button
                v-if="user.role !== 'admin'"
                class="btn-icon delete"
                @click="confirmDelete(user)"
                title="Excluir usuário"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
              <span v-else class="admin-protected">Protegido</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredUsers.length === 0" class="empty-table">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
        <p>Nenhum usuário encontrado</p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content">
        <div class="modal-icon danger">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h3>Excluir Usuário</h3>
        <p>Tem certeza que deseja excluir <strong>{{ selectedUser?.email }}</strong>? Esta ação não pode ser desfeita.</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDeleteModal = false">Cancelar</button>
          <button class="btn-danger" @click="handleDelete" :disabled="deleting">
            <span v-if="deleting" class="spinner spinner-sm"></span>
            <span v-else>Excluir</span>
          </button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import { getAllUsers, deleteUser } from '../../services/api.js'

const users = ref([])
const searchTerm = ref('')
const showDeleteModal = ref(false)
const selectedUser = ref(null)
const deleting = ref(false)

const filteredUsers = computed(() => {
  if (!searchTerm.value) return users.value
  const term = searchTerm.value.toLowerCase()
  return users.value.filter(u =>
    (u.nome || '').toLowerCase().includes(term) ||
    u.email.toLowerCase().includes(term)
  )
})

onMounted(async () => {
  await loadUsers()
})

async function loadUsers() {
  try {
    const response = await getAllUsers()
    users.value = response.data || []
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  }
}

function getUserInitials(user) {
  const name = user.nome || user.email?.split('@')[0] || 'U'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(date) {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function confirmDelete(user) {
  selectedUser.value = user
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!selectedUser.value) return
  try {
    deleting.value = true
    await deleteUser(selectedUser.value.id)
    users.value = users.value.filter(u => u.id !== selectedUser.value.id)
    showDeleteModal.value = false
    selectedUser.value = null
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    alert('Erro ao excluir usuário: ' + (error.message || 'Tente novamente'))
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.users-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: min(100%, 28rem);
  min-height: 2.8rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.search-box:focus-within {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.search-box svg {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  color: var(--color-gray-400);
}

.search-input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 0.875rem;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.users-count {
  flex: 0 0 auto;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  font-weight: 700;
}

.table-container {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.users-table {
  width: 100%;
  min-width: 42rem;
  border-collapse: collapse;
  text-align: left;
}

.users-table thead {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-2);
}

.users-table th {
  padding: 0.85rem 1.2rem;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.users-table td {
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  vertical-align: middle;
}

.table-row:last-child td {
  border-bottom: 0;
}

.table-row {
  transition: background var(--transition-fast);
}

.table-row:hover {
  background: var(--color-surface-2);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 12rem;
}

.user-avatar-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 auto;
  border-radius: var(--radius-lg);
  background: var(--color-primary-100);
  color: var(--color-primary-800);
  font-size: 0.75rem;
  font-weight: 800;
}

.user-name-cell {
  overflow: hidden;
  color: var(--color-text);
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email-cell {
  max-width: 16rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date-cell {
  color: var(--color-text-muted) !important;
  white-space: nowrap;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
}

.role-badge.admin {
  background: var(--color-primary-100);
  color: var(--color-primary-800);
}

.role-badge.user {
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
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
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}

.btn-icon:hover {
  border-color: var(--color-danger-500);
  background: var(--color-danger-50);
  color: var(--color-danger-600);
  transform: translateY(-2px);
}

.btn-icon:focus-visible,
.modal-actions button:focus-visible {
  outline: 3px solid var(--color-primary-300);
  outline-offset: 2px;
}

.btn-icon svg {
  width: 18px;
  height: 18px;
}

.admin-protected {
  color: var(--color-text-muted);
  font-size: 0.72rem;
  font-style: italic;
}

.empty-table {
  padding: 4rem 1.5rem;
  color: var(--color-text-muted);
  text-align: center;
}

.empty-table svg {
  width: 3rem;
  height: 3rem;
  margin-bottom: 0.8rem;
  color: var(--color-primary-300);
}

.empty-table p {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.15rem;
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

.modal-content {
  width: min(100%, 26rem);
  padding: 2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-xl);
  text-align: center;
}

.modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  border-radius: var(--radius-xl);
}

.modal-icon.danger {
  background: var(--color-danger-50);
  color: var(--color-danger-600);
}

.modal-icon svg {
  width: 24px;
  height: 24px;
}

.modal-content h3 {
  margin: 0 0 0.5rem;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.35rem;
}

.modal-content p {
  margin: 0 0 1.5rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
}

.modal-content strong {
  color: var(--color-text);
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.modal-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.7rem;
  min-width: 7rem;
  padding: 0.65rem 1.15rem;
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
}

.btn-secondary {
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  border-color: var(--color-border-hover);
  background: var(--color-surface);
  transform: translateY(-2px);
}

.btn-danger {
  border: 1px solid var(--color-danger-600);
  background: var(--color-danger-600);
  color: var(--color-text-inverse);
}

.btn-danger:hover {
  background: var(--color-danger-700);
  box-shadow: var(--shadow-danger);
  transform: translateY(-2px);
}

.btn-danger:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.spinner-sm {
  width: 1rem;
  height: 1rem;
  border: 2px solid var(--color-danger-50);
  border-top-color: var(--color-text-inverse);
  border-radius: var(--radius-full);
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .users-header {
    align-items: stretch;
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .users-count {
    align-self: flex-start;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button {
    width: 100%;
  }
}
</style>
