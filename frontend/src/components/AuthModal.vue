<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useUI } from '../composables/useUI'

const { isAuthModalOpen, closeAuthModal, loginWithGoogle, sendLoginEmail, isLoading, error } = useAuth()
const { success } = useUI()

const googleLoaded = ref(false)
const emailInput = ref('')
const emailError = ref('')
const emailSent = ref(false)
const emailSentTo = ref('')

onMounted(() => {
  // Load Google Sign-In script
  if (!window.google) {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initializeGoogle
    document.head.appendChild(script)
  } else {
    initializeGoogle()
  }
})

function initializeGoogle() {
  if (window.google) {
    googleLoaded.value = true
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      callback: handleGoogleCallback,
      auto_select: false,
      cancel_on_tap_outside: true
    })
  }
}

async function handleGoogleCallback(response) {
  const result = await loginWithGoogle(response.credential)
  if (result) {
    success('Signed in successfully!')
  }
}

function renderGoogleButton() {
  if (window.google && googleLoaded.value) {
    const container = document.getElementById('google-signin-button')
    if (container) {
      container.innerHTML = ''
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      })
    }
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function handleEmailSubmit() {
  emailError.value = ''
  
  if (!emailInput.value.trim()) {
    emailError.value = 'Please enter your email'
    return
  }
  
  if (!validateEmail(emailInput.value)) {
    emailError.value = 'Please enter a valid email'
    return
  }
  
  const result = await sendLoginEmail(emailInput.value)
  
  if (result.success) {
    emailSent.value = true
    emailSentTo.value = emailInput.value
    success('Login link sent!')
  } else {
    emailError.value = result.error || 'Failed to send login link'
  }
}

function resetEmailState() {
  emailSent.value = false
  emailSentTo.value = ''
  emailInput.value = ''
  emailError.value = ''
}

// Re-render button when modal opens
watch(isAuthModalOpen, (open) => {
  if (open) {
    setTimeout(renderGoogleButton, 100)
    resetEmailState()
  }
})
</script>

<template>
  <transition name="fade">
    <div 
      v-if="isAuthModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Overlay -->
      <!-- <div class="overlay" @click="closeAuthModal" /> -->
      
      <!-- Modal -->
      <div class="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-surface-100/50">
        <!-- Close Button -->
        <button 
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-surface-50 hover:bg-surface-100 text-surface-400 hover:text-surface-900 transition-colors"
          @click="closeAuthModal"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <!-- Header -->
        <div class="pt-10 px-8 text-center">
            <div class="inline-block w-20 h-20 rounded-2xl overflow-hidden shadow-lg mb-6 ring-4 ring-surface-50">
                <img src="/logo.jpeg" alt="MKS AGENCY" class="w-full h-full object-cover" />
            </div>
            <h2 class="text-3xl font-display font-medium text-surface-900 mb-2">Welcome Back</h2>
            <p class="text-surface-500 text-sm">Sign in to access your account & orders</p>
        </div>

        <!-- Content -->
        <div class="p-8">
          <!-- Error Message -->
          <transition name="fade">
              <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                <svg class="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p class="text-red-600 text-sm font-medium">{{ error }}</p>
              </div>
          </transition>
          
          <!-- Google Sign In Button - Placeholder for now -->
          <!-- <div id="google-signin-button" class="flex justify-center mb-6 h-[44px]" /> -->
          
          <!-- Email Login Section -->
          <div class="bg-surface-50 rounded-2xl p-6 border border-surface-100 transition-all duration-300 hover:shadow-sm">
            <template v-if="!emailSent">
              <div class="mb-4">
                  <h3 class="font-bold text-surface-900 text-sm uppercase tracking-wide mb-1">Sign in with Email</h3>
                  <p class="text-xs text-surface-500">We'll send a secure magic link to your inbox.</p>
              </div>
              <form @submit.prevent="handleEmailSubmit" class="space-y-4">
                <div>
                  <input
                    v-model="emailInput"
                    type="email"
                    placeholder="name@example.com"
                    class="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-surface-400 text-surface-900"
                    :class="{ 'border-red-400 bg-red-50': emailError }"
                    :disabled="isLoading"
                  />
                  <p v-if="emailError" class="text-red-500 text-xs mt-1 ml-1">{{ emailError }}</p>
                </div>
                <button 
                  type="submit"
                  class="btn btn-primary w-full shadow-lg shadow-primary-500/20"
                  :disabled="isLoading"
                >
                  <span v-if="isLoading" class="spinner mr-2" />
                  {{ isLoading ? 'Sending Link...' : 'Send Login Link' }}
                </button>
              </form>
            </template>
            <template v-else>
              <!-- Success State -->
              <div class="text-center py-4">
                <div class="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 relative">
                   <div class="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-20"></div>
                  <svg class="w-8 h-8 text-emerald-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 class="font-display font-bold text-xl text-surface-900 mb-2">Check Your Email</h3>
                <p class="text-sm text-surface-600 mb-6 leading-relaxed">
                  We've sent a magic login link to<br>
                  <strong class="text-primary-700 bg-primary-50 px-2 py-0.5 rounded">{{ emailSentTo }}</strong>
                </p>
                <div class="space-y-3">
                    <button 
                    class="btn btn-secondary w-full text-sm"
                    @click="closeAuthModal"
                    >
                    Close Window
                    </button>
                    <button 
                    class="text-xs text-surface-400 hover:text-surface-600 underline"
                    @click="resetEmailState"
                    >
                    Use a different email address
                    </button>
                </div>
              </div>
            </template>
          </div>
          
          <!-- Divider -->
          <div class="relative my-8">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-surface-100" />
            </div>
            <div class="relative flex justify-center text-xs font-medium uppercase tracking-widest text-surface-400">
              <span class="px-2 bg-white">Or</span>
            </div>
          </div>
          
          <!-- Guest Checkout Info -->
          <button 
            class="w-full py-3 rounded-xl border border-surface-200 text-surface-600 hover:text-surface-900 hover:border-surface-300 hover:bg-surface-50 transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 group"
            @click="closeAuthModal"
          >
            <span>Continue as Guest</span>
            <svg class="w-4 h-4 text-surface-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
          
          <!-- Terms -->
          <p class="text-[10px] text-center text-surface-400 mt-8 leading-relaxed px-4">
            By continuing, you agree to our 
            <a href="#" class="text-surface-600 hover:text-primary-600 hover:underline">Terms of Service</a> 
            and 
            <a href="#" class="text-surface-600 hover:text-primary-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
