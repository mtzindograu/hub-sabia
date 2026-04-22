<template>
  <div class="dashboard-layout" :class="{ 'sidebar-mobile-open': isMobileMenuOpen }">
    <!-- Toast Notifications -->
    <ToastContainer />

    <!-- Backdrop for mobile -->
    <div v-if="isMobileMenuOpen" class="sidebar-backdrop" @click="isMobileMenuOpen = false"></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed, 'mobile-open': isMobileMenuOpen }">
      <div class="sidebar-header">
        <div class="header-top-wrapper">
          <div class="sidebar-logo">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <span v-show="!isCollapsed" class="logo-text">HubSabia</span>
          </div>
          
          <button class="collapse-btn hide-mobile" @click="toggleCollapse" :title="isCollapsed ? 'Expandir' : 'Recolher'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline :points="isCollapsed ? '9 18 15 12 9 6' : '11 17 6 12 11 7'" />
              <polyline points="18 17 13 12 18 7" v-if="!isCollapsed" />
            </svg>
          </button>

          <button class="btn-close-mobile show-mobile" @click="isMobileMenuOpen = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- User Info -->
      <div class="sidebar-user">
        <div class="user-avatar">{{ userInitials }}</div>
        <div v-show="!isCollapsed" class="user-info">
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
          @click="isMobileMenuOpen = false"
        >
          <div class="nav-icon" v-html="item.icon"></div>
          <span v-show="!isCollapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Logout -->
      <div class="sidebar-footer">
        <button class="nav-item logout-btn" @click="handleLogout">
          <div class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <span v-show="!isCollapsed" class="nav-label">Sair</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="top-header">
        <div class="header-left">
          <button class="menu-toggle-btn show-mobile" @click="isMobileMenuOpen = true" aria-label="Abrir menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <ThemeToggle />
          <router-link to="/" class="btn-ghost home-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span class="hide-small-mobile">Página Inicial</span>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { logout } from '../services/api.js'
import ToastContainer from '../components/ToastContainer.vue'
import ThemeToggle from '../components/ThemeToggle.vue'
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
const isMobileMenuOpen = ref(false)

const currentUser = ref(null)

const userName = computed(() => currentUser.value?.nome || currentUser.value?.email?.split('@')[0] || 'Usuário')
const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
})
const userRole = computed(() => currentUser.value?.role || 'user')
const userRoleLabel = computed(() => userRole.value === 'admin' ? 'Administrador' : 'Usuário')

const Icons = {
  Dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  Edital: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  Chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  Users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  Alunos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  Profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  Plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
}

const menuItems = computed(() => {
  const isAdmin = userRole.value === 'admin'
  return isAdmin ? [
    { path: '/admin/dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { path: '/admin/editais', label: 'Editais', icon: Icons.Edital },
    { path: '/admin/editais?upload=true', label: 'Novo Edital', icon: Icons.Plus },
    { path: '/admin/chat', label: 'Chat IA', icon: Icons.Chat },
    { path: '/admin/usuarios', label: 'Usuários', icon: Icons.Users },
    { path: '/admin/perfil', label: 'Meu Perfil', icon: Icons.Profile }
  ] : [
    { path: '/dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { path: '/editais', label: 'Editais', icon: Icons.Edital },
    { path: '/chat', label: 'Chat IA', icon: Icons.Chat },
    { path: '/chat-alunos', label: 'Chat Alunos', icon: Icons.Alunos },
    { path: '/perfil', label: 'Meu Perfil', icon: Icons.Profile }
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

watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})

onMounted(() => {
  loadUser()
})
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
  position: relative;
}

.sidebar {
  width: 260px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 1000;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
  min-height: 73px;
  display: flex;
  align-items: center;
}

.header-top-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.75rem;
}

.sidebar.collapsed .header-top-wrapper {
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: var(--color-primary-600);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
}

.logo-icon svg {
  width: 20px;
  height: 20px;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
}

.collapse-btn, .btn-close-mobile, .menu-toggle-btn {
  background: var(--color-surface-2);
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  color: var(--color-gray-500);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.collapse-btn:hover, .btn-close-mobile:hover, .menu-toggle-btn:hover {
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}

.collapse-btn svg, .btn-close-mobile svg, .menu-toggle-btn svg {
  width: 20px;
  height: 20px;
}

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.sidebar.collapsed .sidebar-user {
  justify-content: center;
  padding: 1.25rem 0.5rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar.collapsed .sidebar-nav {
  padding: 1rem 0.5rem;
  align-items: center;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
  width: 100%;
  overflow: hidden;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem 0;
  width: 48px;
  height: 48px;
}

.nav-item:hover {
  background: var(--color-surface-2);
  color: var(--color-primary-600);
}

.nav-item.active {
  background: var(--color-primary-50);
  color: var(--color-primary-600);
  font-weight: 600;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon :deep(svg), .nav-icon svg {
  width: 20px;
  height: 20px;
}

.sidebar-footer {
  padding: 1rem 0.75rem;
  border-top: 1px solid var(--color-border);
}

.sidebar.collapsed .sidebar-footer {
  padding: 1rem 0.5rem;
  display: flex;
  justify-content: center;
}

.logout-btn {
  color: var(--color-danger-500);
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
}

.sidebar.collapsed .logout-btn {
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
}

.logout-btn:hover {
  background: var(--color-danger-50);
  color: var(--color-danger-600);
}

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
  padding: 1rem 2rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  min-height: 73px;
  position: sticky;
  top: 0;
  z-index: 900;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-ghost {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-ghost:hover {
  background: var(--color-surface-2);
  color: var(--color-primary-600);
}

.page-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 990;
}

.show-mobile { display: none; }

@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
    width: 280px;
  }
  
  .sidebar.mobile-open .logo-text,
  .sidebar.mobile-open .user-info,
  .sidebar.mobile-open .nav-label {
    display: inline;
  }

  .show-mobile { display: flex; }
  .hide-mobile { display: none; }
  
  .top-header {
    padding: 1rem;
  }
  
  .page-content {
    padding: 1.5rem 1rem;
  }
}

@media (max-width: 640px) {
  .hide-small-mobile { display: none; }
  
  .home-btn {
    padding: 0.5rem;
  }
  
  .page-title {
    font-size: 1.125rem;
    max-width: 150px;
  }
}
</style>
