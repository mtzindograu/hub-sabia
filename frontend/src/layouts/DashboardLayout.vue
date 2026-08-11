<template>
  <div
    class="dashboard-layout"
    :class="{ 'sidebar-collapsed': isCollapsed, 'sidebar-mobile-open': isMobileMenuOpen }"
  >
    <!-- ToastContainer vive APENAS no App.vue (evita toasts duplicados) -->

    <!-- Backdrop for mobile -->
    <div
      v-if="isMobileMenuOpen"
      class="sidebar-backdrop"
      @click="isMobileMenuOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      class="sidebar"
      :class="{ collapsed: isCollapsed, 'mobile-open': isMobileMenuOpen }"
    >
      <div class="sidebar-header">
        <div class="header-top-wrapper">
          <div class="sidebar-logo">
            <div class="logo-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span v-show="!isCollapsed" class="logo-text">HubSabia</span>
          </div>

          <button
            class="collapse-btn hide-mobile"
            @click="toggleCollapse"
            :title="isCollapsed ? 'Expandir' : 'Recolher'"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline
                :points="isCollapsed ? '9 18 15 12 9 6' : '11 17 6 12 11 7'"
              />
              <polyline points="18 17 13 12 18 7" v-if="!isCollapsed" />
            </svg>
          </button>

          <button
            class="btn-close-mobile show-mobile"
            @click="isMobileMenuOpen = false"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
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
          <span class="user-role" :class="userRole">{{ userRoleLabel }}</span>
          <span class="user-name">{{ userName }}</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav" aria-label="Navegação principal">
        <template v-for="item in menuItems" :key="item.key || item.path">
          <div v-if="item.children" class="nav-group">
            <router-link
              :to="item.path"
              class="nav-item nav-group-link"
              :class="{ active: isActive(item.path, true) }"
              @click="isMobileMenuOpen = false"
            >
              <div class="nav-icon" v-html="item.icon"></div>
              <span v-show="!isCollapsed" class="nav-label">{{ item.label }}</span>
              <svg v-show="!isCollapsed" class="nav-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </router-link>
            <div v-if="!isCollapsed" class="nav-subitems">
              <router-link
                v-for="child in item.children"
                :key="child.path"
                :to="child.path"
                class="nav-subitem"
                :class="{ active: isActive(child.path) }"
                @click="isMobileMenuOpen = false"
              >
                <span class="nav-sub-indicator" aria-hidden="true"></span>
                <span class="nav-sub-label">{{ child.label }}</span>
              </router-link>
            </div>
          </div>
          <router-link
            v-else
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            @click="isMobileMenuOpen = false"
          >
            <div class="nav-icon" v-html="item.icon"></div>
            <span v-show="!isCollapsed" class="nav-label">{{ item.label }}</span>
          </router-link>
        </template>
      </nav>

      <!-- Logout -->
      <div class="sidebar-footer">
        <button class="nav-item logout-btn" @click="handleLogout">
          <div class="nav-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
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
          <button
            class="menu-toggle-btn show-mobile"
            @click="isMobileMenuOpen = true"
            aria-label="Abrir menu"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              width="18"
              height="18"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
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
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { logout } from "../services/api.js";
import ThemeToggle from "../components/ThemeToggle.vue";
import { info } from "../utils/toast.js";

const props = defineProps({
  pageTitle: {
    type: String,
    default: "Dashboard",
  },
});

const router = useRouter();
const route = useRoute();
const isCollapsed = ref(false);
const isMobileMenuOpen = ref(false);

const currentUser = ref(null);

const userName = computed(
  () =>
    currentUser.value?.nome ||
    currentUser.value?.email?.split("@")[0] ||
    "Usuário",
);
const userInitials = computed(() => {
  const name = userName.value;
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
});
const userRole = computed(() => currentUser.value?.role || "user");
const userRoleLabel = computed(() =>
  userRole.value === "admin" ? "Administrador" : "Usuário",
);

const Icons = {
  Dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  Edital: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  Chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  Users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  Alunos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  Profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  Plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
};

const menuItems = computed(() => {
  const isAdmin = userRole.value === "admin";
  return isAdmin
    ? [
        { key: "admin-dashboard", path: "/admin/dashboard", label: "Dashboard", icon: Icons.Dashboard },
        {
          key: "admin-editais",
          path: "/admin/editais",
          label: "Editais",
          icon: Icons.Edital,
          children: [
            { path: "/admin/editais", label: "Listar editais" },
            { path: "/admin/editais?upload=true", label: "Novo edital" },
          ],
        },
        { key: "admin-chat", path: "/admin/chat", label: "Chat IA", icon: Icons.Chat },
        { key: "admin-users", path: "/admin/usuarios", label: "Usuários", icon: Icons.Users },
        { key: "admin-profile", path: "/admin/perfil", label: "Meu Perfil", icon: Icons.Profile },
      ]
    : [
        { key: "dashboard", path: "/dashboard", label: "Dashboard", icon: Icons.Dashboard },
        { key: "editais", path: "/dashboard/editais", label: "Editais", icon: Icons.Edital },
        { key: "chat", path: "/chat", label: "Chat IA", icon: Icons.Chat },
        { key: "alunos", path: "/chat-alunos", label: "Chat Alunos", icon: Icons.Alunos },
        { key: "profile", path: "/perfil", label: "Meu Perfil", icon: Icons.Profile },
      ];
});

function isActive(path, isGroup = false) {
  const [pathname, queryString] = path.split("?");
  const isExact = route.path === pathname;
  const isDescendant = route.path.startsWith(pathname + "/");

  // Itens "raiz" que são prefixo de sub-rotas de OUTROS itens (ex.: /dashboard vs
  // /dashboard/editais) só ativam no match exato. Grupos (com filhos) e rotas com
  // :id (ex.: /chat/:id) seguem o prefixo normalmente.
  const exactOnly = !isGroup && (pathname === "/dashboard" || pathname === "/admin/dashboard");
  if (!isExact && (exactOnly || !isDescendant)) return false;

  if (queryString) {
    const expected = new URLSearchParams(queryString);
    return [...expected.entries()].every(([key, value]) => route.query[key] === value);
  }
  if (!isGroup && pathname === "/admin/editais" && route.query.upload === "true") return false;
  return true;
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

function handleLogout() {
  info("Sessão encerrada. Até logo!");
  logout();
  router.push("/login");
}

function loadUser() {
  const stored = localStorage.getItem("user");
  if (stored) {
    try {
      currentUser.value = JSON.parse(stored);
    } catch {
      currentUser.value = null;
    }
  }
}

watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false;
  },
);

onMounted(() => {
  loadUser();
});
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  position: relative;
  background: var(--color-bg);
  color: var(--color-text);
}

.sidebar {
  width: 264px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: width var(--transition-slow), transform var(--transition-slow);
}

.sidebar.collapsed { width: 80px; }

.sidebar-header {
  min-height: 76px;
  display: flex;
  align-items: center;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.header-top-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.sidebar.collapsed .header-top-wrapper {
  flex-direction: column;
  justify-content: center;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
}

.logo-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: var(--radius-lg);
  background: var(--color-primary-600);
  color: var(--color-text-inverse);
}

.logo-icon svg { width: 20px; height: 20px; }

.logo-text {
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.collapse-btn,
.btn-close-mobile,
.menu-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.5rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.collapse-btn:hover,
.btn-close-mobile:hover,
.menu-toggle-btn:hover {
  border-color: var(--color-primary-200);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}

.collapse-btn svg,
.btn-close-mobile svg,
.menu-toggle-btn svg { width: 20px; height: 20px; }

.sidebar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem;
  border-bottom: 1px solid var(--color-border);
}

.sidebar.collapsed .sidebar-user { justify-content: center; padding-inline: 0.5rem; }

.user-avatar {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: var(--color-primary-600);
  color: var(--color-text-inverse);
  font-size: 0.8125rem;
  font-weight: 700;
}

.user-info { min-width: 0; display: flex; flex-direction: column; }
.user-name { overflow: hidden; color: var(--color-text); font-size: 0.875rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.user-role { color: var(--color-text-muted); font-size: 0.75rem; }

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 0.75rem;
}

.sidebar.collapsed .sidebar-nav { align-items: center; padding-inline: 0.5rem; }

.nav-group { width: 100%; }

.nav-item,
.nav-subitem {
  width: 100%;
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}

.nav-item {
  gap: 0.75rem;
  min-height: 46px;
  padding: 0.7rem 1rem;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
}

.nav-item:hover,
.nav-subitem:hover {
  background: var(--color-surface-2);
  color: var(--color-primary-700);
  transform: translateY(-1px);
}

.nav-item.active {
  border-color: var(--color-primary-200);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.nav-icon :deep(svg), .nav-icon svg { width: 20px; height: 20px; }
.nav-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nav-group-link { justify-content: flex-start; }
.nav-group-chevron { width: 16px; height: 16px; margin-left: auto; color: var(--color-text-muted); }

.nav-subitems {
  margin: 0.25rem 0 0.35rem 1.25rem;
  padding-left: 0.8rem;
  border-left: 1px solid var(--color-border);
}

.nav-subitem {
  gap: 0.6rem;
  min-height: 34px;
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
}

.nav-subitem.active { background: var(--color-primary-50); color: var(--color-primary-700); }
.nav-sub-indicator { width: 5px; height: 5px; flex-shrink: 0; border-radius: var(--radius-full); background: currentColor; opacity: 0.45; }
.nav-subitem.active .nav-sub-indicator { opacity: 1; }

.sidebar.collapsed .nav-item { width: 48px; height: 48px; justify-content: center; padding-inline: 0; }

.sidebar-footer {
  padding: 1rem 0.75rem;
  border-top: 1px solid var(--color-border);
}

.sidebar.collapsed .sidebar-footer { padding-inline: 0.5rem; }
.logout-btn { border: 1px solid transparent; background: transparent; color: var(--color-danger-500); cursor: pointer; }
.logout-btn:hover { background: var(--color-danger-50); color: var(--color-danger-600); }

.main-content { min-width: 0; flex: 1; display: flex; flex-direction: column; margin-left: 264px; transition: margin-left var(--transition-slow); }
.dashboard-layout.sidebar-collapsed .main-content { margin-left: 80px; }

.top-header {
  min-height: 76px;
  position: sticky;
  top: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 2rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-left, .header-right { display: flex; align-items: center; gap: 1rem; }
.header-right { gap: 0.5rem; }
.page-title { margin: 0; overflow: hidden; color: var(--color-text); font-family: var(--font-display); font-size: 1.45rem; font-weight: 600; letter-spacing: -0.02em; text-overflow: ellipsis; white-space: nowrap; }

.btn-ghost {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.8rem;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
}

.btn-ghost:hover { background: var(--color-surface-2); color: var(--color-primary-700); }
.page-content { flex: 1; min-width: 0; padding: 2rem; overflow-y: auto; }
.sidebar-backdrop { position: fixed; inset: 0; z-index: 990; background: rgb(0, 0, 0); opacity: 0.55; }
.show-mobile { display: none; }

@media (max-width: 1024px) {
  .sidebar { position: fixed; transform: translateX(-100%); }
  .sidebar.mobile-open { width: 280px; transform: translateX(0); }
  .main-content, .dashboard-layout.sidebar-collapsed .main-content { margin-left: 0; }
  .show-mobile { display: flex; }
  .hide-mobile { display: none; }
  .top-header { padding-inline: 1rem; }
  .page-content { padding: 1.5rem 1rem; }
}

@media (max-width: 640px) {
  .hide-small-mobile { display: none; }
  .home-btn { padding: 0.5rem; }
  .page-title { max-width: 150px; font-size: 1.2rem; }
}
</style>
