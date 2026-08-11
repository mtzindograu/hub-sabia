<template>
  <DashboardLayout page-title="Dashboard">
    <section class="welcome-section" aria-labelledby="dashboard-welcome-title">
      <div class="welcome-copy">
        <p class="eyebrow">Seu espaço de pesquisa · {{ hoje }}</p>
        <h1 id="dashboard-welcome-title">Olá, {{ userFirstName }}.</h1>
        <p class="welcome-subtitle">Encontre oportunidades acadêmicas, compreenda cada detalhe e avance com mais clareza.</p>
      </div>
      <router-link to="/chat" class="btn btn-primary welcome-action">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Perguntar à IA
      </router-link>
    </section>

    <section class="stats-grid" aria-label="Resumo da conta">
      <article class="stat-card">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="stat-content"><span class="stat-value">{{ totalEditais }}</span><span class="stat-label">Editais disponíveis</span></div>
      </article>
      <article class="stat-card">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
          </svg>
        </div>
        <div class="stat-content"><span class="stat-value">{{ totalTrechos }}</span><span class="stat-label">Trechos indexados</span></div>
      </article>
      <article class="stat-card stat-card-date">
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        </div>
        <div class="stat-content"><span class="stat-value">{{ hoje }}</span><span class="stat-label">Hoje no HubSabia</span></div>
      </article>
    </section>

    <section class="section quick-section" aria-labelledby="quick-actions-title">
      <div class="section-heading">
        <div><p class="eyebrow">Comece por aqui</p><h2 id="quick-actions-title">Acesso rápido</h2></div>
      </div>
      <div class="quick-actions-grid">
        <router-link to="/dashboard/editais" class="quick-action-card">
          <span class="action-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
          </span>
          <span class="action-text"><strong>Explorar editais</strong><small>Veja todas as oportunidades</small></span>
          <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </router-link>
        <router-link to="/chat" class="quick-action-card">
          <span class="action-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </span>
          <span class="action-text"><strong>Conversar com a IA</strong><small>Tire dúvidas sobre um edital</small></span>
          <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </router-link>
        <router-link to="/perfil" class="quick-action-card">
          <span class="action-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
          <span class="action-text"><strong>Meu perfil</strong><small>Atualize suas preferências</small></span>
          <svg class="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </router-link>
      </div>
    </section>

    <section class="section recent-section" aria-labelledby="recent-title">
      <div class="section-heading section-heading-row">
        <div><p class="eyebrow">Atualizados recentemente</p><h2 id="recent-title">Editais recentes</h2></div>
        <router-link to="/dashboard/editais" class="view-all-link">Ver todos <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></router-link>
      </div>
      <div v-if="loading" class="state-panel"><div class="spinner"></div><p>Carregando editais...</p></div>
      <div v-else-if="editaisRecentes.length === 0" class="state-panel empty-state">
        <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
        <h3>Nenhum edital disponível</h3><p>Os editais aparecerão aqui quando forem adicionados ao sistema.</p>
      </div>
      <div v-else class="editais-list">
        <router-link v-for="edital in editaisRecentes" :key="edital.id" :to="`/dashboard/editais/${edital.id}`" class="edital-item">
          <span class="edital-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
          <span class="edital-info"><strong class="edital-title">{{ edital.titulo }}</strong><span class="edital-meta"><span class="year-badge">{{ edital.ano }}</span><span>{{ edital.chunkCount || 0 }} trechos indexados</span></span></span>
          <svg class="edital-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
        </router-link>
      </div>
    </section>
   </DashboardLayout>
 </template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import { getEditais } from '../../services/api.js'

const totalEditais = ref(0)
const totalTrechos = ref(0)
const editaisRecentes = ref([])
const loading = ref(true)
const currentUser = ref(null)

const userFirstName = computed(() => {
  if (!currentUser.value) return 'Usuário'
  const nome = currentUser.value.nome || currentUser.value.email?.split('@')[0] || 'Usuário'
  return nome.split(' ')[0]
})

const hoje = computed(() => {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
})

onMounted(async () => {
  // Carregar usuário
  const stored = localStorage.getItem('user')
  if (stored) {
    try { currentUser.value = JSON.parse(stored) } catch { currentUser.value = null }
  }

  // Carregar editais
  try {
    const response = await getEditais()
    const editais = response.data || []
    totalEditais.value = editais.length
    totalTrechos.value = editais.reduce((sum, e) => sum + (e.chunkCount || 0), 0)
    editaisRecentes.value = editais.slice(0, 5)
  } catch (error) {
    console.error('Erro ao carregar editais:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.welcome-section {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.welcome-copy { max-width: 680px; }
.eyebrow { margin: 0 0 0.55rem; color: var(--color-primary-700); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
.welcome-copy h1 { margin: 0 0 0.65rem; color: var(--color-text); font-family: var(--font-display); font-size: clamp(2rem, 4vw, 3rem); font-weight: 600; letter-spacing: -0.045em; line-height: 1.05; }
.welcome-subtitle { max-width: 560px; margin: 0; color: var(--color-text-secondary); font-size: 0.95rem; line-height: 1.7; }
.welcome-action { flex-shrink: 0; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2.5rem; }
.stat-card { display: flex; align-items: center; gap: 1rem; min-width: 0; padding: 1.25rem; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-surface); box-shadow: var(--shadow-sm); transition: transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base); }
.stat-card:hover { border-color: var(--color-primary-300); box-shadow: var(--shadow-md); transform: translateY(-2px); }
.stat-icon { width: 42px; height: 42px; display: grid; place-items: center; flex-shrink: 0; border-radius: var(--radius-lg); background: var(--color-primary-50); color: var(--color-primary-700); }
.stat-icon svg { width: 20px; height: 20px; }
.stat-content { min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; }
.stat-value { overflow: hidden; color: var(--color-text); font-family: var(--font-display); font-size: 1.5rem; font-weight: 600; line-height: 1.15; text-overflow: ellipsis; white-space: nowrap; }
.stat-label { color: var(--color-text-muted); font-size: 0.75rem; font-weight: 600; }

.section { margin-bottom: 2.5rem; }
.section-heading { margin-bottom: 1rem; }
.section-heading h2 { margin: 0; color: var(--color-text); font-family: var(--font-display); font-size: 1.55rem; font-weight: 600; letter-spacing: -0.025em; }
.section-heading-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; }
.quick-actions-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.quick-action-card { display: flex; align-items: center; gap: 0.85rem; min-width: 0; padding: 1.1rem; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-surface); color: var(--color-text); text-decoration: none; transition: transform var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base); }
.quick-action-card:hover { border-color: var(--color-primary-300); box-shadow: var(--shadow-md); color: var(--color-text); transform: translateY(-2px); }
.action-icon-wrapper { width: 38px; height: 38px; display: grid; place-items: center; flex-shrink: 0; border-radius: var(--radius-lg); background: var(--color-primary-50); color: var(--color-primary-700); }
.action-icon-wrapper svg { width: 19px; height: 19px; }
.action-text { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 0.2rem; }
.action-text strong { overflow: hidden; font-size: 0.85rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.action-text small { overflow: hidden; color: var(--color-text-muted); font-size: 0.72rem; text-overflow: ellipsis; white-space: nowrap; }
.action-arrow { width: 17px; height: 17px; flex-shrink: 0; color: var(--color-text-muted); transition: transform var(--transition-fast), color var(--transition-fast); }
.quick-action-card:hover .action-arrow { color: var(--color-primary-600); transform: translateX(3px); }
.view-all-link { display: inline-flex; align-items: center; gap: 0.35rem; color: var(--color-primary-700); font-size: 0.8rem; font-weight: 700; text-decoration: none; }
.view-all-link:hover { color: var(--color-primary-600); }
.view-all-link svg { width: 16px; height: 16px; }

.editais-list { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-surface); box-shadow: var(--shadow-sm); }
.edital-item { display: flex; align-items: center; gap: 1rem; min-width: 0; padding: 0.85rem 0.9rem; border: 1px solid transparent; border-radius: var(--radius-lg); color: var(--color-text); text-decoration: none; transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast); }
.edital-item:hover { border-color: var(--color-primary-200); background: var(--color-primary-50); color: var(--color-text); transform: translateY(-1px); }
.edital-icon { width: 38px; height: 38px; display: grid; place-items: center; flex-shrink: 0; border-radius: var(--radius-lg); background: var(--color-surface-2); color: var(--color-primary-700); }
.edital-icon svg { width: 19px; height: 19px; }
.edital-info { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 0.25rem; }
.edital-title { overflow: hidden; color: var(--color-text); font-size: 0.875rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.edital-meta { display: flex; align-items: center; gap: 0.55rem; color: var(--color-text-muted); font-size: 0.72rem; }
.year-badge { padding: 0.15rem 0.45rem; border-radius: var(--radius-sm); background: var(--color-primary-50); color: var(--color-primary-700); font-size: 0.68rem; font-weight: 800; }
.edital-arrow { width: 18px; height: 18px; flex-shrink: 0; color: var(--color-text-muted); }
.state-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 180px; padding: 2rem; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-surface); color: var(--color-text-muted); text-align: center; }
.state-panel p { margin: 0.75rem 0 0; font-size: 0.82rem; }
.empty-icon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: var(--radius-lg); background: var(--color-surface-2); color: var(--color-text-muted); }
.empty-icon svg { width: 22px; height: 22px; }
.empty-state h3 { margin: 0.8rem 0 0.3rem; color: var(--color-text); font-family: var(--font-display); font-size: 1.2rem; font-weight: 600; }
.empty-state p { max-width: 340px; }

@media (max-width: 900px) { .quick-actions-grid { grid-template-columns: 1fr; } }
@media (max-width: 720px) { .welcome-section { align-items: flex-start; flex-direction: column; padding: 1.5rem; } .welcome-action { width: 100%; } .stats-grid { grid-template-columns: 1fr; } .section-heading-row { align-items: flex-start; flex-direction: column; } }
@media (max-width: 480px) { .edital-meta { align-items: flex-start; flex-direction: column; gap: 0.2rem; } }
</style>
