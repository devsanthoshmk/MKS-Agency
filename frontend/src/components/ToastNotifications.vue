<script setup>
import { useUI } from '../composables/useUI'

const { notifications, removeToast } = useUI()

function getToastClasses(type) {
  switch (type) {
    case 'success':
      return 'bg-white border-l-4 border-emerald-500'
    case 'error':
      return 'bg-white border-l-4 border-red-500'
    case 'warning':
      return 'bg-white border-l-4 border-amber-500'
    default:
      return 'bg-white border-l-4 border-primary-500'
  }
}
</script>

<template>
  <div class="fixed top-24 right-4 z-50 flex flex-col gap-3 pointer-events-none sm:min-w-[320px]">
    <transition-group name="toast">
      <div 
        v-for="toast in notifications" 
        :key="toast.id"
        class="pointer-events-auto p-4 rounded-xl shadow-xl flex items-start gap-3 bg-white/95 backdrop-blur-md border border-surface-100 transform transition-all duration-300"
        :class="getToastClasses(toast.type)"
      >
        <!-- Icons -->
        <span class="shrink-0 mt-0.5">
          <svg v-if="toast.type === 'success'" class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <svg v-else-if="toast.type === 'error'" class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <svg v-else-if="toast.type === 'warning'" class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <svg v-else class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </span>
        
        <div class="flex-1 min-w-0">
           <h4 class="font-bold text-sm text-surface-900 capitalize">{{ toast.type }}</h4>
           <p class="text-sm text-surface-600 leading-snug">{{ toast.message }}</p>
        </div>
        
        <button 
          class="shrink-0 text-surface-400 hover:text-surface-600 transition-colors p-1"
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
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.toast-move {
  transition: transform 0.4s ease;
}
</style>
