<template>
  <DashboardLayout :page-title="isAdmin ? 'Meu Perfil' : 'Meu Perfil'">
    <div class="profile-page">
      <!-- Card Principal -->
      <div class="profile-card">
        <!-- Banner/Header -->
        <div class="profile-banner">
          <div class="avatar-wrapper">
            <div class="avatar" :class="{ 'is-admin': isAdmin }">
              <span class="avatar-initials">{{ userInitials }}</span>
            </div>
            <div class="avatar-status"></div>
          </div>
        </div>

        <!-- Informações -->
        <div class="profile-body">
          <div class="profile-header-info">
            <h1 class="profile-name">{{ userName }}</h1>
            <p class="profile-email">{{ userEmail }}</p>
            <span class="role-badge" :class="userRole">
              <svg v-if="isAdmin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              {{ userRoleLabel }}
            </span>
          </div>

          <!-- Detalhes Grid -->
          <div class="details-grid">
            <div class="detail-card">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="detail-content">
                <span class="detail-label">Nome</span>
                <span class="detail-value">{{ userName }}</span>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div class="detail-content">
                <span class="detail-label">Email</span>
                <span class="detail-value email-value">{{ userEmail }}</span>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div class="detail-content">
                <span class="detail-label">Tipo de Conta</span>
                <span class="detail-value">{{ userRoleLabel }}</span>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="detail-content">
                <span class="detail-label">Membro desde</span>
                <span class="detail-value">{{ memberSince }}</span>
              </div>
            </div>
          </div>

          <!-- Ações -->
          <div class="profile-actions">
            <button class="btn-action btn-edit" @click="handleEdit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar Perfil
            </button>
            
            <button class="btn-action btn-logout" @click="handleLogout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </button>
          </div>

          <!-- Link Admin -->
          <div v-if="isAdmin" class="admin-quick-access">
            <h3 class="access-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Acesso Rápido de Administrador
            </h3>
            <div class="access-links">
              <router-link to="/admin/usuarios" class="access-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Gerenciar Usuários</span>
                <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </router-link>
              <router-link to="/admin/editais" class="access-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>Gerenciar Editais</span>
                <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </router-link>
              <router-link to="/admin/dashboard" class="access-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>Dashboard Admin</span>
                <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { logout } from '../services/api.js'
import { info } from '../utils/toast.js'

const router = useRouter()
const currentUser = ref(null)

const userName = computed(() => currentUser.value?.nome || currentUser.value?.email?.split('@')[0] || 'Usuário')
const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
})
const userEmail = computed(() => currentUser.value?.email || '')
const userRole = computed(() => currentUser.value?.role || 'user')
const userRoleLabel = computed(() => userRole.value === 'admin' ? 'Administrador' : 'Usuário')
const isAdmin = computed(() => userRole.value === 'admin')

const memberSince = computed(() => {
  if (!currentUser.value?.createdAt) return 'Data indisponível'
  const date = new Date(currentUser.value.createdAt)
  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  })
})

function handleEdit() {
  // Placeholder para futura implementação de edição
  alert('Funcionalidade de edição de perfil será implementada em breve!')
}

function handleLogout() {
  info('Sessão encerrada. Até logo!')
  logout()
  router.push('/login')
}

onMounted(() => {
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      currentUser.value = JSON.parse(stored)
    } catch {
      currentUser.value = null
    }
  }
})
</script>

<style scoped>
.profile-page {
  max-width: 720px;
  margin: 0 auto;
}

/* Card Principal */
.profile-card {
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-border);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* Banner */
.profile-banner {
  position: relative;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  padding: 2.5rem 2rem 3.5rem;
  text-align: center;
}

.profile-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  z-index: 1;
}

.avatar {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 3px solid white;
}

.avatar.is-admin {
  background: white;
}

.avatar-initials {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary-600);
}

.avatar.is-admin .avatar-initials {
  color: var(--color-primary-700);
}

.avatar-status {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background: var(--color-success-500);
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Body */
.profile-body {
  padding: 2rem;
}

/* Header Info */
.profile-header-info {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 0.375rem;
}

.profile-email {
  font-size: 0.9375rem;
  color: var(--color-gray-500);
  margin: 0 0 0.75rem;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 600;
  background: var(--color-surface-2);
  color: var(--color-gray-600);
  border: 1px solid var(--color-border);
}

.role-badge svg {
  width: 14px;
  height: 14px;
}

.role-badge.admin {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  border-color: var(--color-primary-100);
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.detail-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1.125rem;
  background: var(--color-surface-2);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.detail-icon {
  width: 40px;
  height: 40px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.detail-icon svg {
  width: 20px;
  height: 20px;
  color: var(--color-primary-600);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.detail-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-900);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-value.email-value {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
}

/* Ações */
.profile-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  padding: 0.875rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-action svg {
  width: 18px;
  height: 18px;
}

.btn-edit {
  background: var(--color-primary-600);
  color: var(--color-text-inverse);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-edit:hover {
  background: var(--color-primary-700);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
  transform: translateY(-1px);
}

.btn-logout {
  background: var(--color-surface-2);
  color: var(--color-gray-700);
  border: 1px solid var(--color-border);
}

.btn-logout:hover {
  background: var(--color-danger-50);
  color: var(--color-danger-600);
  border-color: var(--color-danger-100, #fecaca);
}

/* Admin Quick Access */
.admin-quick-access {
  background: var(--color-primary-50);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  border: 1px solid var(--color-primary-100);
}

.access-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary-800);
  margin: 0 0 1rem;
}

.access-title svg {
  width: 18px;
  height: 18px;
}

.access-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.access-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  color: var(--color-gray-700);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 150ms ease;
  border: 1px solid transparent;
}

.access-link svg:not(.arrow) {
  width: 18px;
  height: 18px;
  color: var(--color-primary-600);
  flex-shrink: 0;
}

.access-link .arrow {
  width: 16px;
  height: 16px;
  margin-left: auto;
  color: var(--color-gray-400);
  transition: transform 150ms ease, color 150ms ease;
}

.access-link:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-200);
  color: var(--color-primary-700);
}

.access-link:hover .arrow {
  transform: translateX(4px);
  color: var(--color-primary-600);
}

/* Responsivo */
@media (max-width: 640px) {
  .profile-page {
    padding: 0;
  }

  .profile-card {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .profile-banner {
    padding: 2rem 1.5rem 3rem;
  }

  .profile-body {
    padding: 1.5rem;
  }

  .profile-name {
    font-size: 1.25rem;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .profile-actions {
    flex-direction: column;
  }
}
</style>

