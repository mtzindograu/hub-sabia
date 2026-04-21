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
          type="text"
          placeholder="Buscar por nome ou email..."
          class="search-input"
        />
      </div>
      <div class="users-count">
        <span class="count-badge">{{ filteredUsers.length }} usuário{{ filteredUsers.length !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- Users Table -->
    <div class="table-container">
      <table class="users-table">
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.625rem 1rem;
  flex: 1;
  max-width: 400px;
}

.search-box svg {
  width: 18px;
  height: 18px;
  color: #94a3b8;
  flex-shrink: 0;
}

.search-input {
  border: none;
  outline: none;
  font-size: 0.875rem;
  width: 100%;
  color: #334155;
}

.search-input::placeholder {
  color: #94a3b8;
}

.count-badge {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
}

/* Table */
.table-container {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.users-table th {
  text-align: left;
  padding: 0.875rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-row {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #f8fafc;
}

.users-table td {
  padding: 1rem 1.25rem;
  font-size: 0.875rem;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar-sm {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.user-name-cell {
  font-weight: 500;
  color: #0f172a;
}

.email-cell {
  color: #64748b;
}

.date-cell {
  color: #94a3b8;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.role-badge.admin {
  background: #16a34a15;
  color: #16a34a;
}

.role-badge.user {
  background: #f1f5f9;
  color: #475569;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 6px;
  color: #94a3b8;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon.delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

.btn-icon svg {
  width: 18px;
  height: 18px;
}

.admin-protected {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
}

.empty-table {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}

.empty-table svg {
  width: 48px;
  height: 48px;
  margin-bottom: 0.75rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.modal-icon.danger {
  background: #fef2f2;
  color: #ef4444;
}

.modal-icon svg {
  width: 24px;
  height: 24px;
}

.modal-content h3 {
  margin-bottom: 0.5rem;
  color: #0f172a;
}

.modal-content p {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.modal-actions button {
  padding: 0.625rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-danger:hover {
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .users-table th:nth-child(4),
  .users-table td:nth-child(4) {
    display: none;
  }
}

@media (max-width: 640px) {
  .users-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }
}
</style>
