/**
 * HubSabia Frontend Entry Point
 * Vue 3 Application with Router
 */

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// Import styles
import './assets/main.css'

// Route definitions
const routes = [
  // === PUBLIC ===
  {
    path: '/',
    name: 'Home',
    component: () => import('./pages/Home.vue')
  },
  {
    path: '/editais',
    name: 'Editais',
    component: () => import('./pages/EditaisPage.vue')
  },
  {
    path: '/edital/:id',
    name: 'Edital',
    component: () => import('./pages/Edital.vue')
  },
  {
    path: '/chat/:id?',
    name: 'Chat',
    component: () => import('./pages/ChatLayout.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('./pages/Login.vue'),
    meta: { guest: true }
  },

  // === USER DASHBOARD ===
  {
    path: '/dashboard',
    name: 'UserDashboard',
    component: () => import('./pages/dashboard/UserDashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/editais',
    name: 'UserEditais',
    component: () => import('./pages/dashboard/UserEditais.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat-alunos',
    name: 'AlunosChat',
    component: () => import('./pages/AlunosChat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/perfil',
    name: 'UserProfile',
    component: () => import('./pages/ProfilePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard/editais/:id',
    name: 'EditalView',
    component: () => import('./pages/dashboard/EditalView.vue'),
    meta: { requiresAuth: true }
  },

  // === ADMIN ===
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('./pages/admin/AdminDashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/editais',
    name: 'AdminEditais',
    component: () => import('./pages/dashboard/UserEditais.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/editais/:id',
    name: 'AdminEditalView',
    component: () => import('./pages/dashboard/EditalView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/chat',
    name: 'AdminChat',
    component: () => import('./pages/ChatLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/usuarios',
    name: 'AdminUsers',
    component: () => import('./pages/admin/UsersPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/logs',
    name: 'AdminLogs',
    component: () => import('./pages/admin/ChatLogsPage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/perfil',
    name: 'AdminProfile',
    component: () => import('./pages/ProfilePage.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // Always scroll to top with smooth behavior
    return { top: 0, behavior: 'smooth' }
  }
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token')
  const storedUser = localStorage.getItem('user')
  let user = null

  if (storedUser) {
    try {
      user = JSON.parse(storedUser)
    } catch {
      user = null
    }
  }

  const isAuthenticated = !!token && !!user
  const isAdmin = user?.role === 'admin'

  // Rotas para guests (login) - redireciona para dashboard se já logado
  if (to.meta.guest && isAuthenticated) {
    if (isAdmin) {
      return next('/admin/dashboard')
    }
    return next('/dashboard')
  }

  // Rotas que requerem autenticação (dashboards)
  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      return next('/login')
    }

    // Rotas exclusivas de admin
    if (to.meta.requiresAdmin && !isAdmin) {
      return next('/dashboard')
    }

    // Se admin tentar acessar rota de user dashboard, redireciona
    if (to.path === '/dashboard' && isAdmin) {
      return next('/admin/dashboard')
    }
  }

  // Rotas públicas (/, /editais, /chat, /edital/:id, /login) são acessíveis a todos
  next()
})

// Create and mount app
const app = createApp(App)
app.use(router)
app.mount('#app')
""  
