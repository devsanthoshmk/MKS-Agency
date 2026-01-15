<script setup>
import { useUI } from '../composables/useUI'

const { notifications, removeToast } = useUI()

function getToastClasses(type) {
  switch (type) {
    case 'success':
      return 'bg-green-600 text-white'
    case 'error':
      return 'bg-red-600 text-white'
    case 'warning':
      return 'bg-yellow-500 text-white'
    default:
      return 'bg-surface-800 text-white'
  }
}

function getIcon(type) {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    default:
      return 'ℹ'
  }
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
    <transition-group name="toast">
      <div 
        v-for="toast in notifications" 
        :key="toast.id"
        class="pointer-events-auto px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-70 max-w-100"
        :class="getToastClasses(toast.type)"
      >
        <span class="shrink-0">{{ getIcon(toast.type) }}</span>
        <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
        <button 
          class="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          @click="removeToast(toast.id)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active {
  animation: slideIn 0.3s ease-out;
}

.toast-leave-active {
  animation: slideOut 0.2s ease-in;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100px);
  }
}
</style>
