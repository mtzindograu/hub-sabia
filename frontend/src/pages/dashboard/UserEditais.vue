<template>
  <DashboardLayout page-title="Editais">
    <!-- Header com busca -->
    <div class="editais-header">
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar edital por título, ano ou palavra-chave..."
          class="search-input"
        />
      </div>
      
      <div class="header-right-actions">
        <span class="count-badge">{{ filteredEditais.length }} edital{{ filteredEditais.length !== 1 ? 'is' : '' }}</span>
        
        <button v-if="isAdmin" class="btn-primary" @click="showUploadModal = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Adicionar Edital
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando editais...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredEditais.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="empty-icon">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <h3 v-if="searchQuery">Nenhum edital encontrado</h3>
      <h3 v-else>Nenhum edital disponível</h3>
      <p v-if="searchQuery">Tente buscar com outros termos</p>
      <p v-else>Os editais aparecerão aqui quando forem adicionados ao sistema</p>
      
      <button v-if="isAdmin && !searchQuery" class="btn-primary mt-4" @click="showUploadModal = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Adicionar Primeiro Edital
      </button>
    </div>

    <!-- Grid de Cards -->
    <div v-else class="editais-grid">
      <EditalCard
        v-for="edital in filteredEditais"
        :key="edital.id"
        :edital="edital"
        :isAdmin="isAdmin"
        :showFullActions="true"
        @view="viewEdital(edital.id)"
        @chat="chatAboutEdital(edital.id)"
        @deleted="handleDeleted(edital.id)"
      />
    </div>

    <!-- Upload Modal -->
    <EditalUploadModal 
      v-if="showUploadModal" 
      @close="showUploadModal = false"
      @success="fetchEditais"
    />
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
.editais-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 0.625rem 1rem;
  flex: 1;
  max-width: 480px;
  transition: all var(--transition-fast);
}

.search-box:focus-within {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.search-icon {
  width: 18px;
  height: 18px;
  color: var(--color-gray-400);
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: transparent;
  font-size: 0.9375rem;
  color: var(--color-text);
  outline: none;
  width: 100%;
}

.search-input::placeholder {
  color: var(--color-gray-400);
}

.header-right-actions {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.count-badge {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-gray-600);
  background: var(--color-surface-2);
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
}

.btn-primary {
  background: var(--color-primary-600);
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-700);
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary);
}

.btn-primary svg {
  width: 18px;
  height: 18px;
}

/* Loading & Empty States */
.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-gray-500);
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: var(--color-gray-300);
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 0.9375rem;
  color: var(--color-gray-500);
}

.mt-4 {
  margin-top: 1rem;
}

/* Grid */
.editais-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .editais-grid {
    grid-template-columns: 1fr;
  }

  .editais-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }
  
  .header-right-actions {
    justify-content: space-between;
  }
}
</style>
