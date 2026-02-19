<script setup>
defineProps({
  show: Boolean
})

defineEmits(['close'])
</script>

<template>
  <transition name="popup-scale">
    <div v-if="show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="$emit('close')">
      <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all">
        <!-- Decorative Elements -->
        <div class="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.1)_0%,transparent_50%)] pointer-events-none"></div>
        <div class="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none"></div>
        
        <!-- Content -->
        <div class="relative z-10 p-8 sm:p-10 flex flex-col items-center text-center">
          <!-- Animated Icon -->
          <div class="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div class="absolute inset-0 border-2 border-primary-500/20 rounded-full animate-[ping_2s_ease-out_infinite]"></div>
            <div class="absolute inset-0 border-2 border-primary-500/20 rounded-full animate-[ping_2s_ease-out_infinite_1s]"></div>
            <svg class="w-10 h-10 text-primary-500 animate-[bounce_3s_infinite]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>

          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-xs font-bold uppercase tracking-wide mb-6">
            <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Under Development</span>
          </div>

          <!-- Title -->
          <h2 class="text-2xl sm:text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-br from-surface-900 to-surface-600 mb-3">
            Welcome to Our Preview
          </h2>

          <!-- Message -->
          <p class="text-surface-600 mb-8 leading-relaxed max-w-sm">
            We're putting the finishing touches on something amazing! 
            This site is currently in <strong>demo mode</strong> — feel free to explore 
            our products and checkout flow.
          </p>

          <!-- Feature List -->
          <div class="flex flex-col gap-3 w-full max-w-xs mb-8">
            <div class="flex items-center gap-3 text-sm text-surface-600">
              <svg class="w-5 h-5 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Browse our complete catalog</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-surface-600">
               <svg class="w-5 h-5 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Test the shopping experience</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-surface-600">
               <svg class="w-5 h-5 text-emerald-500 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Place sample orders (not processed)</span>
            </div>
          </div>

          <!-- Notice -->
          <div class="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl w-full mb-8 text-left">
            <svg class="w-5 h-5 text-red-500 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span class="text-xs text-red-800 leading-relaxed">
              Orders placed here are for demonstration purposes only and will not be fulfilled or charged.
            </span>
          </div>

          <!-- CTA Button -->
          <button 
            class="group w-full max-w-xs flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-300"
            @click="$emit('close')"
          >
            <span>Continue Exploring</span>
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.popup-scale-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.popup-scale-leave-active {
  transition: all 0.3s ease-out;
}

.popup-scale-enter-from,
.popup-scale-leave-to {
  opacity: 0;
}

.popup-scale-enter-from .relative,
.popup-scale-leave-to .relative {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}
</style>
