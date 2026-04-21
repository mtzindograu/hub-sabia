/**
 * Toast Notification System
 * Reactive toast management using Vue reactivity
 */

import { reactive } from 'vue'

const state = reactive({
  toasts: []
})

let nextId = 1

export function showToast(message, type = 'info', duration = 4000) {
  const id = nextId++
  const toast = { id, message, type, duration }
  
  state.toasts.push(toast)
  
  setTimeout(() => {
    removeToast(id)
  }, duration)
}

export function removeToast(id) {
  const index = state.toasts.findIndex(t => t.id === id)
  if (index > -1) {
    state.toasts.splice(index, 1)
  }
}

export function getToasts() {
  return state.toasts
}

// Helper functions
export function success(message) {
  showToast(message, 'success')
}

export function error(message) {
  showToast(message, 'error', 6000)
}

export function info(message) {
  showToast(message, 'info')
}

export function warning(message) {
  showToast(message, 'warning', 5000)
}

export default { showToast, removeToast, getToasts, success, error, info, warning }
