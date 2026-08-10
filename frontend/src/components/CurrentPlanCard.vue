<template>
  <div class="current-plan-card card">
    <div class="plan-info">
      <h3>{{ user.currentPlan?.name || 'Carregando...' }}</h3>
      <p class="text-muted">IA: {{ getProviderName() }}</p>
    </div>

    <div class="credit-status">
      <div class="credit-details">
        <span class="text-sm">Créditos</span>
        <span class="text-sm font-semibold">
          {{ user.usingOwnApiKey?.active ? '∞' : `${user.remainingCredits || 0} / 20` }}
        </span>
      </div>
      
      <div v-if="!user.usingOwnApiKey?.active" class="progress-bar-bg">
        <div class="progress-bar-fill" :style="{ width: getProgress() + '%' }"></div>
      </div>
      <p v-else class="text-sm text-muted">Uso ilimitado (Chave Própria)</p>
    </div>

    <button class="btn btn-secondary btn-block btn-sm" @click="$emit('open-modal')">
      Alterar plano
    </button>
    <router-link to="/perfil" class="text-sm text-muted text-center" style="margin-top: 0.5rem; display: block;">
      Utilizar minha própria chave
    </router-link>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

defineEmits(['open-modal']);

function getProviderName() {
  if (props.user.usingOwnApiKey?.active) {
    return props.user.usingOwnApiKey.provider || 'Personalizada';
  }
  return 'Gemini 2.5 Flash';
}

function getProgress() {
  const credits = props.user.remainingCredits || 0;
  return Math.min((credits / 20) * 100, 100);
}
</script>

<style scoped>
.current-plan-card {
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-info h3 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.credit-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.progress-bar-bg {
  height: 8px;
  background: var(--color-gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary-500);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}
</style>
