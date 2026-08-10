<template>
  <div v-if="isVisible" class="provider-onboarding-overlay">
    <div class="tutorial-container">
      <div class="tutorial-header">
        <h1>HubSabia IA</h1>
        <p>Escolha como você deseja utilizar o HubSabia.</p>
      </div>

      <div class="plan-options">
        <!-- Plano Gratuito -->
        <div class="plan-card primary">
          <span class="plan-badge">🟢 Recomendado</span>
          <h3>Plano Gratuito HubSabia</h3>
          <p class="ia-info">IA utilizada: Gemini 2.5 Flash</p>
          <ul class="plan-features">
            <li>• 20 créditos diários</li>
            <li>• Renovação automática</li>
            <li>• Não precisa configurar chave</li>
          </ul>
          <button class="btn-primary" @click="$emit('select-plan', 'free')">
            Utilizar gratuitamente
          </button>
        </div>

        <!-- Chave Própria -->
        <div class="plan-card">
          <span class="plan-badge">🔑 Avançado</span>
          <h3>Minha Chave de IA</h3>
          <p class="ia-description">Utilize sua própria chave API para uso ilimitado conforme sua própria conta.</p>
          <router-link to="/perfil" class="btn-secondary">
            Configurar minha chave
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
});

defineEmits(['select-plan']);
</script>

<style scoped>
/* AI Provider Onboarding Styles */
.provider-onboarding-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
}

.tutorial-container {
  max-width: 800px;
  width: 100%;
  text-align: center;
}

.tutorial-header {
  margin-bottom: 2rem;
}

.tutorial-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.plan-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.plan-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-card.primary {
  border-color: var(--color-primary-500);
}

.plan-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--color-primary-100);
  color: var(--color-primary-800);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 600;
}

.plan-features {
  list-style: none;
  text-align: left;
  margin: 1rem 0;
}
</style>
