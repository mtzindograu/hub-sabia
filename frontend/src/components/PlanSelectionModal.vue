<template>
  <div v-if="isVisible" class="plan-modal-overlay">
    <div class="plan-modal">
      <div class="plan-modal-header">
        <h1>HubSabia IA</h1>
        <p>Escolha como você quer usar</p>
      </div>

      <div class="plan-options">
        <!-- Plano Gratuito -->
        <div class="plan-option free">
          <span class="plan-option-label">Recomendado</span>
          <h3>Plano Gratuito</h3>
          <p>20 créditos por dia, renovação automática.</p>
          <button class="btn btn-primary btn-block" @click="$emit('select-plan', 'free')">
            Utilizar gratuitamente
          </button>
        </div>

        <!-- Chave Própria -->
        <div class="plan-option">
          <h3>Sua Chave de IA</h3>
          <p>Use sua conta para não ter limite de créditos.</p>
          <router-link to="/perfil" class="btn btn-outline btn-block">
            Configurar minha chave
          </router-link>
        </div>
      </div>

      <p class="plan-modal-footer">IA padrão: Gemini 2.5 Flash</p>
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
.plan-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-bg);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
}

.plan-modal {
  max-width: 640px;
  width: 100%;
}

.plan-modal-header {
  text-align: center;
  margin-bottom: 2rem;
}

.plan-modal-header h1 {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.375rem;
}

.plan-modal-header p {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

.plan-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.plan-option {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.plan-option.free {
  border-color: var(--color-primary-500);
  box-shadow: var(--shadow-primary);
}

.plan-option-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-primary-600);
}

.plan-option h3 {
  font-size: 1.125rem;
  margin: 0;
}

.plan-option p {
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin: 0 0 0.75rem;
}

/* Pina o botão na base do card e fixa a altura (btn-outline tem borda 2px e fica
   4px mais alto que btn-primary; com height fixa + border-box, ambos alinham) */
.plan-option .btn {
  margin-top: auto;
  height: 44px;
}

.plan-modal-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
</style>
