<template>
  <DashboardLayout :page-title="isAdmin ? 'Meu Perfil' : 'Meu Perfil'">
    <div class="profile-page">
      <div class="profile-card">
        <!-- Banner -->
        <div class="profile-banner">
          <div class="avatar-wrapper">
            <div class="avatar" :class="{ 'is-admin': isAdmin }">
              <span class="avatar-initials">{{ userInitials }}</span>
            </div>
            <div class="avatar-status"></div>
          </div>
        </div>

        <!-- Body -->
        <div class="profile-body">
          <div class="profile-header-info">
            <h1 class="profile-name">{{ userName }}</h1>
            <p class="profile-email">{{ userEmail }}</p>
            <span class="role-badge" :class="userRole">
              <svg v-if="isAdmin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              {{ userRoleLabel }}
            </span>
          </div>

          <!-- Details -->
          <div class="details-grid">
            <div class="detail-card">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="detail-content">
                <span class="detail-label">Nome</span>
                <span class="detail-value">{{ userName }}</span>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div class="detail-content">
                <span class="detail-label">Email</span>
                <span class="detail-value email-value">{{ userEmail }}</span>
              </div>
            </div>
            
            <div class="detail-card">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div class="detail-content">
                <span class="detail-label">Tipo de Conta</span>
                <span class="detail-value">{{ userRoleLabel }}</span>
              </div>
            </div>

            <div class="detail-card">
              <div class="detail-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="detail-content">
                <span class="detail-label">Membro desde</span>
                <span class="detail-value">{{ memberSince }}</span>
              </div>
            </div>
          </div>

          <!-- Plano Atual -->
          <div class="profile-section">
            <h3 class="section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Plano Atual
            </h3>

            <div class="plan-card" :class="{ 'own-key': currentUser?.usingOwnApiKey?.active }">
              <div class="plan-header">
                <div class="plan-info">
                  <span class="plan-badge">
                    {{ currentUser?.usingOwnApiKey?.active ? '🔑' : '🟢' }} 
                    {{ currentUser?.currentPlan?.name || 'Plano Gratuito HubSabia' }}
                  </span>
                  <p class="plan-ia">IA utilizada: Gemini 2.5 Flash</p>
                </div>
                <router-link to="/perfil" class="btn-toggle">
                  {{ currentUser?.usingOwnApiKey?.active ? 'Alterar' : 'Configurar minha chave' }}
                </router-link>
              </div>

              <div v-if="!currentUser?.usingOwnApiKey?.active" class="credits-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: creditPercentage + '%' }"></div>
                </div>
                <div class="credits-info">
                  <span>{{ currentUser?.remainingCredits || 0 }} / 20 créditos</span>
                  <span>Renovação: {{ formattedResetTime }}</span>
                </div>
              </div>
              <div v-else class="own-key-status">
                <p>Status: Uso ilimitado conforme sua própria conta.</p>
              </div>
            </div>
          </div>

          <!-- Providers -->
          <div class="providers-list">
            <!-- Gemini -->
            <div class="provider-item" :class="{ 'is-active': hasGeminiKey }">
              <div class="provider-header">
                <div class="provider-info">
                  <span class="provider-name">Google Gemini</span>
                  <span class="provider-badge" :class="hasGeminiKey ? 'active' : 'inactive'">
                    {{ hasGeminiKey ? 'Conectado' : 'Não configurado' }}
                  </span>
                </div>
                <button @click="toggleProvider('gemini')" class="btn-toggle">
                  {{ activeProviderForm === 'gemini' ? 'Fechar' : (hasGeminiKey ? 'Alterar' : 'Configurar') }}
                </button>
              </div>

              <div v-if="activeProviderForm === 'gemini'" class="provider-form">
                <div class="input-group">
                  <label>Chave API Gemini</label>
                  <div class="password-input">
                    <input 
                      :type="showKeys.gemini ? 'text' : 'password'" 
                      v-model="providerKeys.gemini" 
                      placeholder="AIza..."
                    />
                    <button @click="showKeys.gemini = !showKeys.gemini" class="btn-show-hide" type="button">
                      <svg v-if="showKeys.gemini" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="provider-actions">
                  <button class="btn-save" @click="handleSaveKey('gemini')" :disabled="loading || !providerKeys.gemini">Salvar</button>
                  <button v-if="hasGeminiKey" class="btn-remove" @click="handleRemoveKey('gemini')" :disabled="loading">Remover</button>
                </div>
              </div>
            </div>

            <!-- Groq -->
            <div class="provider-item" :class="{ 'is-active': hasGroqKey }">
              <div class="provider-header">
                <div class="provider-info">
                  <span class="provider-name">Groq (Llama)</span>
                  <span class="provider-badge" :class="hasGroqKey ? 'active' : 'inactive'">
                    {{ hasGroqKey ? 'Conectado' : 'Não configurado' }}
                  </span>
                </div>
                <button @click="toggleProvider('groq')" class="btn-toggle">
                  {{ activeProviderForm === 'groq' ? 'Fechar' : (hasGroqKey ? 'Alterar' : 'Configurar') }}
                </button>
              </div>

              <div v-if="activeProviderForm === 'groq'" class="provider-form">
                <div class="input-group">
                  <label>Chave API Groq</label>
                  <div class="password-input">
                    <input 
                      :type="showKeys.groq ? 'text' : 'password'" 
                      v-model="providerKeys.groq" 
                      placeholder="gsk_..."
                    />
                    <button @click="showKeys.groq = !showKeys.groq" class="btn-show-hide" type="button">
                      <svg v-if="showKeys.groq" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="provider-actions">
                  <button class="btn-save" @click="handleSaveKey('groq')" :disabled="loading || !providerKeys.groq">Salvar</button>
                  <button v-if="hasGroqKey" class="btn-remove" @click="handleRemoveKey('groq')" :disabled="loading">Remover</button>
                </div>
              </div>
            </div>

            <!-- Preferência de provider -->
            <div class="provider-item">
              <div class="provider-header">
                <div class="provider-info">
                  <span class="provider-name">IA preferida</span>
                  <span class="provider-badge active">Gemini ou Groq</span>
                </div>
              </div>
              <div class="provider-form">
                <div class="preference-options">
                  <button
                    class="pref-option"
                    :class="{ selected: preferredProvider === 'gemini' }"
                    @click="setPreferredProvider('gemini')"
                  >
                    Gemini 2.5 Flash
                  </button>
                  <button
                    class="pref-option"
                    :class="{ selected: preferredProvider === 'groq' }"
                    @click="setPreferredProvider('groq')"
                  >
                    Groq (Llama 3.3)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Ações -->
          <div class="profile-actions">
            <button class="btn-action btn-edit" @click="handleEdit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar Perfil
            </button>
            
            <button class="btn-action btn-logout" @click="handleLogout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair
            </button>
          </div>

          <!-- Link Admin -->
          <div v-if="isAdmin" class="admin-quick-access">
            <h3 class="access-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Acesso Rápido de Administrador
            </h3>
            <div class="access-links">
              <router-link to="/admin/usuarios" class="access-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Gerenciar Usuários</span>
              </router-link>
              <router-link to="/admin/editais" class="access-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>Gerenciar Editais</span>
              </router-link>
              <router-link to="/admin/dashboard" class="access-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>Dashboard Admin</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { logout, getCurrentUser, updateProviderConfig, updatePreferredProvider } from '../services/api.js'
import { info, success, error as toastError } from '../utils/toast.js'

const router = useRouter()
const currentUser = ref(null)
const loading = ref(false)

// State for Multi-Provider
const preferredProvider = ref('gemini')
const activeProviderForm = ref(null)
const providerKeys = ref({
  gemini: '',
  groq: ''
})
const showKeys = ref({
  gemini: false,
  groq: false
})

const userName = computed(() => currentUser.value?.nome || currentUser.value?.email?.split('@')[0] || 'Usuário')
const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
})
const userEmail = computed(() => currentUser.value?.email || '')
const userRole = computed(() => currentUser.value?.role || 'user')
const userRoleLabel = computed(() => userRole.value === 'admin' ? 'Administrador' : 'Usuário')
const isAdmin = computed(() => userRole.value === 'admin')
const memberSince = computed(() => currentUser.value?.createdAt ? new Date(currentUser.value.createdAt).toLocaleDateString('pt-BR') : '---')

// Flags for keys
const hasGeminiKey = computed(() => !!currentUser.value?.has_gemini_key)
const hasGroqKey = computed(() => !!currentUser.value?.has_groq_key)

const creditPercentage = computed(() => {
  const credits = currentUser.value?.remainingCredits || 0;
  return Math.min(Math.max((credits / 20) * 100, 0), 100);
})

const formattedResetTime = computed(() => {
  if (!currentUser.value?.lastCreditReset) return 'Calculando...';
  // Lógica simplificada: adicionar 24h ao lastCreditReset e formatar
  const resetDate = new Date(currentUser.value.lastCreditReset);
  resetDate.setHours(resetDate.getHours() + 24);
  
  const diff = resetDate - new Date();
  if (diff <= 0) return 'Agora';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}min`;
})

async function fetchUserData() {
  try {
    const response = await getCurrentUser()
    // O interceptor retorna o body {success, data} — extrair o usuário real
    const user = response?.data || response
    if (user && user.email) {
      currentUser.value = user
      preferredProvider.value = user.preferred_provider || 'gemini'
      localStorage.setItem('user', JSON.stringify(user))
    }
  } catch (err) {
    console.error('Erro ao buscar dados do usuário:', err)
  }
}

function toggleProvider(provider) {
  if (activeProviderForm.value === provider) {
    activeProviderForm.value = null
  } else {
    activeProviderForm.value = provider
    providerKeys.value[provider] = ''
  }
}

async function handleSaveKey(provider) {
  const key = providerKeys.value[provider]
  if (!key) return

  loading.value = true
  try {
    const response = await updateProviderConfig(provider, key.trim())
    if (response.success) {
      success(`Chave do ${provider.toUpperCase()} configurada com sucesso!`)
      providerKeys.value[provider] = ''
      activeProviderForm.value = null
      await fetchUserData()
    } else {
      toastError(response.message || 'Erro ao salvar chave')
    }
  } catch (err) {
    toastError(err.message || 'Erro ao conectar com o servidor')
  } finally {
    loading.value = false
  }
}

async function handleRemoveKey(provider) {
  if (!confirm(`Remover chave do ${provider.toUpperCase()}?`)) return

  loading.value = true
  try {
    const response = await updateProviderConfig(provider, null)
    if (response.success) {
      success('Chave removida.')
      await fetchUserData()
    } else {
      toastError(response.message || 'Erro ao remover chave')
    }
  } catch (err) {
    toastError(err.message || 'Erro ao conectar com o servidor')
  } finally {
    loading.value = false
  }
}

async function setPreferredProvider(provider) {
  if (preferredProvider.value === provider) return
  preferredProvider.value = provider
  try {
    const response = await updatePreferredProvider(provider)
    if (response.success) {
      success(`IA preferida: ${provider === 'gemini' ? 'Gemini' : 'Groq'}`)
    }
  } catch (err) {
    toastError(err.message || 'Erro ao salvar preferência')
    // Reverte em caso de falha
    await fetchUserData()
  }
}

function handleEdit() {
  alert('Funcionalidade de edição de perfil será implementada em breve!')
}

function handleLogout() {
  info('Sessão encerrada. Até logo!')
  logout()
  router.push('/login')
}

onMounted(async () => {
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      currentUser.value = JSON.parse(stored)
    } catch {
      currentUser.value = null
    }
  }
  
  // Refresh data from API
  await fetchUserData()
})
</script>

<style scoped>
.profile-page {
  max-width: 720px;
  margin: 0 auto;
}

/* Card Principal */
.profile-card {
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-border);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* Banner */
.profile-banner {
  position: relative;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  padding: 2.5rem 2rem 3.5rem;
  text-align: center;
}

.profile-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  z-index: 1;
}

.avatar {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 3px solid white;
}

.avatar.is-admin {
  background: white;
}

.avatar-initials {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary-600);
}

.avatar.is-admin .avatar-initials {
  color: var(--color-primary-700);
}

.avatar-status {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background: var(--color-success-500);
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Body */
.profile-body {
  padding: 2rem;
}

/* Header Info */
.profile-header-info {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0 0 0.375rem;
}

.profile-email {
  font-size: 0.9375rem;
  color: var(--color-gray-500);
  margin: 0 0 0.75rem;
}

/* Integração IA */
.profile-section {
  margin-top: 2rem;
  margin-bottom: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
}

.section-description {
  font-size: 0.875rem;
  color: var(--color-gray-500);
  margin-bottom: 1.5rem;
}

.providers-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.provider-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.2s ease;
}

.provider-item.is-active {
  border-color: var(--color-primary-300);
  box-shadow: 0 2px 8px rgba(22, 163, 74, 0.05);
}

.provider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
}

.provider-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.provider-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-gray-900);
}

.provider-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
}

.provider-badge.active {
  background: var(--color-success-50);
  color: var(--color-success-700);
}

.provider-badge.inactive {
  background: var(--color-gray-100);
  color: var(--color-gray-500);
}

.btn-toggle {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  padding: 0.5rem 0.875rem;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-gray-700);
  cursor: pointer;
}

.provider-form {
  padding: 1.25rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-2);
}

.provider-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-save {
  background: var(--color-primary-600);
  color: white;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  flex: 1;
}

.btn-remove {
  background: white;
  color: var(--color-danger-600);
  border: 1px solid var(--color-danger-200);
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 3rem;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-gray-900);
  font-size: 0.9375rem;
  transition: all 0.2s ease;
}

.password-input input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.btn-show-hide {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.btn-show-hide:hover {
  color: var(--color-primary-600);
}

.btn-show-hide svg {
  width: 20px;
  height: 20px;
}

.btn-save:hover:not(:disabled) {
  background: var(--color-primary-700);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
  transform: translateY(-1px);
}

.btn-remove:hover:not(:disabled) {
  background: var(--color-danger-50);
  border-color: var(--color-danger-200);
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 600;
  background: var(--color-surface-2);
  color: var(--color-gray-600);
  border: 1px solid var(--color-border);
}

.role-badge svg {
  width: 14px;
  height: 14px;
}

.role-badge.admin {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  border-color: var(--color-primary-100);
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.detail-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1.125rem;
  background: var(--color-surface-2);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.detail-icon {
  width: 40px;
  height: 40px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.detail-icon svg {
  width: 20px;
  height: 20px;
  color: var(--color-primary-600);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.detail-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-900);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-value.email-value {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
}

/* Ações */
.profile-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  padding: 0.875rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.btn-action svg {
  width: 18px;
  height: 18px;
}

.btn-edit {
  background: var(--color-primary-600);
  color: var(--color-text-inverse);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-edit:hover {
  background: var(--color-primary-700);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
  transform: translateY(-1px);
}

.btn-logout {
  background: var(--color-surface-2);
  color: var(--color-gray-700);
  border: 1px solid var(--color-border);
}

.btn-logout:hover {
  background: var(--color-danger-50);
  color: var(--color-danger-600);
  border-color: var(--color-danger-100, #fecaca);
}

/* Admin Quick Access */
.admin-quick-access {
  background: var(--color-primary-50);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  border: 1px solid var(--color-primary-100);
}

.access-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary-800);
  margin: 0 0 1rem;
}

.access-title svg {
  width: 18px;
  height: 18px;
}

.access-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.access-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  color: var(--color-gray-700);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 150ms ease;
  border: 1px solid transparent;
}

.access-link svg {
  width: 18px;
  height: 18px;
  color: var(--color-primary-600);
  flex-shrink: 0;
}

.access-link:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-200);
  color: var(--color-primary-700);
}

/* Responsivo */
@media (max-width: 640px) {
  .profile-page {
    padding: 0;
  }

  .profile-card {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .profile-banner {
    padding: 2rem 1.5rem 3rem;
  }

  .profile-body {
    padding: 1.5rem;
  }

  .profile-name {
    font-size: 1.25rem;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .profile-actions {
    flex-direction: column;
  }
}

/* Preferência de IA */
.preference-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.pref-option {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pref-option:hover {
  border-color: var(--color-primary-300);
}

.pref-option.selected {
  background: var(--color-primary-50);
  border-color: var(--color-primary-500);
  color: var(--color-primary-700);
}

@media (max-width: 480px) {
  .preference-options {
    grid-template-columns: 1fr;
  }
}
</style>
