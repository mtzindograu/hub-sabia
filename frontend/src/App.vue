<template>
  <div class="app-container">
    <!-- Toast Notifications -->
    <ToastContainer />
    
    <!-- Main Content -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import ToastContainer from './components/ToastContainer.vue'
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.main-content {
  min-height: 100vh;
}

/* Page Transitions */
.page-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-leave-active {
  transition: opacity 0.15s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
}
</style>
