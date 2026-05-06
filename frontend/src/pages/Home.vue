<template>
  <div class="home-page">
    <!-- Header -->
    <header class="home-header">
      <div class="header-inner">
        <div class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <span class="logo-text">HubSabia</span>
        </div>
        <nav class="header-nav">
          <a href="#recursos" class="nav-link">Recursos</a>
          <a href="#editais" class="nav-link">Editais</a>
          <router-link to="/chat" class="nav-link">Chat IA</router-link>
          <ThemeToggle />
          <!-- Se logado: mostra Dashboard -->
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
          <!-- Se não logado: mostra Entrar/Criar Conta -->
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
        <a href="#recursos" class="mobile-nav-link" @click="mobileMenuOpen = false">Recursos</a>
        <a href="#editais" class="mobile-nav-link" @click="mobileMenuOpen = false">Editais</a>
        <router-link to="/chat" class="mobile-nav-link" @click="mobileMenuOpen = false">Chat IA</router-link>
        
        <!-- Se logado: mostra Dashboard -->
        <template v-if="isLoggedIn">
          <router-link :to="userRole === 'admin' ? '/admin/dashboard' : '/dashboard'" class="btn btn-primary btn-block" @click="mobileMenuOpen = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </router-link>
        </template>
        <!-- Se não logado: mostra Entrar/Criar Conta -->
        <template v-else>
          <router-link to="/login" class="mobile-nav-link" @click="mobileMenuOpen = false">Entrar</router-link>
          <router-link to="/login?tab=register" class="btn btn-primary btn-block" @click="mobileMenuOpen = false">Criar Conta</router-link>
        </template>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg-pattern"></div>
      <div class="hero-content">
        <h1 class="hero-title">
          Encontre oportunidades e<br class="hide-mobile" />
          <span class="text-gradient">editais com facilidade</span>
        </h1>
        <p class="hero-subtitle">
          Use inteligência artificial para entender editais de concursos, bolsas e processos seletivos. 
          Faça perguntas e obtenha respostas claras e precisas.
        </p>
        <div class="hero-actions">
          <router-link to="/editais" class="btn btn-primary btn-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            Explorar Editais
          </router-link>
          <router-link to="/chat" class="btn btn-outline btn-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Fazer uma Pergunta
          </router-link>
        </div>
        <div class="hero-stats">
          <div class="stat">
            <span class="stat-value">{{ totalEditais }}+</span>
            <span class="stat-label">Editais disponíveis</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">IA</span>
            <span class="stat-label">Respostas inteligentes</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <span class="stat-value">24/7</span>
            <span class="stat-label">Acesso gratuito</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Recursos / Benefícios -->
    <section id="recursos" class="features-section">
      <div class="section-container">
        <div class="section-header">
          <span class="section-badge">Recursos</span>
          <h2 class="section-title">Tudo que você precisa em um só lugar</h2>
          <p class="section-subtitle">Explore editais, tire dúvidas com IA e encontre oportunidades acadêmicas de forma simples e rápida.</p>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon icon-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h3 class="feature-title">Editais Organizados</h3>
            <p class="feature-desc">Acesse todos os editais disponíveis em um só lugar, com informações claras e organizadas.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon icon-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3 class="feature-title">Chat com IA</h3>
            <p class="feature-desc">Faça perguntas sobre qualquer edital e receba respostas precisas baseadas no conteúdo oficial.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon icon-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3 class="feature-title">Acesso 24/7</h3>
            <p class="feature-desc">Consulte editais e tire suas dúvidas a qualquer hora, sem necessidade de agendamento.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon icon-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h3 class="feature-title">Busca Inteligente</h3>
            <p class="feature-desc">Encontre rapidamente o edital que procura usando nossa busca avançada com IA.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon icon-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 class="feature-title">Dados Confiáveis</h3>
            <p class="feature-desc">Todas as respostas são baseadas no conteúdo oficial dos editais, sem invenções.</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon icon-rose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
            <h3 class="feature-title">Responsivo</h3>
            <p class="feature-desc">Acesse de qualquer dispositivo — desktop, tablet ou celular — com a mesma experiência.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Como Funciona -->
    <section class="how-it-works">
      <div class="section-container">
        <div class="section-header">
          <span class="section-badge">Simples e Rápido</span>
          <h2 class="section-title">Como funciona</h2>
          <p class="section-subtitle">Em apenas 3 passos você encontra a informação que precisa</p>
        </div>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">1</div>
            <h3>Explore os Editais</h3>
            <p>Navegue pela lista de editais disponíveis ou use a busca para encontrar o que precisa.</p>
          </div>
          <div class="step-card">
            <div class="step-number">2</div>
            <h3>Faça sua Pergunta</h3>
            <p>Pergunte à IA sobre requisitos, prazos, documentos e qualquer dúvida sobre o edital.</p>
          </div>
          <div class="step-card">
            <div class="step-number">3</div>
            <h3>Receba a Resposta</h3>
            <p>Obtenha respostas claras e diretas, com fontes e trechos do edital oficial.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Editais em Destaque -->
    <section id="editais" class="editais-section">
      <div class="section-container">
        <div class="section-header flex">
          <div>
            <span class="section-badge">Oportunidades</span>
            <h2 class="section-title">Editais em Destaque</h2>
          </div>
          <router-link to="/editais" class="view-all-link">
            Ver todos
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </router-link>
        </div>

        <div v-if="loadingEditais" class="loading-state">
          <div class="spinner"></div>
          <p>Carregando editais...</p>
        </div>

        <div v-else-if="editais.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <h3>Nenhum edital disponível ainda</h3>
          <p>Os editais aparecerão aqui quando forem adicionados ao sistema</p>
        </div>

        <div v-else class="editais-grid">
          <router-link
            v-for="edital in editais.slice(0, 6)"
            :key="edital.id"
            :to="`/edital/${edital.id}`"
            class="edital-card"
          >
            <div class="card-header">
              <span class="year-badge">{{ edital.ano }}</span>
              <span class="chunk-count">{{ edital.chunkCount || 0 }} trechos</span>
            </div>
            <h3 class="card-title">{{ edital.titulo }}</h3>
            <p class="card-desc">{{ truncateText(edital.objetivo_principal || edital.descricao, 120) }}</p>
            <div class="card-footer">
              <span class="card-action">
                Ver detalhes
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </span>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- CTA Final -->
    <section class="cta-section">
      <div class="cta-container">
        <div class="cta-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h2>Pronto para explorar os editais?</h2>
        <p>Comece agora fazendo uma pergunta para nossa IA ou navegando pelos editais disponíveis</p>
        <div class="cta-actions">
          <router-link to="/chat" class="btn btn-white btn-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Fazer uma Pergunta
          </router-link>
          <router-link to="/login?tab=register" class="btn btn-outline-white btn-lg">
            Criar Conta Grátis
          </router-link>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="home-footer">
      <div class="footer-container">
        <div class="footer-brand">
          <div class="footer-logo">
            <div class="logo-icon small">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            </div>
            <span class="logo-text">HubSabia</span>
          </div>
          <p class="footer-desc">Assistente inteligente de editais acadêmicos com IA</p>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <h4>Navegação</h4>
            <router-link to="/editais">Editais</router-link>
            <router-link to="/chat">Chat IA</router-link>
            <router-link to="/login">Entrar</router-link>
          </div>
          <div class="footer-col">
            <h4>Informações</h4>
            <a href="#recursos">Recursos</a>
            <a href="#editais">Editais</a>
            <a href="#como-funciona">Como funciona</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 HubSabia. Todos os direitos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getEditais } from '../services/api.js'
import ThemeToggle from '../components/ThemeToggle.vue'

const totalEditais = ref(0)
const editais = ref([])
const loadingEditais = ref(true)
const mobileMenuOpen = ref(false)
const isLoggedIn = ref(false)
const userRole = ref('user')

function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

onMounted(async () => {
  // Verificar login
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

  try {
    const response = await getEditais()
    editais.value = response.data || []
    totalEditais.value = editais.value.length
  } catch {
    // Editais são opcionais na home
  } finally {
    loadingEditais.value = false
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: var(--color-bg);
}

/* ====== HEADER ====== */
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

/* ====== HERO ====== */
.hero {
  position: relative;
  padding: 5rem 2rem 4rem;
  text-align: center;
  background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%);
  overflow: hidden;
}

.hero-bg-pattern {
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  padding: 0.375rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  border: 1px solid var(--color-primary-100);
}

.hero-badge svg {
  width: 16px;
  height: 16px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: var(--color-gray-900);
  line-height: 1.1;
  margin: 0 0 1.25rem;
  letter-spacing: -0.025em;
}

.text-gradient {
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--color-gray-500);
  max-width: 600px;
  margin: 0 auto 2.5rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.btn-lg {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.75rem;
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 150ms ease;
  cursor: pointer;
  border: none;
}

.btn-lg svg {
  width: 20px;
  height: 20px;
}

.btn-primary {
  background: var(--color-primary-600);
  color: white;
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.2);
}

.btn-primary:hover {
  background: var(--color-primary-700);
  box-shadow: var(--shadow-primary-lg);
  transform: translateY(-2px);
}

.btn-outline {
  background: var(--color-surface);
  color: var(--color-gray-700);
  border: 1.5px solid var(--color-border);
}

.btn-outline:hover {
  background: var(--color-surface-2);
  border-color: var(--color-gray-300);
  transform: translateY(-2px);
}

.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.5rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--color-gray-500);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--color-border);
}

/* ====== SECTIONS ====== */
.section-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.section-header.flex {
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  text-align: left;
  margin-bottom: 2rem;
}

.section-header.flex > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.section-badge {
  display: inline-block;
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 0.75rem;
}

.section-subtitle {
  font-size: 1.0625rem;
  color: var(--color-gray-500);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* ====== FEATURES ====== */
.features-section {
  padding: 5rem 2rem;
  background: var(--color-surface);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.feature-card {
  padding: 1.75rem;
  background: var(--color-bg);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  transition: all 150ms ease;
}

.feature-card:hover {
  border-color: var(--color-primary-200);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.feature-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.icon-primary { background: var(--color-primary-600); }
.icon-success { background: var(--color-success-500); }
.icon-warning { background: var(--color-warning-500); }
.icon-info { background: var(--color-info-500); }
.icon-purple { background: #8b5cf6; }
.icon-rose { background: #f43f5e; }

.feature-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem;
}

.feature-desc {
  font-size: 0.9375rem;
  color: var(--color-gray-500);
  line-height: 1.6;
  margin: 0;
}

/* ====== HOW IT WORKS ====== */
.how-it-works {
  padding: 5rem 2rem;
  background: var(--color-bg);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.step-card {
  text-align: center;
  padding: 2rem 1.5rem;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.step-number {
  width: 48px;
  height: 48px;
  background: var(--color-primary-600);
  color: white;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 auto 1.25rem;
  box-shadow: var(--shadow-primary);
}

.step-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem;
}

.step-card p {
  font-size: 0.9375rem;
  color: var(--color-gray-500);
  line-height: 1.6;
  margin: 0;
}

/* ====== EDITAIS ====== */
.editais-section {
  padding: 5rem 2rem;
  background: var(--color-surface);
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-primary-600);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 150ms ease;
  padding: 0.5rem 0;
  flex-shrink: 0;
}

.view-all-link svg {
  width: 16px;
  height: 16px;
  transition: transform 150ms ease;
}

.view-all-link:hover {
  color: var(--color-primary-700);
}

.view-all-link:hover svg {
  transform: translateX(4px);
}

.editais-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.edital-card {
  background: var(--color-surface-2);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  text-decoration: none;
  color: inherit;
  transition: all 150ms ease;
  display: flex;
  flex-direction: column;
}

.edital-card:hover {
  border-color: var(--color-primary-300);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.875rem;
}

.year-badge {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  padding: 0.2rem 0.625rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.chunk-count {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0 0 0.5rem;
  line-height: 1.4;
}

.card-desc {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin: 0 0 1rem;
  line-height: 1.5;
  flex: 1;
}

.card-footer {
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.card-action {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-primary-600);
  font-size: 0.875rem;
  font-weight: 500;
}

.card-action svg {
  width: 16px;
  height: 16px;
  transition: transform 150ms ease;
}

.edital-card:hover .card-action svg {
  transform: translateX(4px);
}

/* Loading & Empty */
.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  grid-column: 1 / -1;
}

.empty-icon svg {
  width: 56px;
  height: 56px;
  color: var(--color-gray-300);
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin: 0 0 0.375rem;
}

.empty-state p {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin: 0;
}

/* ====== CTA ====== */
.cta-section {
  padding: 5rem 2rem;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  position: relative;
  overflow: hidden;
}

.cta-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.cta-container {
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.cta-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.cta-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

.cta-container h2 {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.75rem;
}

.cta-container p {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 2rem;
}

.cta-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-white {
  background: white;
  color: var(--color-primary-700);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-white:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.btn-outline-white {
  background: transparent;
  color: white;
  border: 1.5px solid rgba(255, 255, 255, 0.4);
}

.btn-outline-white:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
}

/* ====== FOOTER ====== */
.home-footer {
  background: var(--color-gray-900);
  padding: 3rem 2rem 1.5rem;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-brand {
  max-width: 280px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.75rem;
}

.footer-logo .logo-icon {
  width: 32px;
  height: 32px;
}

.footer-logo .logo-icon svg {
  width: 18px;
  height: 18px;
}

.footer-logo .logo-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
}

.footer-desc {
  font-size: 0.875rem;
  color: var(--color-gray-400);
  line-height: 1.6;
  margin: 0;
}

.footer-links {
  display: flex;
  gap: 3rem;
}

.footer-col h4 {
  font-size: 0.8125rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 0.75rem;
}

.footer-col a {
  display: block;
  color: var(--color-gray-400);
  text-decoration: none;
  font-size: 0.875rem;
  padding: 0.25rem 0;
  transition: color var(--transition-fast);
}

.footer-col a:hover {
  color: white;
}

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 1.5rem;
  text-align: center;
}

.footer-bottom p {
  font-size: 0.8125rem;
  color: var(--color-gray-500);
  margin: 0;
}

/* ====== RESPONSIVO ====== */
@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .editais-grid {
    grid-template-columns: repeat(2, 1fr);
  }
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

  .hero {
    padding: 3.5rem 1.5rem 3rem;
  }

  .hero-title {
    font-size: 2.25rem;
  }

  .hero-subtitle {
    font-size: 1.0625rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .btn-lg {
    width: 100%;
    justify-content: center;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .stat-divider {
    width: 40px;
    height: 1px;
  }

  .section-title {
    font-size: 1.625rem;
  }

  .features-grid,
  .steps-grid {
    grid-template-columns: 1fr;
  }

  .editais-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
    text-align: center;
  }

  .section-header > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .cta-actions {
    flex-direction: column;
  }

  .footer-container {
    flex-direction: column;
  }

  .footer-links {
    gap: 2rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.875rem;
  }

  .hide-mobile {
    display: none;
  }

  .text-gradient {
    display: block;
  }

  .header-inner {
    padding: 0.75rem 1rem;
  }

  .features-section,
  .how-it-works,
  .editais-section,
  .cta-section {
    padding: 3.5rem 1rem;
  }

  .home-footer {
    padding: 2rem 1rem 1rem;
  }
}
</style>
