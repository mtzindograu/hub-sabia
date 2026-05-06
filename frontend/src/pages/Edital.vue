<template>
  <div class="edital-page-wrapper">
    <!-- Navigation Header -->
    <header class="home-header">
      <div class="header-inner">
        <router-link to="/" class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <span class="logo-text">HubSabia</span>
        </router-link>
        <nav class="header-nav">
          <router-link to="/" class="nav-link">Recursos</router-link>
          <router-link to="/editais" class="nav-link">Editais</router-link>
          <router-link to="/chat" class="nav-link">Chat IA</router-link>
          <ThemeToggle />
          <!-- Logged in action -->
          <template v-if="isLoggedIn">
            <router-link :to="userRole === 'admin' ? '/admin/dashboard' : '/dashboard'" class="btn btn-primary btn-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              Dashboard
            </router-link>
          </template>
          <!-- Guest actions -->
          <template v-else>
            <router-link to="/login" class="btn btn-ghost">Entrar</router-link>
            <router-link to="/login?tab=register" class="btn btn-primary btn-sm">Criar Conta</router-link>
          </template>
        </nav>
        <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <div class="mobile-menu-header">
          <ThemeToggle />
          <button class="close-menu" @click="mobileMenuOpen = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <router-link to="/" class="mobile-nav-link" @click="mobileMenuOpen = false">Recursos</router-link>
        <router-link to="/editais" class="mobile-nav-link" @click="mobileMenuOpen = false">Editais</router-link>
        <router-link to="/chat" class="mobile-nav-link" @click="mobileMenuOpen = false">Chat IA</router-link>
        
        <template v-if="isLoggedIn">
          <router-link :to="userRole === 'admin' ? '/admin/dashboard' : '/dashboard'" class="btn btn-primary btn-block" @click="mobileMenuOpen = false">
            Dashboard
          </router-link>
        </template>
        <template v-else>
          <router-link to="/login" class="mobile-nav-link" @click="mobileMenuOpen = false">Entrar</router-link>
          <router-link to="/login?tab=register" class="btn btn-primary btn-block" @click="mobileMenuOpen = false">Criar Conta</router-link>
        </template>
      </div>
    </header>

    <div class="edital-page">
      <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner large"></div>
      <p>Carregando edital...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-content">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <h3>Ops! Edital não encontrado</h3>
        <p>{{ error }}</p>
        <router-link to="/" class="btn btn-primary">Voltar ao Início</router-link>
      </div>
    </div>

    <!-- Edital Content -->
    <template v-else-if="edital">
      <div class="content-wrapper animate-in">
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <router-link to="/">Início</router-link>
          <span class="separator">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </span>
          <span class="current">{{ edital.titulo }}</span>
        </nav>

        <!-- Main Header Card -->
        <header class="edital-hero">
          <div class="hero-main">
            <div class="hero-label">
              <span class="badge badge-primary">{{ edital.ano }}</span>
              <span class="type-tag">Documento Oficial</span>
            </div>
            <h1 class="edital-title">{{ edital.titulo }}</h1>
            
            <div class="hero-stats">
              <div class="stat-item">
                <div class="stat-icon-bg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ edital.ragStats?.totalChunks || 0 }}</span>
                  <span class="stat-label">Trechos</span>
                </div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="stat-icon-bg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ formatDateShort(edital.createdAt) }}</span>
                  <span class="stat-label">Adicionado</span>
                </div>
              </div>
            </div>
          </div>

          <div class="hero-actions">
            <router-link :to="`/chat/${edital._id || edital.id}`" class="btn btn-chat-hero">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Analisar com IA
            </router-link>
            <a v-if="edital.arquivo_url" :href="edital.arquivo_url" target="_blank" class="btn btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Ver PDF
            </a>
          </div>
        </header>

        <div class="layout-grid">
          <!-- Left Column: Main Info -->
          <div class="main-column">
            <!-- Objetivo -->
            <section v-if="edital.objetivo_principal" class="content-section" style="--delay: 1">
              <div class="section-header">
                <div class="section-icon-bg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
                <h2>Objetivo</h2>
              </div>
              <div class="objetivo-card">
                <p>{{ edital.objetivo_principal }}</p>
              </div>
            </section>

            <!-- Requisitos -->
            <section v-if="edital.requisitos && edital.requisitos.length > 0" class="content-section" style="--delay: 2">
              <div class="section-header">
                <div class="section-icon-bg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2>Requisitos</h2>
              </div>
              <ul class="clean-list">
                <li v-for="(req, i) in edital.requisitos" :key="i" class="list-item">
                  <span class="bullet"></span>
                  <p>{{ req }}</p>
                </li>
              </ul>
            </section>

            <!-- Etapas -->
            <section v-if="edital.etapas && edital.etapas.length > 0" class="content-section" style="--delay: 3">
              <div class="section-header">
                <div class="section-icon-bg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="13 17 18 12 13 7"/>
                    <polyline points="6 17 11 12 6 7"/>
                  </svg>
                </div>
                <h2>Etapas do Processo</h2>
              </div>
              <div class="steps-container">
                <div v-for="(etapa, i) in edital.etapas" :key="i" class="step-card-modern">
                  <div class="step-num">{{ i + 1 }}</div>
                  <div class="step-desc">{{ etapa }}</div>
                </div>
              </div>
            </section>

            <!-- Documentos Necessários -->
            <section v-if="edital.documentos_necessarios && edital.documentos_necessarios.length > 0" class="content-section" style="--delay: 7">
              <div class="section-header">
                <div class="section-icon-bg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <h2>Documentos Necessários</h2>
              </div>
              <ul class="clean-list">
                <li v-for="(doc, i) in edital.documentos_necessarios" :key="i" class="list-item">
                  <span class="bullet"></span>
                  <p>{{ doc }}</p>
                </li>
              </ul>
            </section>
          </div>

          <!-- Right Column: Sidebar Info -->
          <aside class="sidebar-column">
            <!-- Prazos -->
            <section v-if="edital.prazos_importantes && edital.prazos_importantes.length > 0" class="sidebar-section" style="--delay: 4">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Cronograma
              </h3>
              <div class="deadlines-modern">
                <div v-for="(prazo, i) in edital.prazos_importantes" :key="i" class="deadline-pill">
                  {{ prazo }}
                </div>
              </div>
            </section>

            <!-- Info Cards Sidebar -->
            <div class="mini-info-stack" style="--delay: 5">
              <div v-if="edital.inscricoes_periodo" class="mini-card">
                <label>Inscrições</label>
                <p>{{ edital.inscricoes_periodo }}</p>
              </div>
              <div v-if="edital.vagas" class="mini-card">
                <label>Vagas</label>
                <p>{{ edital.vagas }}</p>
              </div>
              <div v-if="edital.publico_alvo" class="mini-card">
                <label>Público</label>
                <p>{{ edital.publico_alvo }}</p>
              </div>
              <div v-if="edital.contatos" class="mini-card">
                <label>Contatos</label>
                <p class="contacts-text">{{ edital.contatos }}</p>
              </div>
            </div>

            <!-- Tags -->
            <section v-if="edital.palavras_chave?.length" class="sidebar-section" style="--delay: 6">
              <h3>Assuntos</h3>
              <div class="keyword-cloud">
                <span v-for="tag in edital.palavras_chave" :key="tag" class="chip">
                  {{ tag }}
                </span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </template>
  </div>
</div>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getEdital } from '../services/api.js'
import ThemeToggle from '../components/ThemeToggle.vue'

const route = useRoute()

const edital = ref(null)
const loading = ref(true)
const error = ref('')
const mobileMenuOpen = ref(false)
const isLoggedIn = ref(false)
const userRole = ref('user')

async function loadEdital() {
  try {
    loading.value = true
    error.value = ''
    const id = route.params.id
    console.log('[Edital] Carregando edital ID:', id)
    const response = await getEdital(id)
    edital.value = normalizeEdital(response.data)
  } catch (err) {
    console.error('[Edital] Erro ao carregar:', err)
    error.value = err.message || 'Erro ao carregar edital'
  } finally {
    loading.value = false
  }
}

function checkLoginStatus() {
  const stored = localStorage.getItem('user')
  const token = localStorage.getItem('auth_token')
  if (stored && token) {
    try {
      const user = JSON.parse(stored)
      isLoggedIn.value = true
      userRole.value = user.role || 'user'
    } catch {
      isLoggedIn.value = false
    }
  }
}

function normalizeEdital(data) {
  return {
    ...data,
    requisitos: normalizeStringArray(data.requisitos),
    etapas: normalizeStringArray(data.etapas),
    documentos_necessarios: normalizeStringArray(data.documentos_necessarios),
    prazos_importantes: normalizeStringArray(data.prazos_importantes),
    palavras_chave: Array.isArray(data.palavras_chave) ? data.palavras_chave : [],
    contatos: formatContatos(data.contatos),
  }
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) return value.filter(item => item && item.trim())
  if (typeof value === 'string' && value.trim()) {
    return value.split('\n').map(s => s.trim()).filter(s => s.length > 0)
  }
  return []
}

function formatContatos(value) {
  if (!value) return ''
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join('\n')
    }
    return String(value)
  } catch {
    return value
  }
}

function formatDateShort(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

watch(() => route.params.id, loadEdital)
onMounted(() => {
  checkLoginStatus()
  loadEdital()
})
</script>

<style scoped>
.edital-page-wrapper {
  min-height: 100vh;
  background: var(--color-bg);
}

/* ====== HEADER (Copied from Home.vue for consistency) ====== */
.home-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.875rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--color-primary-600);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon svg {
  width: 20px;
  height: 20px;
  color: white;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: var(--color-gray-600);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color var(--transition-fast);
}

.nav-link:hover {
  color: var(--color-gray-900);
}

.btn-ghost {
  background: none;
  color: var(--color-gray-700);
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

.btn-ghost:hover {
  background: var(--color-surface-2);
  color: var(--color-gray-900);
}

.btn-sm {
  padding: 0.5rem 1.125rem;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.btn-sm svg {
  width: 16px;
  height: 16px;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--color-gray-600);
}

.mobile-menu-btn svg {
  width: 24px;
  height: 24px;
}

.mobile-menu {
  display: none;
  flex-direction: column;
  padding: 1rem 2rem 1.5rem;
  border-top: 1px solid var(--color-border);
  gap: 0.75rem;
  background: var(--color-surface);
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0.5rem;
}

.close-menu {
  background: none;
  border: none;
  color: var(--color-gray-500);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-nav-link {
  display: block;
  padding: 0.75rem 0;
  color: var(--color-gray-700);
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  border-bottom: 1px solid var(--color-border);
}

.mobile-nav-link:last-child {
  border-bottom: none;
}

.btn-block {
  display: block;
  text-align: center;
  text-decoration: none;
}

@media (max-width: 768px) {
  .header-nav {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-menu {
    display: flex;
  }
}

/* PAGE CONTENT */
.edital-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 5rem;
}

/* Animations */
.animate-in {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.content-section, .sidebar-section, .mini-info-stack {
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
  animation-delay: calc(var(--delay) * 0.1s + 0.3s);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Loading & States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--color-text-muted);
}

.error-state {
  display: flex;
  justify-content: center;
  padding: 5rem 1rem;
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  width: 64px;
  height: 64px;
  color: var(--color-danger-500);
  margin-bottom: 1.5rem;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.breadcrumb a {
  color: var(--color-text-muted);
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb a:hover {
  color: var(--color-primary-600);
}

.breadcrumb .separator {
  display: flex;
  align-items: center;
}

.breadcrumb .separator svg {
  width: 12px;
  height: 12px;
  opacity: 0.5;
}

.breadcrumb .current {
  color: var(--color-text);
  font-weight: 600;
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Hero Section */
.edital-hero {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.edital-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--color-primary-500);
}

.hero-main {
  flex: 1;
}

.hero-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.type-tag {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.edital-title {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.2;
  color: var(--color-text);
  margin-bottom: 1.5rem;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-icon-bg {
  width: 36px;
  height: 36px;
  background: var(--color-surface-2);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-600);
}

.stat-icon-bg svg {
  width: 18px;
  height: 18px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: var(--color-border);
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 200px;
}

.btn-chat-hero {
  background: var(--color-primary-600);
  color: white;
  padding: 1rem 1.5rem;
  font-weight: 700;
  box-shadow: var(--shadow-primary);
}

.btn-chat-hero:hover {
  background: var(--color-primary-700);
  transform: translateY(-2px);
}

/* Layout Grid */
.layout-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 3rem;
}

/* Content Sections */
.content-section {
  margin-bottom: 3.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.section-icon-bg {
  width: 32px;
  height: 32px;
  background: var(--color-primary-50);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-600);
}

.section-icon-bg svg {
  width: 16px;
  height: 16px;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text);
}

.objetivo-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.75rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
  font-size: 1.0625rem;
}

.clean-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.list-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.bullet {
  width: 6px;
  height: 6px;
  background: var(--color-primary-500);
  border-radius: 50%;
  margin-top: 0.625rem;
  flex-shrink: 0;
}

.list-item p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

/* Steps */
.steps-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.step-card-modern {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.2s;
}

.step-card-modern:hover {
  border-color: var(--color-primary-300);
  transform: translateX(4px);
}

.step-num {
  width: 32px;
  height: 32px;
  background: var(--color-primary-600);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.step-desc {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
}

/* Sidebar Sections */
.sidebar-section {
  margin-bottom: 2.5rem;
}

.sidebar-section h3 {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sidebar-section h3 svg {
  width: 14px;
  height: 14px;
}

.deadlines-modern {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.deadline-pill {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 0.875rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
}

.mini-info-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.mini-card {
  background: var(--color-surface-2);
  padding: 1.25rem;
  border-radius: var(--radius-lg);
}

.mini-card label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 0.375rem;
}

.mini-card p {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
}

.contacts-text {
  white-space: pre-wrap;
  word-break: break-all;
}

.keyword-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.chip:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-300);
  color: var(--color-primary-700);
}

/* Responsive */
@media (max-width: 900px) {
  .layout-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .sidebar-column {
    order: -1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  
  .sidebar-section, .mini-info-stack {
    margin-bottom: 0;
  }
}

@media (max-width: 768px) {
  .edital-hero {
    flex-direction: column;
    padding: 2rem;
    align-items: flex-start;
  }
  
  .hero-actions {
    width: 100%;
  }
  
  .edital-title {
    font-size: 1.75rem;
  }
  
  .sidebar-column {
    grid-template-columns: 1fr;
  }
}
</style>
