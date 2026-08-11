<template>
  <DashboardLayout page-title="Editais">
    <section class="page-intro" aria-labelledby="editais-title">
      <div>
        <p class="eyebrow">Biblioteca HubSabia</p>
        <h1 id="editais-title">Editais</h1>
        <p class="intro-copy">Pesquise oportunidades e abra um edital para conhecer seus detalhes.</p>
      </div>
      <button v-if="isAdmin" class="btn btn-primary upload-button" @click="showUploadModal = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        Adicionar edital
      </button>
    </section>

    <div class="editais-toolbar">
      <label class="search-box" for="edital-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span class="sr-only">Buscar editais</span>
        <input id="edital-search" v-model="searchQuery" type="search" placeholder="Buscar por título, ano ou palavra-chave..." class="search-input" />
      </label>
      <span class="count-badge">{{ filteredEditais.length }} edital{{ filteredEditais.length !== 1 ? 'is' : '' }}</span>
    </div>

    <div v-if="loading" class="state-panel"><div class="spinner"></div><p>Carregando editais...</p></div>

    <div v-else-if="filteredEditais.length === 0" class="state-panel empty-state">
      <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
      <h2>{{ searchQuery ? 'Nenhum edital encontrado' : 'Nenhum edital disponível' }}</h2>
      <p>{{ searchQuery ? 'Tente buscar com outros termos.' : 'Os editais aparecerão aqui quando forem adicionados ao sistema.' }}</p>
      <button v-if="isAdmin && !searchQuery" class="btn btn-primary" @click="showUploadModal = true">Adicionar primeiro edital</button>
    </div>

    <div v-else class="editais-grid" aria-live="polite">
      <EditalCard v-for="edital in filteredEditais" :key="edital.id" :edital="edital" :isAdmin="isAdmin" :showFullActions="true" @view="viewEdital(edital.id)" @chat="chatAboutEdital(edital.id)" @deleted="handleDeleted(edital.id)" />
    </div>

    <EditalUploadModal v-if="showUploadModal" @close="showUploadModal = false" @success="fetchEditais" />
   </DashboardLayout>
 </template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import EditalCard from '../../components/EditalCard.vue'
import EditalUploadModal from '../../components/EditalUploadModal.vue'
import { getEditais } from '../../services/api.js'
import { success } from '../../utils/toast.js'

const router = useRouter()
const route = useRoute()
const editais = ref([])
const loading = ref(true)
const searchQuery = ref('')
const isAdminCached = ref(false)
const showUploadModal = ref(false)

// Verificar se é admin apenas uma vez (cache)
onMounted(() => {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      isAdminCached.value = JSON.parse(user).role === 'admin'
    } catch {
      isAdminCached.value = false
    }
  }
})

const isAdmin = computed(() => isAdminCached.value)

// Filtragem otimizada com debounce manual
const filteredEditais = computed(() => {
  if (!searchQuery.value.trim()) return editais.value
  const q = searchQuery.value.toLowerCase()
  return editais.value.filter(e =>
    e.titulo.toLowerCase().includes(q) ||
    String(e.ano).includes(q) ||
    (e.palavras_chave || []).some(t => t.toLowerCase().includes(q))
  )
})

function viewEdital(id) {
  const prefix = isAdmin.value ? '/admin' : '/dashboard'
  router.push(`${prefix}/editais/${id}`)
}

function chatAboutEdital(id) {
  router.push(`/chat/${id}`)
}

function handleDeleted(id) {
  editais.value = editais.value.filter(e => e.id !== id)
  success('Edital excluído com sucesso!')
}

async function fetchEditais() {
  try {
    loading.value = true
    const response = await getEditais()
    editais.value = response.data || []
  } catch (e) {
    console.error('Erro ao carregar editais:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchEditais()
  
  if (route.query.upload === 'true' && isAdmin.value) {
    showUploadModal.value = true
  }
})

watch(() => route.query.upload, (newVal) => {
  if (newVal === 'true' && isAdmin.value) {
    showUploadModal.value = true
  }
})
</script>

<style scoped>
.page-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 1.5rem; margin-bottom: 1.75rem; }
.eyebrow { margin: 0 0 0.5rem; color: var(--color-primary-700); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
.page-intro h1 { margin: 0; color: var(--color-text); font-family: var(--font-display); font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 600; letter-spacing: -0.04em; line-height: 1.05; }
.intro-copy { margin: 0.65rem 0 0; color: var(--color-text-secondary); font-size: 0.9rem; }
.upload-button { flex-shrink: 0; }
.upload-button svg { width: 18px; height: 18px; }
.editais-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
.search-box { display: flex; align-items: center; flex: 1; max-width: 540px; padding: 0.7rem 0.9rem; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); transition: border-color var(--transition-fast), box-shadow var(--transition-fast); }
.search-box:focus-within { border-color: var(--color-primary-500); box-shadow: var(--shadow-sm); }
.search-icon { width: 18px; height: 18px; margin-right: 0.65rem; flex-shrink: 0; color: var(--color-text-muted); }
.search-input { width: 100%; border: 0; outline: 0; background: transparent; color: var(--color-text); font: inherit; font-size: 0.85rem; }
.search-input::placeholder { color: var(--color-text-muted); }
.count-badge { flex-shrink: 0; padding: 0.35rem 0.7rem; border: 1px solid var(--color-border); border-radius: var(--radius-full); background: var(--color-surface-2); color: var(--color-text-secondary); font-size: 0.75rem; font-weight: 700; }
.state-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 260px; padding: 2rem; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-surface); color: var(--color-text-muted); text-align: center; }
.state-panel p { margin: 0.7rem 0 0; font-size: 0.82rem; }
.empty-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: var(--radius-lg); background: var(--color-surface-2); color: var(--color-text-muted); }
.empty-icon svg { width: 24px; height: 24px; }
.empty-state h2 { margin: 0.85rem 0 0.3rem; color: var(--color-text); font-family: var(--font-display); font-size: 1.3rem; font-weight: 600; }
.empty-state p { margin-bottom: 1rem; }
.editais-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 700px) { .page-intro { align-items: flex-start; flex-direction: column; } .upload-button { width: 100%; } .editais-toolbar { align-items: stretch; flex-direction: column; } .search-box { max-width: none; } .count-badge { align-self: flex-start; } .editais-grid { grid-template-columns: 1fr; } }
</style>
