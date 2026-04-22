<template>
  <!-- Se logado: usa DashboardLayout -->
  <DashboardLayout v-if="isLoggedIn" page-title="Editais">
    <div class="dash-editais">
      <div class="search-bar-inline">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="searchQuery" type="text" placeholder="Buscar edital..." class="search-input" />
        </div>
        <span class="count">{{ filteredEditais.length }} edital{{ filteredEditais.length !== 1 ? 'is' : '' }}</span>
      </div>
      <div v-if="loading" class="loading-state"><div class="spinner"></div><p>Carregando...</p></div>
      <div v-else-if="filteredEditais.length === 0" class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="empty-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg><h3>Nenhum edital encontrado</h3></div>
      <div v-else class="editais-grid">
        <div v-for="edital in filteredEditais" :key="edital.id" class="edital-card" @click="goToEdital(edital.id)">
          <div class="card-top"><div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><span class="card-year">{{ edital.ano }}</span></div>
          <h3 class="card-title">{{ edital.titulo }}</h3>
          <p class="card-desc">{{ truncateText(edital.objetivo_principal || edital.descricao, 100) }}</p>
          <div v-if="edital.palavras_chave?.length" class="card-tags"><span v-for="(tag, i) in edital.palavras_chave.slice(0, 3)" :key="i" class="tag">{{ tag }}</span></div>
          <div class="card-footer"><span class="meta">{{ edital.chunkCount || 0 }} trechos</span><span class="action">Ver →</span></div>
        </div>
      </div>
    </div>
  </DashboardLayout>
  <!-- Se visitante: página standalone -->
  <div v-else class="editais-page">
    <header class="page-header">
      <div class="header-content">
        <router-link to="/" class="back-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="m15 18-6-6 6-6"/></svg> Voltar</router-link>
        <h1 class="page-title">Editais</h1>
        <p class="page-subtitle">Encontre o edital que você procura</p>
      </div>
      <div class="search-bar"><div class="search-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input v-model="searchQuery" type="text" placeholder="Buscar edital por título ou palavra-chave..." class="search-input" /></div></div>
    </header>
    <main class="page-main">
      <div v-if="loading" class="loading-state"><div class="spinner"></div><p>Carregando editais...</p></div>
      <div v-else-if="filteredEditais.length === 0" class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="empty-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg><h3>Nenhum edital encontrado</h3><p v-if="searchQuery">Tente buscar com outros termos</p><p v-else>Não há editais disponíveis</p></div>
      <div v-else class="editais-grid">
        <div v-for="edital in filteredEditais" :key="edital.id" class="edital-card" @click="goToEdital(edital.id)">
          <div class="card-header"><div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><span class="card-year">{{ edital.ano }}</span></div>
          <h3 class="card-title">{{ edital.titulo }}</h3>
          <p class="card-desc">{{ truncateText(edital.objetivo_principal || edital.descricao, 120) }}</p>
          <div v-if="edital.palavras_chave?.length" class="card-tags"><span v-for="(tag, i) in edital.palavras_chave.slice(0, 4)" :key="i" class="tag">{{ tag }}</span></div>
          <div class="card-footer"><span class="meta-info">{{ edital.chunkCount || 0 }} trechos</span><span class="card-action">Ver detalhes →</span></div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { getEditais } from '../services/api.js'

const router = useRouter()
const editais = ref([])
const loading = ref(true)
const searchQuery = ref('')
const isLoggedIn = ref(false)

const filteredEditais = computed(() => {
  if (!searchQuery.value.trim()) return editais.value
  const q = searchQuery.value.toLowerCase()
  return editais.value.filter(e =>
    e.titulo.toLowerCase().includes(q) ||
    (e.descricao || '').toLowerCase().includes(q) ||
    (e.objetivo_principal || '').toLowerCase().includes(q) ||
    (e.palavras_chave || []).some(t => t.toLowerCase().includes(q))
  )
})

function handleSearch() {}
function goToEdital(id) { router.push(`/edital/${id}`) }
function truncateText(text, max) { if (!text) return ''; return text.length <= max ? text : text.slice(0, max) + '...' }

onMounted(async () => {
  isLoggedIn.value = !!localStorage.getItem('auth_token')
  try { loading.value = true; const r = await getEditais(); editais.value = r.data || [] } catch { /* silence */ } finally { loading.value = false }
})
</script>

<style scoped>
/* Dashboard version */
.dash-editais { padding: 0; }
.search-bar-inline { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
.search-bar-inline .search-box { display: flex; align-items: center; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 10px; padding: 0.5rem 1rem; flex: 1; max-width: 400px; }
.search-bar-inline .search-icon { width: 18px; height: 18px; color: var(--color-gray-400); margin-right: 0.5rem; }
.search-bar-inline .search-input { border: none; background: transparent; font-size: 0.875rem; color: var(--color-text); outline: none; width: 100%; }
.count { font-size: 0.8125rem; color: var(--color-text-muted); }

/* Standalone version */
.editais-page { min-height: 100vh; background: var(--color-bg); }
.page-header { background: var(--color-surface); border-bottom: 1px solid var(--color-border); padding: 1.5rem 2rem 2rem; }
.header-content { max-width: 1200px; margin: 0 auto 1.5rem; }
.back-link { display: inline-flex; align-items: center; gap: 0.375rem; color: var(--color-text-secondary); font-size: 0.875rem; text-decoration: none; margin-bottom: 1rem; }
.back-link:hover { color: var(--color-primary-600); }
.page-title { font-size: 2rem; font-weight: 700; color: var(--color-gray-900); margin-bottom: 0.5rem; }
.page-subtitle { font-size: 1rem; color: var(--color-text-secondary); }
.search-bar { max-width: 1200px; margin: 0 auto; }
.search-box { display: flex; align-items: center; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 0.5rem 1rem; }
.search-icon { width: 18px; height: 18px; color: var(--color-gray-400); margin-right: 0.75rem; }
.search-input { flex: 1; border: none; background: transparent; padding: 0.5rem 0; font-size: 0.9375rem; color: var(--color-text); outline: none; }
.page-main { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.loading-state, .empty-state { text-align: center; padding: 4rem 1rem; color: var(--color-text-secondary); }
.empty-icon { width: 56px; height: 56px; color: var(--color-gray-300); margin-bottom: 1rem; }
.empty-state h3 { color: var(--color-text); margin-bottom: 0.5rem; }

/* Grid (shared) */
.editais-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }
.edital-card { background: var(--color-surface); border-radius: 14px; padding: 1.25rem; border: 1px solid var(--color-border); cursor: pointer; transition: all 0.2s; }
.edital-card:hover { border-color: var(--color-primary-300); box-shadow: var(--shadow-md); transform: translateY(-2px); }
.card-top, .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.875rem; }
.card-icon { width: 36px; height: 36px; background: var(--color-primary-600); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--color-text-inverse); }
.card-icon svg { width: 18px; height: 18px; }
.card-year { background: var(--color-primary-50); color: var(--color-primary-700); padding: 0.2rem 0.5rem; border-radius: 5px; font-size: 0.75rem; font-weight: 600; }
.card-title { font-size: 0.9375rem; font-weight: 600; color: var(--color-gray-900); margin-bottom: 0.375rem; line-height: 1.3; }
.card-desc { font-size: 0.8125rem; color: var(--color-text-secondary); margin-bottom: 0.75rem; line-height: 1.4; }
.card-tags { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.75rem; }
.tag { background: var(--color-primary-50); color: var(--color-primary-700); padding: 0.15rem 0.375rem; border-radius: 4px; font-size: 0.625rem; font-weight: 500; }
.card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--color-border); }
.meta, .meta-info { font-size: 0.6875rem; color: var(--color-text-muted); }
.action, .card-action { font-size: 0.75rem; color: var(--color-primary-600); font-weight: 500; }
@media (max-width: 768px) { .page-header { padding: 1rem; } .page-main { padding: 1rem; } .page-title { font-size: 1.5rem; } .editais-grid { grid-template-columns: 1fr; } }
</style>


