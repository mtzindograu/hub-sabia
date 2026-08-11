<template>
  <DashboardLayout page-title="Meu Perfil">
    <div class="profile-page">
      <article class="profile-card">
        <header class="profile-banner">
          <div class="banner-pattern" aria-hidden="true"></div>
          <div class="banner-copy">
            <span class="banner-kicker">HubSabia / perfil</span>
            <span class="banner-caption">Seu espaço de aprendizagem, do seu jeito.</span>
          </div>
          <div class="avatar-wrapper">
            <div class="avatar" :class="{ 'is-admin': isAdmin }" aria-hidden="true">
              <span class="avatar-initials">{{ userInitials }}</span>
            </div>
            <span class="avatar-status" title="Conta ativa"></span>
          </div>
        </header>

        <div class="profile-body">
          <section class="profile-intro" aria-labelledby="profile-name">
            <div>
              <p class="section-eyebrow">Conta pessoal</p>
              <h1 id="profile-name" class="profile-name">{{ userName }}</h1>
              <p class="profile-email">{{ userEmail }}</p>
            </div>
            <span class="role-badge" :class="userRole">
              <svg v-if="isAdmin" class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>{{ userRoleLabel }}</span>
            </span>
          </section>

          <dl class="details-grid">
            <div class="detail-card">
              <div class="detail-icon" aria-hidden="true">
                <svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div class="detail-content">
                <dt class="detail-label">Nome</dt>
                <dd class="detail-value">{{ userName }}</dd>
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-icon" aria-hidden="true">
                <svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div class="detail-content">
                <dt class="detail-label">Email</dt>
                <dd class="detail-value email-value">{{ userEmail }}</dd>
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-icon" aria-hidden="true">
                <svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div class="detail-content">
                <dt class="detail-label">Tipo de conta</dt>
                <dd class="detail-value">{{ userRoleLabel }}</dd>
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-icon" aria-hidden="true">
                <svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="detail-content">
                <dt class="detail-label">Membro desde</dt>
                <dd class="detail-value">{{ memberSince }}</dd>
              </div>
            </div>
          </dl>

          <section class="profile-section plan-section" aria-labelledby="plan-title">
            <div class="section-heading">
              <div class="heading-mark" aria-hidden="true">
                <svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <p class="section-eyebrow">Seu acesso</p>
                <h2 id="plan-title" class="section-title">Plano atual</h2>
              </div>
            </div>

            <div class="plan-mode-switcher" role="radiogroup" aria-label="Modo de uso do HubSabia">
              <button
                type="button"
                class="plan-mode-option"
                :class="{ selected: !ownKeyActive }"
                @click="switchPlanMode('free')"
              >
                <span class="plan-mode-radio" aria-hidden="true"></span>
                <span class="plan-mode-copy">
                  <strong>Plano da página</strong>
                  <small>20 créditos por dia · renovação automática</small>
                </span>
              </button>
              <button
                type="button"
                class="plan-mode-option"
                :class="{ selected: ownKeyActive }"
                @click="switchPlanMode('own-key')"
              >
                <span class="plan-mode-radio" aria-hidden="true"></span>
                <span class="plan-mode-copy">
                  <strong>Minha chave de IA</strong>
                  <small>Uso ilimitado com Gemini ou Groq</small>
                </span>
              </button>
            </div>

            <div class="plan-card" :class="{ 'own-key': ownKeyActive }">
              <div class="plan-header">
                <div class="plan-info">
                  <div class="plan-title-row">
                    <span class="plan-badge">
                      <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path v-if="ownKeyActive" d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.778-7.778zM15 7l2 2m-2-2 2-2m-2 2-2-2"/>
                        <path v-else d="M12 2l2.4 6.7L21 9.3l-5 4.4 1.5 6.3-5.5-3.5-5.5 3.5L8 13.7 3 9.3l6.6-.6L12 2z"/>
                      </svg>
                      {{ currentUser?.currentPlan?.name || 'Plano gratuito HubSabia' }}
                    </span>
                    <span v-if="ownKeyActive" class="plan-status">Chave própria ativa</span>
                  </div>
                  <p class="plan-ia">
                    {{ ownKeyActive ? `Chave própria: ${ownKeyProviderLabel}` : `IA utilizada: ${preferredProviderLabel}` }}
                  </p>
                </div>
                <button type="button" class="btn-toggle" @click="scrollToProviders">
                  <span>{{ ownKeyActive ? 'Alterar' : 'Configurar minha chave' }}</span>
                  <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </button>
              </div>

              <div v-if="!ownKeyActive" class="credits-progress">
                <div class="progress-meta">
                  <span class="progress-label">Créditos disponíveis</span>
                  <strong>{{ currentUser?.remainingCredits ?? 0 }} <small>/ 20</small></strong>
                </div>
                <div class="progress-bar" role="progressbar" :aria-valuenow="currentUser?.remainingCredits ?? 0" aria-valuemin="0" aria-valuemax="20" aria-label="Créditos disponíveis">
                  <div class="progress-fill" :style="{ width: `${creditPercentage}%` }"></div>
                </div>
                <div class="credits-info">
                  <span>{{ creditPercentage }}% disponível no ciclo</span>
                  <span>Renova em {{ formattedResetTime }}</span>
                </div>
              </div>
              <div v-else class="own-key-status">
                <span class="status-dot" aria-hidden="true"></span>
                <p>Uso ilimitado conforme os limites da sua própria conta.</p>
              </div>
            </div>
          </section>

          <section id="providers-section" class="profile-section providers-section" aria-labelledby="providers-title">
            <div class="section-heading section-heading-spread">
              <div class="section-heading-copy">
                <div class="heading-mark" aria-hidden="true">
                  <svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><path d="M16 2h6v6"/>
                  </svg>
                </div>
                <div>
                  <p class="section-eyebrow">Conexões</p>
                  <h2 id="providers-title" class="section-title">Seus providers</h2>
                </div>
              </div>
              <span class="section-count">{{ connectedProviderCount }}/2 conectados</span>
            </div>
            <p class="section-description">Use suas próprias chaves para escolher como suas respostas são geradas.</p>

            <div class="providers-list">
              <div class="provider-item" :class="{ 'is-active': hasGeminiKey }">
                <div class="provider-header">
                  <div class="provider-identity">
                    <div class="provider-logo provider-logo-gemini" aria-hidden="true">
                      <ProviderLogo provider="gemini" />
                    </div>
                    <div class="provider-info">
                      <span class="provider-name">Google Gemini</span>
                      <span class="provider-detail">Gemini 2.5 Flash</span>
                    </div>
                  </div>
                  <div class="provider-controls">
                    <span class="provider-badge" :class="hasGeminiKey ? 'active' : 'inactive'">
                      <span class="badge-dot" aria-hidden="true"></span>
                      {{ hasGeminiKey ? 'Conectado' : 'Não configurado' }}
                    </span>
                    <button type="button" @click="toggleProvider('gemini')" class="btn-toggle">
                      {{ activeProviderForm === 'gemini' ? 'Fechar' : (hasGeminiKey ? 'Alterar' : 'Configurar') }}
                    </button>
                  </div>
                </div>
                <div v-if="activeProviderForm === 'gemini'" class="provider-form">
                  <div class="input-group">
                    <label for="gemini-key">Chave API Gemini</label>
                    <div class="password-input">
                      <input id="gemini-key" v-model="providerKeys.gemini" :type="showKeys.gemini ? 'text' : 'password'" placeholder="AIza..." autocomplete="off" />
                      <button type="button" @click="showKeys.gemini = !showKeys.gemini" class="btn-show-hide" :aria-label="showKeys.gemini ? 'Ocultar chave Gemini' : 'Mostrar chave Gemini'">
                        <svg v-if="showKeys.gemini" class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                        <svg v-else class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                  <div class="provider-actions">
                    <button type="button" class="btn-save" @click="handleSaveKey('gemini')" :disabled="loading || !providerKeys.gemini.trim()">Salvar chave</button>
                    <button v-if="hasGeminiKey" type="button" class="btn-remove" @click="handleRemoveKey('gemini')" :disabled="loading">Remover</button>
                  </div>
                </div>
              </div>

              <div class="provider-item" :class="{ 'is-active': hasGroqKey }">
                <div class="provider-header">
                  <div class="provider-identity">
                    <div class="provider-logo provider-logo-groq" aria-hidden="true">
                      <ProviderLogo provider="groq" />
                    </div>
                    <div class="provider-info">
                      <span class="provider-name">Groq</span>
                      <span class="provider-detail">Llama 3.3</span>
                    </div>
                  </div>
                  <div class="provider-controls">
                    <span class="provider-badge" :class="hasGroqKey ? 'active' : 'inactive'">
                      <span class="badge-dot" aria-hidden="true"></span>
                      {{ hasGroqKey ? 'Conectado' : 'Não configurado' }}
                    </span>
                    <button type="button" @click="toggleProvider('groq')" class="btn-toggle">
                      {{ activeProviderForm === 'groq' ? 'Fechar' : (hasGroqKey ? 'Alterar' : 'Configurar') }}
                    </button>
                  </div>
                </div>
                <div v-if="activeProviderForm === 'groq'" class="provider-form">
                  <div class="input-group">
                    <label for="groq-key">Chave API Groq</label>
                    <div class="password-input">
                      <input id="groq-key" v-model="providerKeys.groq" :type="showKeys.groq ? 'text' : 'password'" placeholder="gsk_..." autocomplete="off" />
                      <button type="button" @click="showKeys.groq = !showKeys.groq" class="btn-show-hide" :aria-label="showKeys.groq ? 'Ocultar chave Groq' : 'Mostrar chave Groq'">
                        <svg v-if="showKeys.groq" class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                        <svg v-else class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                  <div class="provider-actions">
                    <button type="button" class="btn-save" @click="handleSaveKey('groq')" :disabled="loading || !providerKeys.groq.trim()">Salvar chave</button>
                    <button v-if="hasGroqKey" type="button" class="btn-remove" @click="handleRemoveKey('groq')" :disabled="loading">Remover</button>
                  </div>
                </div>
              </div>

              <div class="provider-item preference-item">
                <div class="provider-header">
                  <div class="provider-identity">
                    <div class="provider-logo provider-logo-preference" aria-hidden="true">
                      <svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="18" r="2"/></svg>
                    </div>
                    <div class="provider-info">
                      <span class="provider-name">IA preferida</span>
                      <span class="provider-detail">Escolha a primeira opção usada</span>
                    </div>
                  </div>
                  <span class="provider-badge preference-badge">{{ preferredProviderLabel }}</span>
                </div>
                <div class="preference-options" role="group" aria-label="Escolha sua IA preferida">
                  <button type="button" class="pref-option" :class="{ selected: preferredProvider === 'gemini' }" @click="setPreferredProvider('gemini')">
                    <ProviderLogo provider="gemini" class="pref-logo" />
                    <span class="pref-radio" aria-hidden="true"></span>
                    <span><strong>Gemini</strong><small>2.5 Flash</small></span>
                  </button>
                  <button type="button" class="pref-option" :class="{ selected: preferredProvider === 'groq' }" @click="setPreferredProvider('groq')">
                    <ProviderLogo provider="groq" class="pref-logo" />
                    <span class="pref-radio" aria-hidden="true"></span>
                    <span><strong>Groq</strong><small>Llama 3.3</small></span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section v-if="showEditForm" class="edit-panel" aria-labelledby="edit-title">
            <div class="section-heading">
              <div class="heading-mark" aria-hidden="true">
                <svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </div>
              <div>
                <p class="section-eyebrow">Dados de acesso</p>
                <h2 id="edit-title" class="section-title">Editar perfil</h2>
              </div>
            </div>
            <form class="edit-form" @submit.prevent="handleSaveProfile">
              <div class="form-field">
                <label for="profile-name-input">Nome</label>
                <input id="profile-name-input" v-model="profileForm.nome" class="form-input" type="text" autocomplete="name" maxlength="80" required />
              </div>
              <div class="form-field">
                <label for="profile-password-input">Nova senha <span>(opcional)</span></label>
                <input id="profile-password-input" v-model="profileForm.senha" class="form-input" type="password" minlength="6" autocomplete="new-password" placeholder="Mínimo de 6 caracteres" />
              </div>
              <p v-if="profileError" class="form-error" role="alert">{{ profileError }}</p>
              <div class="edit-actions">
                <button type="button" class="btn-cancel" @click="handleEdit">Cancelar</button>
                <button type="submit" class="btn-save" :disabled="profileSaving">{{ profileSaving ? 'Salvando...' : 'Salvar alterações' }}</button>
              </div>
            </form>
          </section>

          <div class="profile-actions">
            <button type="button" class="btn-action btn-edit" @click="handleEdit">
              <svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>{{ showEditForm ? 'Fechar edição' : 'Editar perfil' }}</span>
            </button>
            <button type="button" class="btn-action btn-logout" @click="handleLogout">
              <svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Sair</span>
            </button>
          </div>

          <section v-if="isAdmin" class="admin-quick-access" aria-labelledby="admin-access-title">
            <div class="section-heading">
              <div class="heading-mark" aria-hidden="true">
                <svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <p class="section-eyebrow">Área restrita</p>
                <h2 id="admin-access-title" class="section-title">Acesso de administrador</h2>
              </div>
            </div>
            <div class="access-links">
              <router-link to="/admin/usuarios" class="access-link"><svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>Gerenciar usuários</span><svg class="icon icon-sm link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></router-link>
              <router-link to="/admin/editais" class="access-link"><svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Gerenciar editais</span><svg class="icon icon-sm link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></router-link>
              <router-link to="/admin/dashboard" class="access-link"><svg class="icon icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span>Dashboard admin</span><svg class="icon icon-sm link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></router-link>
            </div>
          </section>
        </div>
      </article>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import ProviderLogo from '../components/ProviderLogo.vue'
import { logout, getCurrentUser, updateProviderConfig, updatePreferredProvider, updateProfile, setPlanMode } from '../services/api.js'
import { info, success, error as toastError } from '../utils/toast.js'

const router = useRouter()
const currentUser = ref(null)
const loading = ref(false)
const profileSaving = ref(false)
const showEditForm = ref(false)
const profileError = ref('')
const profileForm = ref({ nome: '', senha: '' })

const preferredProvider = ref('gemini')
const activeProviderForm = ref(null)
const providerKeys = ref({ gemini: '', groq: '' })
const showKeys = ref({ gemini: false, groq: false })

const userName = computed(() => currentUser.value?.nome || currentUser.value?.email?.split('@')[0] || 'Usuário')
const userInitials = computed(() => userName.value.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase())
const userEmail = computed(() => currentUser.value?.email || '')
const userRole = computed(() => currentUser.value?.role || 'user')
const userRoleLabel = computed(() => userRole.value === 'admin' ? 'Administrador' : 'Usuário')
const isAdmin = computed(() => userRole.value === 'admin')
const memberSince = computed(() => currentUser.value?.createdAt ? new Date(currentUser.value.createdAt).toLocaleDateString('pt-BR') : '---')
const hasGeminiKey = computed(() => !!currentUser.value?.has_gemini_key)
const hasGroqKey = computed(() => !!currentUser.value?.has_groq_key)
const ownKeyActive = computed(() => !!currentUser.value?.usingOwnApiKey?.active)
const preferredProviderLabel = computed(() => preferredProvider.value === 'groq' ? 'Groq' : 'Gemini')
const ownKeyProviderLabel = computed(() => {
  const p = currentUser.value?.usingOwnApiKey?.provider
  return p === 'groq' ? 'Groq' : p === 'gemini' ? 'Gemini' : preferredProviderLabel.value
})
const connectedProviderCount = computed(() => Number(hasGeminiKey.value) + Number(hasGroqKey.value))

const creditPercentage = computed(() => {
  const credits = Number(currentUser.value?.remainingCredits ?? 0)
  return Math.min(Math.max((credits / 20) * 100, 0), 100)
})

const formattedResetTime = computed(() => {
  const rawReset = currentUser.value?.lastCreditReset
  if (!rawReset) return '24h'
  const resetDate = new Date(rawReset)
  if (Number.isNaN(resetDate.getTime())) return '24h'
  resetDate.setHours(resetDate.getHours() + 24)
  const diff = resetDate.getTime() - Date.now()
  if (diff <= 0) return 'agora'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}min`
})

async function fetchUserData() {
  try {
    const response = await getCurrentUser()
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

function scrollToProviders() {
  document.getElementById('providers-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function toggleProvider(provider) {
  activeProviderForm.value = activeProviderForm.value === provider ? null : provider
  if (activeProviderForm.value === provider) providerKeys.value[provider] = ''
}

async function handleSaveKey(provider) {
  const key = providerKeys.value[provider]?.trim()
  if (!key) return
  loading.value = true
  try {
    const response = await updateProviderConfig(provider, key)
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
  const previous = preferredProvider.value
  preferredProvider.value = provider
  try {
    const response = await updatePreferredProvider(provider)
    if (response.success) success(`IA preferida: ${provider === 'gemini' ? 'Gemini' : 'Groq'}`)
  } catch (err) {
    preferredProvider.value = previous
    toastError(err.message || 'Erro ao salvar preferência')
  }
}

async function switchPlanMode(mode) {
  if (mode === 'own-key' && !ownKeyActive.value && connectedProviderCount.value === 0) {
    toastError('Configure uma chave Gemini ou Groq primeiro.')
    scrollToProviders()
    return
  }
  if (mode === (ownKeyActive.value ? 'own-key' : 'free')) return // já está neste modo
  loading.value = true
  try {
    const response = await setPlanMode(mode)
    if (response.success) {
      success(response.message || (mode === 'free' ? 'Plano da página ativado' : 'Chave própria ativada'))
      await fetchUserData()
    } else {
      toastError(response.message || 'Erro ao alterar o modo de uso')
    }
  } catch (err) {
    if (err.code === 'NO_KEY_CONFIGURED') {
      toastError('Configure uma chave Gemini ou Groq primeiro.')
      scrollToProviders()
    } else {
      toastError(err.message || 'Erro ao alterar o modo de uso')
    }
  } finally {
    loading.value = false
  }
}

function handleEdit() {
  showEditForm.value = !showEditForm.value
  profileError.value = ''
  if (showEditForm.value) profileForm.value = { nome: currentUser.value?.nome || '', senha: '' }
}

async function handleSaveProfile() {
  const nome = profileForm.value.nome.trim()
  const senha = profileForm.value.senha
  if (!nome) {
    profileError.value = 'Informe seu nome.'
    return
  }
  if (senha && senha.length < 6) {
    profileError.value = 'A senha deve ter pelo menos 6 caracteres.'
    return
  }
  profileSaving.value = true
  profileError.value = ''
  try {
    const payload = { nome }
    if (senha) payload.senha = senha
    const response = await updateProfile(payload)
    if (!response?.success) {
      profileError.value = response?.message || 'Não foi possível atualizar o perfil.'
      return
    }
    const updatedUser = response.data || response
    currentUser.value = updatedUser?.email ? updatedUser : { ...currentUser.value, nome }
    localStorage.setItem('user', JSON.stringify(currentUser.value))
    profileForm.value.senha = ''
    showEditForm.value = false
    success('Perfil atualizado com sucesso.')
  } catch (err) {
    profileError.value = err.message || 'Não foi possível atualizar o perfil.'
  } finally {
    profileSaving.value = false
  }
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
      preferredProvider.value = currentUser.value?.preferred_provider || 'gemini'
    } catch {
      currentUser.value = null
    }
  }
  await fetchUserData()
})
</script>

<style scoped>
.profile-page {
  max-width: 880px;
  margin: 0 auto;
  padding: 0.5rem 0 3rem;
  font-family: var(--font-body);
}

.profile-card {
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
}

.profile-banner {
  position: relative;
  display: flex;
  min-height: 185px;
  align-items: flex-start;
  justify-content: space-between;
  overflow: hidden;
  padding: 2rem 2.5rem 4rem;
  color: var(--color-text-inverse);
  background: linear-gradient(124deg, var(--color-primary-800), var(--color-primary-600) 62%, var(--color-primary-500));
}

.banner-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.23;
  background-image: linear-gradient(135deg, transparent 42%, rgba(255, 255, 255, 0.18) 43%, transparent 44%), linear-gradient(45deg, transparent 65%, rgba(255, 255, 255, 0.12) 66%, transparent 67%);
  background-size: 54px 54px, 72px 72px;
  mask-image: linear-gradient(90deg, black, transparent 88%);
}

.banner-copy,
.avatar-wrapper { position: relative; z-index: 1; }
.banner-copy { display: grid; gap: 0.5rem; max-width: 23rem; }
.banner-kicker { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.78; }
.banner-caption { max-width: 18rem; font-family: var(--font-display); font-size: clamp(1.25rem, 3vw, 1.7rem); line-height: 1.06; }

.avatar-wrapper { position: absolute; right: 2.5rem; bottom: -38px; }
.avatar { display: grid; width: 104px; height: 104px; place-items: center; border: 4px solid var(--color-surface); border-radius: 50%; background: var(--color-surface); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22), 0 0 0 3px var(--color-primary-300); }
.avatar-initials { font-family: var(--font-display); font-size: 2.2rem; font-weight: 700; color: var(--color-primary-700); }
.avatar-status { position: absolute; right: 3px; bottom: 6px; width: 18px; height: 18px; border: 3px solid var(--color-surface); border-radius: 50%; background: var(--color-success-500); }

.profile-body { padding: 2.75rem 2.5rem 2.5rem; }
.profile-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 1.25rem; padding-bottom: 1.75rem; border-bottom: 1px solid var(--color-border); }
.section-eyebrow { margin: 0 0 0.35rem; color: var(--color-primary-600); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.13em; text-transform: uppercase; }
.profile-name, .section-title { font-family: var(--font-display); color: var(--color-gray-900); }
.profile-name { margin: 0; font-size: clamp(1.8rem, 4vw, 2.45rem); line-height: 1; letter-spacing: -0.03em; }
.profile-email { margin: 0.5rem 0 0; color: var(--color-text-muted); font-size: 0.9rem; }
.role-badge, .provider-badge, .plan-status, .section-count { display: inline-flex; align-items: center; gap: 0.4rem; border-radius: var(--radius-full); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.04em; white-space: nowrap; }
.role-badge { padding: 0.5rem 0.75rem; color: var(--color-text-secondary); background: var(--color-surface-2); border: 1px solid var(--color-border); }
.role-badge.admin { color: var(--color-primary-700); background: var(--color-primary-50); border-color: var(--color-primary-200); }

.details-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin: 1.5rem 0 0; padding: 0; }
.detail-card { display: flex; min-width: 0; align-items: center; gap: 0.7rem; padding: 0.9rem; background: var(--color-surface-2); border: 1px solid transparent; border-radius: var(--radius-lg); }
.detail-icon, .heading-mark { display: grid; flex: 0 0 auto; place-items: center; color: var(--color-primary-600); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.detail-icon { width: 36px; height: 36px; }
.heading-mark { width: 38px; height: 38px; color: var(--color-primary-700); background: var(--color-primary-50); border-color: var(--color-primary-100); }
.detail-content { display: grid; min-width: 0; gap: 0.18rem; }
.detail-label { color: var(--color-text-muted); font-size: 0.63rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.detail-value { overflow: hidden; margin: 0; color: var(--color-gray-900); font-size: 0.78rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.email-value { font-family: var(--font-body); }

.profile-section { margin-top: 2.5rem; padding-top: 2.25rem; border-top: 1px solid var(--color-border); scroll-margin-top: 1rem; }
.section-heading { display: flex; align-items: center; gap: 0.75rem; }
.section-heading-spread { justify-content: space-between; }
.section-heading-copy { display: flex; align-items: center; gap: 0.75rem; }
.section-title { margin: 0; font-size: 1.55rem; line-height: 1; letter-spacing: -0.02em; }
.section-description { margin: 0.75rem 0 1.25rem 3.1rem; color: var(--color-text-muted); font-size: 0.82rem; }
.section-count { padding: 0.45rem 0.7rem; color: var(--color-text-secondary); background: var(--color-surface-2); }

.plan-card { margin-top: 1.25rem; padding: 1.25rem; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: linear-gradient(135deg, var(--color-surface-2), var(--color-surface)); }
.plan-card.own-key { border-color: var(--color-primary-300); background: linear-gradient(135deg, var(--color-primary-50), var(--color-surface)); }
.plan-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.plan-info { min-width: 0; }
.plan-title-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.plan-badge { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--color-gray-900); font-size: 0.92rem; font-weight: 800; }
.plan-status { padding: 0.3rem 0.55rem; color: var(--color-primary-700); background: var(--color-primary-100); }
.plan-ia { margin: 0.45rem 0 0; color: var(--color-text-muted); font-size: 0.78rem; }

/* Seletor de modo de uso (plano da página vs chave própria) */
.plan-mode-switcher { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin: 0 0 1.25rem; }
.plan-mode-option { display: flex; align-items: center; gap: 0.75rem; padding: 0.9rem 1rem; text-align: left; color: var(--color-text-secondary); background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-lg); cursor: pointer; transition: border-color var(--transition-fast), background var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast); }
.plan-mode-option:hover { border-color: var(--color-primary-300); color: var(--color-primary-700); }
.plan-mode-option.selected { border-color: var(--color-primary-500); background: var(--color-primary-50); color: var(--color-primary-700); box-shadow: var(--shadow-sm); }
.plan-mode-radio { width: 14px; height: 14px; flex: 0 0 auto; border: 2px solid currentColor; border-radius: 50%; box-shadow: inset 0 0 0 3px var(--color-surface-2); }
.plan-mode-option.selected .plan-mode-radio { background: var(--color-primary-600); box-shadow: inset 0 0 0 3px var(--color-primary-50); }
.plan-mode-copy strong, .plan-mode-copy small { display: block; }
.plan-mode-copy strong { font-size: 0.82rem; }
.plan-mode-copy small { margin-top: 0.15rem; color: var(--color-text-muted); font-size: 0.68rem; line-height: 1.4; }
@media (max-width: 480px) { .plan-mode-switcher { grid-template-columns: 1fr; } }
.btn-toggle { display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem; flex-shrink: 0; padding: 0.6rem 0.85rem; color: var(--color-gray-700); font: 700 0.75rem var(--font-body); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; transition: transform var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast); }
.btn-toggle:hover { color: var(--color-primary-700); background: var(--color-primary-50); border-color: var(--color-primary-300); transform: translateY(-1px); }
.credits-progress { margin-top: 1.35rem; }
.progress-meta, .credits-info { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.progress-meta { margin-bottom: 0.55rem; }
.progress-label, .credits-info { color: var(--color-text-muted); font-size: 0.7rem; }
.progress-meta strong { color: var(--color-gray-900); font-size: 0.95rem; }
.progress-meta small { color: var(--color-text-muted); font-size: 0.7rem; font-weight: 600; }
.progress-bar { position: relative; height: 10px; overflow: hidden; border-radius: var(--radius-full); background: var(--color-border); }
.progress-bar::after { position: absolute; inset: 0; content: ''; opacity: 0.32; background: repeating-linear-gradient(120deg, transparent 0 12px, rgba(255, 255, 255, 0.38) 12px 14px); }
.progress-fill { position: relative; height: 100%; min-width: 0.5rem; border-radius: inherit; background: linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600)); box-shadow: var(--shadow-primary); transition: width 400ms ease; }
.credits-info { margin-top: 0.55rem; }
.own-key-status { display: flex; align-items: center; gap: 0.6rem; margin-top: 1.25rem; padding: 0.8rem; color: var(--color-primary-700); font-size: 0.78rem; background: var(--color-primary-50); border-radius: var(--radius-md); }
.own-key-status p { margin: 0; }
.status-dot, .badge-dot { display: inline-block; flex: 0 0 auto; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

.providers-list { display: grid; gap: 0.75rem; }
.provider-item { overflow: hidden; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: var(--color-surface); transition: border-color var(--transition-fast), box-shadow var(--transition-fast); }
.provider-item:hover, .provider-item.is-active { border-color: var(--color-primary-300); box-shadow: var(--shadow-sm); }
.provider-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.1rem; }
.provider-identity, .provider-controls { display: flex; align-items: center; gap: 0.75rem; }
.provider-controls { gap: 0.6rem; }
.provider-logo { display: grid; width: 38px; height: 38px; flex: 0 0 auto; place-items: center; border-radius: var(--radius-md); }
.provider-logo svg { width: 20px; height: 20px; }
.provider-logo-gemini { color: var(--color-primary-700); background: var(--color-primary-50); }
.provider-logo-groq { color: var(--color-warning-700); background: var(--color-warning-50); }
.provider-logo-preference { color: var(--color-info-600); background: var(--color-info-50); }
.pref-logo { width: 18px; height: 18px; color: var(--color-text-muted); flex: 0 0 auto; }
.pref-option.selected .pref-logo { color: var(--color-primary-700); }
.provider-info { display: grid; min-width: 0; gap: 0.18rem; }
.provider-name { color: var(--color-gray-900); font-size: 0.88rem; font-weight: 800; }
.provider-detail { color: var(--color-text-muted); font-size: 0.7rem; }
.provider-badge { padding: 0.38rem 0.55rem; }
.provider-badge.active { color: var(--color-success-600); background: var(--color-success-50); }
.provider-badge.inactive { color: var(--color-text-muted); background: var(--color-surface-2); }
.preference-badge { color: var(--color-info-600); background: var(--color-info-50); }
.provider-form { padding: 1.1rem; border-top: 1px solid var(--color-border); background: var(--color-surface-2); }
.input-group, .form-field { display: grid; gap: 0.45rem; }
.input-group label, .form-field label { color: var(--color-text-secondary); font-size: 0.7rem; font-weight: 800; }
.password-input { position: relative; display: flex; align-items: center; }
.password-input input, .form-input { width: 100%; box-sizing: border-box; padding: 0.72rem 0.85rem; color: var(--color-text); font: 0.82rem var(--font-body); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); outline: none; transition: border-color var(--transition-fast), box-shadow var(--transition-fast); }
.password-input input { padding-right: 2.8rem; }
.password-input input:focus, .form-input:focus { border-color: var(--color-primary-500); box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.14); }
.btn-show-hide { position: absolute; right: 0.55rem; display: grid; width: 28px; height: 28px; place-items: center; padding: 0; color: var(--color-text-muted); background: transparent; border: 0; border-radius: var(--radius-sm); cursor: pointer; }
.btn-show-hide:hover { color: var(--color-primary-600); background: var(--color-primary-50); }
.provider-actions, .edit-actions { display: flex; gap: 0.6rem; margin-top: 0.85rem; }
.btn-save, .btn-remove, .btn-cancel { flex: 1; padding: 0.68rem 0.85rem; border-radius: var(--radius-md); font: 700 0.76rem var(--font-body); cursor: pointer; transition: transform var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast); }
.btn-save { color: var(--color-text-inverse); background: var(--color-primary-600); border: 1px solid var(--color-primary-600); }
.btn-save:hover:not(:disabled) { background: var(--color-primary-700); transform: translateY(-1px); }
.btn-remove { color: var(--color-danger-600); background: transparent; border: 1px solid var(--color-danger-500); }
.btn-remove:hover:not(:disabled) { background: var(--color-danger-50); transform: translateY(-1px); }
.btn-save:disabled, .btn-remove:disabled { cursor: not-allowed; opacity: 0.55; }
.preference-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.65rem; padding: 0 1.1rem 1.1rem; }
.pref-option { display: flex; align-items: center; gap: 0.65rem; padding: 0.75rem; color: var(--color-text-secondary); text-align: left; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; transition: border-color var(--transition-fast), background var(--transition-fast), color var(--transition-fast); }
.pref-option:hover, .pref-option.selected { color: var(--color-primary-700); border-color: var(--color-primary-400); background: var(--color-primary-50); }
.pref-option strong, .pref-option small { display: block; }
.pref-option strong { font-size: 0.76rem; }
.pref-option small { margin-top: 0.12rem; color: var(--color-text-muted); font-size: 0.65rem; }
.pref-radio { width: 12px; height: 12px; flex: 0 0 auto; border: 2px solid currentColor; border-radius: 50%; box-shadow: inset 0 0 0 3px var(--color-surface-2); }
.pref-option.selected .pref-radio { background: var(--color-primary-600); box-shadow: inset 0 0 0 3px var(--color-primary-50); }

.edit-panel { margin-top: 2.25rem; padding: 1.25rem; border: 1px solid var(--color-primary-200); border-radius: var(--radius-xl); background: var(--color-primary-50); }
.edit-form { display: grid; gap: 1rem; margin-top: 1.25rem; }
.edit-form .form-input { background: var(--color-surface); }
.form-field label span { color: var(--color-text-muted); font-weight: 500; }
.form-error { margin: 0; color: var(--color-danger-600); font-size: 0.75rem; font-weight: 700; }
.btn-cancel { color: var(--color-text-secondary); background: var(--color-surface); border: 1px solid var(--color-border); }
.btn-cancel:hover { color: var(--color-gray-900); background: var(--color-surface-2); }

.profile-actions { display: flex; gap: 0.75rem; margin-top: 2.25rem; }
.btn-action { display: inline-flex; flex: 1; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.8rem 1rem; border-radius: var(--radius-md); font: 800 0.78rem var(--font-body); cursor: pointer; transition: transform var(--transition-fast), background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast); }
.btn-action:hover { transform: translateY(-1px); }
.btn-edit { color: var(--color-text-inverse); background: var(--color-primary-600); border: 1px solid var(--color-primary-600); }
.btn-edit:hover { background: var(--color-primary-700); }
.btn-logout { color: var(--color-text-secondary); background: var(--color-surface-2); border: 1px solid var(--color-border); }
.btn-logout:hover { color: var(--color-danger-600); background: var(--color-danger-50); border-color: var(--color-danger-500); }

.admin-quick-access { margin-top: 2.25rem; padding: 1.25rem; border: 1px solid var(--color-primary-200); border-radius: var(--radius-xl); background: var(--color-primary-50); }
.access-links { display: grid; gap: 0.5rem; margin-top: 1.1rem; }
.access-link { display: flex; align-items: center; gap: 0.7rem; padding: 0.78rem 0.8rem; color: var(--color-text-secondary); font-size: 0.78rem; font-weight: 700; background: var(--color-surface); border: 1px solid transparent; border-radius: var(--radius-md); transition: color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast); }
.access-link:hover { color: var(--color-primary-700); border-color: var(--color-primary-300); transform: translateX(2px); }
.link-arrow { margin-left: auto; color: var(--color-primary-600); }

.icon { display: block; flex: 0 0 auto; }
.icon-sm { width: 14px; height: 14px; }
.icon-md { width: 18px; height: 18px; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 2px; }

@media (max-width: 760px) {
  .profile-page { padding: 0 0 2rem; }
  .profile-body { padding: 2.5rem 1.25rem 1.5rem; }
  .profile-banner { padding: 1.5rem 1.25rem 4rem; }
  .avatar-wrapper { right: 1.25rem; }
  .details-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 520px) {
  .profile-card { border-right: 0; border-left: 0; border-radius: 0; }
  .profile-intro, .plan-header, .provider-header { align-items: flex-start; flex-direction: column; }
  .profile-intro { gap: 0.75rem; }
  .provider-controls { width: 100%; justify-content: space-between; }
  .provider-controls .btn-toggle { margin-left: auto; }
  .section-heading-spread { align-items: flex-start; flex-direction: column; gap: 0.65rem; }
  .section-description { margin-left: 0; }
  .details-grid, .preference-options { grid-template-columns: 1fr; }
  .profile-actions { flex-direction: column; }
}
</style>
