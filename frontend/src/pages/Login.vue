<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- Back to Home -->
      <router-link to="/" class="back-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
        Voltar
      </router-link>

      <!-- Logo -->
      <div class="auth-logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>
        <h1>HubSabia</h1>
      </div>

      <!-- Tabs -->
      <div class="auth-tabs">
        <button
          :class="['tab', { active: isLogin }]"
          @click="isLogin = true"
        >
          Entrar
        </button>
        <button
          :class="['tab', { active: !isLogin }]"
          @click="isLogin = false"
        >
          Criar Conta
        </button>
      </div>

      <!-- Login Form -->
      <form v-if="isLogin" @submit.prevent="handleLogin" class="auth-form">
        <h2>Bem-vindo de volta!</h2>
        <p class="form-subtitle">Faça login para acessar o sistema</p>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            v-model="loginForm.email"
            type="email"
            class="form-input"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Senha</label>
          <input
            v-model="loginForm.senha"
            type="password"
            class="form-input"
            placeholder="Sua senha"
            required
          />
        </div>

        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Entrar</span>
        </button>

        <div class="demo-credentials">
          <p><strong>Credenciais de teste:</strong></p>
          <p>Admin: admin@hubsabia.com / admin123</p>
        </div>
      </form>

      <!-- Register Form -->
      <form v-else @submit.prevent="handleRegister" class="auth-form">
        <h2>Crie sua conta</h2>
        <p class="form-subtitle">Preencha os dados abaixo</p>

        <div class="form-group">
          <label class="form-label">Nome</label>
          <input
            v-model="registerForm.nome"
            type="text"
            class="form-input"
            placeholder="Seu nome completo"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            v-model="registerForm.email"
            type="email"
            class="form-input"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Senha</label>
          <input
            v-model="registerForm.senha"
            type="password"
            class="form-input"
            placeholder="Mínimo 6 caracteres"
            minlength="6"
            required
          />
        </div>

        <p class="form-hint-register">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hint-icon">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Todas as contas são criadas como usuário comum.
        </p>

        <div v-if="error" class="alert alert-error">
          {{ error }}
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Criar Conta</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login, registerUser } from '../services/api.js'
import { success, error as showError } from '../utils/toast.js'

const router = useRouter()
const route = useRoute()

const isLogin = ref(true)

// Se já estiver logado, redirecionar
onMounted(() => {
  // Verificar se veio com ?tab=register
  if (route.query.tab === 'register') {
    isLogin.value = false
  }

  const token = localStorage.getItem('auth_token')
  const storedUser = localStorage.getItem('user')
  if (token && storedUser) {
    try {
      const user = JSON.parse(storedUser)
      if (user.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch {
      // Dados corrompidos - limpar
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }
  }
})

const loading = ref(false)
const error = ref('')

const loginForm = ref({
  email: '',
  senha: ''
})

const registerForm = ref({
  nome: '',
  email: '',
  senha: ''
})

async function handleLogin() {
  try {
    loading.value = true
    error.value = ''

    const result = await login(loginForm.value)

    if (!result.data || !result.data.user || !result.data.token) {
      throw new Error('Resposta do servidor inválida')
    }

    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')

    localStorage.setItem('auth_token', result.data.token)
    localStorage.setItem('user', JSON.stringify(result.data.user))

    success('Login realizado com sucesso!')

    const userRole = result.data.user?.role || 'user'
    if (userRole === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/dashboard')
    }
  } catch (err) {
    console.error('Erro no login:', err)
    showError(err.message || 'Erro ao fazer login. Verifique suas credenciais.')
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  try {
    loading.value = true
    error.value = ''

    await registerUser(registerForm.value)
    success('Conta criada com sucesso! Faça login para continuar.')

    // Auto-login após registro
    const result = await login({
      email: registerForm.value.email,
      senha: registerForm.value.senha
    })

    localStorage.setItem('auth_token', result.data.token)
    localStorage.setItem('user', JSON.stringify(result.data.user))

    success('Bem-vindo ao HubSabia!')

    const userRole = result.data.user?.role || 'user'
    if (userRole === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/dashboard')
    }
  } catch (err) {
    error.value = err.message || 'Erro ao criar conta'
    showError(err.message || 'Erro ao criar conta. Tente novamente.')
  } finally {
    loading.value = false
  }
}

// Watch for route query changes
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab === 'register') {
      isLogin.value = false
    } else {
      isLogin.value = true
    }
  }
)
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--color-bg);
}

.auth-container {
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  position: relative;
  border: 1px solid var(--color-border);
}

.back-link {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-gray-500);
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.back-link:hover {
  background: var(--color-surface-2);
  color: var(--color-primary-600);
}

.back-link svg {
  width: 18px;
  height: 18px;
}

.auth-logo {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  box-shadow: var(--shadow-primary);
}

.logo-icon svg {
  width: 30px;
  height: 30px;
  color: var(--color-text-inverse);
}

.auth-logo h1 {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Tabs */
.auth-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: var(--color-surface-2);
  padding: 0.25rem;
  border-radius: var(--radius-lg);
}

.tab {
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: transparent;
  color: var(--color-gray-500);
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.tab:hover {
  color: var(--color-gray-700);
}

.tab.active {
  background: var(--color-surface);
  color: var(--color-primary-600);
  box-shadow: var(--shadow-md);
}

/* Form */
.auth-form {
  text-align: center;
}

.auth-form h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
}

.form-subtitle {
  color: var(--color-gray-500);
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.25rem;
  text-align: left;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  transition: all var(--transition-fast);
  background: var(--color-surface);
  color: var(--color-text);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.form-hint,
.form-hint-register {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-gray-500);
  margin-top: 0.5rem;
  line-height: 1.4;
}

.form-hint-register {
  text-align: left;
  margin-bottom: 1.25rem;
}

.hint-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.btn-block {
  width: 100%;
  padding: 0.875rem;
  margin-top: 1rem;
}

.demo-credentials {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-surface-2);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  color: var(--color-gray-600);
  text-align: left;
}

.demo-credentials p {
  margin: 0.25rem 0;
}

/* Alert */
.alert {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  margin-top: 1rem;
  font-size: 0.875rem;
}

.alert-error {
  background: var(--color-danger-50);
  color: var(--color-danger-700);
  border: 1px solid #fecaca;
}

/* Responsive */
@media (max-width: 640px) {
  .auth-page {
    padding: 1rem;
  }

  .auth-container {
    padding: 1.5rem;
  }
}
</style>
