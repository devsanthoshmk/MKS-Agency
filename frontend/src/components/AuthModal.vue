<script setup>
import { ref, onMounted } from 'vue'
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
import { watch } from 'vue'
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
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="closeAuthModal" />
      
      <!-- Modal -->
      <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <!-- Close Button -->
        <button 
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors"
          @click="closeAuthModal"
        >
          <svg class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <!-- Content -->
        <div class="p-8 text-center">
          <!-- Logo -->
          <div class="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
            <span class="text-white text-2xl font-bold">M</span>
          </div>
          
          <h2 class="text-2xl font-display font-bold text-surface-900 mb-2">Welcome</h2>
          <p class="text-surface-500 mb-8">Sign in to access your account and orders</p>
          
          <!-- Error Message -->
          <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p class="text-red-700 text-sm">{{ error }}</p>
          </div>
          
          <!-- Google Sign In Button -->
          <div id="google-signin-button" class="flex justify-center mb-6" />
          
          <!-- Fallback Button -->
          <button 
            v-if="!googleLoaded"
            class="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-surface-300 rounded-xl hover:bg-surface-50 transition-colors"
            :disabled="isLoading"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span class="font-medium text-surface-700">
              {{ isLoading ? 'Signing in...' : 'Continue with Google' }}
            </span>
          </button>
          
          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-surface-200" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-surface-400">or sign in with email</span>
            </div>
          </div>
          
          <!-- Email Login Section -->
          <div class="bg-surface-50 rounded-xl p-4 text-left mb-6">
            <template v-if="!emailSent">
              <h3 class="font-semibold text-surface-900 mb-2">Sign in with Email</h3>
              <p class="text-sm text-surface-600 mb-3">
                Enter your email and we'll send you a secure login link.
              </p>
              <form @submit.prevent="handleEmailSubmit" class="space-y-3">
                <div>
                  <input
                    v-model="emailInput"
                    type="email"
                    placeholder="your@email.com"
                    class="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    :class="{ 'border-red-400 bg-red-50': emailError }"
                    :disabled="isLoading"
                  />
                  <p v-if="emailError" class="text-red-500 text-xs mt-1">{{ emailError }}</p>
                </div>
                <button 
                  type="submit"
                  class="btn btn-primary w-full"
                  :disabled="isLoading"
                >
                  <span v-if="isLoading" class="spinner mr-2" />
                  {{ isLoading ? 'Sending...' : 'Send Login Link' }}
                </button>
              </form>
            </template>
            <template v-else>
              <!-- Success State -->
              <div class="text-center py-2">
                <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 class="font-semibold text-surface-900 mb-1">Check Your Email!</h3>
                <p class="text-sm text-surface-600 mb-3">
                  We've sent a login link to<br>
                  <strong class="text-primary-700">{{ emailSentTo }}</strong>
                </p>
                <button 
                  class="text-sm text-primary-600 hover:underline"
                  @click="resetEmailState"
                >
                  Use a different email
                </button>
              </div>
            </template>
          </div>
          
          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-surface-200" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-surface-400">or</span>
            </div>
          </div>
          
          <!-- Guest Checkout Info -->
          <div class="bg-surface-50 rounded-xl p-4 text-left">
            <h3 class="font-semibold text-surface-900 mb-2">Continue as Guest</h3>
            <p class="text-sm text-surface-600 mb-3">
              You can also checkout without signing in. Just proceed to checkout and enter your details.
            </p>
            <button 
              class="btn btn-secondary btn-sm w-full"
              @click="closeAuthModal"
            >
              Continue as Guest
            </button>
          </div>
          
          <!-- Terms -->
          <p class="text-xs text-surface-400 mt-6">
            By signing in, you agree to our 
            <a href="#" class="text-primary-600 hover:underline">Terms of Service</a> 
            and 
            <a href="#" class="text-primary-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

