<template>
  <div class="dashboard-layout">
    <!-- Toast Notifications -->
    <ToastContainer />

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          <span v-if="!isCollapsed" class="logo-text">HubSabia</span>
        </div>
        <button class="collapse-btn" @click="toggleCollapse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline :points="isCollapsed ? '13 17 18 12 13 7' : '11 17 6 12 11 7'" />
            <polyline :points="isCollapsed ? '6 17 11 12 6 7' : ''" v-if="!isCollapsed" />
          </svg>
        </button>
      </div>

      <!-- User Info -->
      <div class="sidebar-user">
        <div class="user-avatar">{{ userInitials }}</div>
        <div v-if="!isCollapsed" class="user-info">
          <span class="user-name">{{ userName }}</span>
          <span class="user-role" :class="userRole">{{ userRoleLabel }}</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <component :is="item.icon" class="nav-icon" />
          <span v-if="!isCollapsed">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Logout -->
      <div class="sidebar-footer">
        <button class="nav-item logout-btn" @click="handleLogout">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span v-if="!isCollapsed">Sair</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="top-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <router-link to="/" class="btn-ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Página Inicial</span>
          </router-link>
        </div>
      </header>
      <div class="page-content">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { logout } from '../services/api.js'
import ToastContainer from '../components/ToastContainer.vue'
import { info } from '../utils/toast.js'

const props = defineProps({
  pageTitle: {
    type: String,
    default: 'Dashboard'
  }
})

const router = useRouter()
const route = useRoute()
const isCollapsed = ref(false)

// User info
const currentUser = ref(null)

const userName = computed(() => currentUser.value?.nome || currentUser.value?.email?.split('@')[0] || 'Usuário')
const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
})
const userRole = computed(() => currentUser.value?.role || 'user')
const userRoleLabel = computed(() => userRole.value === 'admin' ? 'Administrador' : 'Usuário')

// Menu items based on role
const menuItems = computed(() => {
  const isAdmin = userRole.value === 'admin'

  if (isAdmin) {
    return [
      {
        path: '/admin/dashboard',
        label: 'Dashboard',
        icon: Icons.Dashboard
      },
      {
        path: '/admin/editais',
        label: 'Editais',
        icon: Icons.Edital
      },
      {
        path: '/admin/chat',
        label: 'Chat IA',
        icon: Icons.Chat
      },
      {
        path: '/admin/usuarios',
        label: 'Usuários',
        icon: Icons.Users
      },
      {
        path: '/admin/perfil',
        label: 'Meu Perfil',
        icon: Icons.Profile
      }
    ]
  }

  return [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: Icons.Dashboard
    },
    {
      path: '/editais',
      label: 'Editais',
      icon: Icons.Edital
    },
    {
      path: '/chat',
      label: 'Chat IA',
      icon: Icons.Chat
    },
    {
      path: '/chat-alunos',
      label: 'Chat Alunos',
      icon: Icons.Alunos
    },
    {
      path: '/perfil',
      label: 'Meu Perfil',
      icon: Icons.Profile
    }
  ]
})

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function handleLogout() {
  info('Sessão encerrada. Até logo!')
  logout()
  router.push('/login')
}

function loadUser() {
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      currentUser.value = JSON.parse(stored)
    } catch {
      currentUser.value = null
    }
  }
}

onMounted(() => {
  loadUser()
})

// Icons as components
const Icons = {
  Dashboard: {
    template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>`
  },
  Edital: {
    template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>`
  },
  Chat: {
    template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`
  },
  Users: {
    template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`
  },
  Alunos: {
    template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`
  },
  Profile: {
    template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`
  }
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: calc(100vh - 64px);
  background: var(--color-bg);
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-slow);
  position: sticky;
  top: 64px;
  height: calc(100vh - 64px);
  overflow-y: auto;
  box-shadow: var(--shadow-sm);
}

.sidebar.collapsed {
  width: 72px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sidebar-logo svg {
  width: 28px;
  height: 28px;
  color: var(--color-primary-600);
  flex-shrink: 0;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: var(--radius-md);
  color: var(--color-gray-500);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: var(--color-surface-2);
  color: var(--color-gray-700);
}

.collapse-btn svg {
  width: 18px;
  height: 18px;
}

/* User Info */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-inverse);
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-primary);
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.user-role.admin {
  color: var(--color-primary-600);
  font-weight: 500;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  color: var(--color-gray-600);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all var(--transition-fast);
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: var(--color-surface-2);
  color: var(--color-gray-900);
}

.nav-item.active {
  background: var(--color-primary-50);
  color: var(--color-primary-600);
  font-weight: 600;
}

.nav-item.active:hover {
  background: var(--color-primary-100);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Logout */
.sidebar-footer {
  padding: 0.75rem 0.5rem;
  border-top: 1px solid var(--color-border);
}

.logout-btn {
  color: var(--color-danger-500);
}

.logout-btn:hover {
  background: var(--color-danger-50);
  color: var(--color-danger-600);
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0;
}

.header-right {
  display: flex;
  gap: 0.75rem;
}

.btn-ghost {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  color: var(--color-gray-500);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.btn-ghost:hover {
  background: var(--color-surface-2);
  color: var(--color-gray-700);
}

.btn-ghost svg {
  width: 18px;
  height: 18px;
}

/* Page Content */
.page-content {
  flex: 1;
  padding: 2rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform var(--transition-slow);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }
}

@media (max-width: 640px) {
  .top-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .page-content {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.25rem;
  }
}
</style>
