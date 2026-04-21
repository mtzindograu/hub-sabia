<template>
  <!-- Se logado: Chat com DashboardLayout -->
  <DashboardLayout v-if="isLoggedIn" page-title="Chat IA">
    <Chat />
  </DashboardLayout>
  <!-- Se visitante: Chat standalone com sua própria sidebar -->
  <Chat v-else />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Chat from './Chat.vue'

const isLoggedIn = ref(false)

onMounted(() => {
  isLoggedIn.value = !!localStorage.getItem('auth_token')
})
</script>
