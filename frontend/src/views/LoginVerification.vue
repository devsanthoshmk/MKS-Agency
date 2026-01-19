<script setup>
/**
 * Login Verification View
 * 
 * Handles email magic link verification.
 * When user clicks the login link from their email, they are redirected here.
 * The token is extracted from the URL and verified against the backend.
 */
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useUI } from '../composables/useUI'

const router = useRouter()
const route = useRoute()
const { verifyLoginToken, isLoading } = useAuth()
const { success, error: showError } = useUI()

const status = ref('verifying') // 'verifying' | 'success' | 'error'
const errorMessage = ref('')

const verificationAttempted = ref(false)

onMounted(async () => {
  const token = route.params.token
  
  if (!token) {
    status.value = 'error'
    errorMessage.value = 'No login token provided'
    return
  }

  // Prevent double invocation in dev mode
  if (verificationAttempted.value) return
  verificationAttempted.value = true
  
  const result = await verifyLoginToken(token)
  
  if (result) {
    status.value = 'success'
    success('Successfully signed in!')
    // Redirect to orders page after short delay
    setTimeout(() => {
      router.push('/orders')
    }, 1500)
  } else {
    status.value = 'error'
    errorMessage.value = 'This login link is invalid or has expired. Please request a new one.'
  }
})

function goHome() {
  router.push('/')
}

function requestNewLink() {
  router.push('/')
  // Open auth modal would require a slight delay
  setTimeout(() => {
    const { openAuthModal } = useAuth()
    openAuthModal()
  }, 100)
}
</script>

<template>
  <div class="min-h-screen bg-surface-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
      <!-- Logo -->
      <div class="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
        <span class="text-white text-2xl font-bold">M</span>
      </div>
      
      <!-- Verifying State -->
      <template v-if="status === 'verifying'">
        <div class="animate-pulse">
          <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h1 class="text-xl font-display font-bold text-surface-900 mb-2">Signing You In...</h1>
          <p class="text-surface-600">Please wait while we verify your login link.</p>
        </div>
      </template>
      
      <!-- Success State -->
      <template v-else-if="status === 'success'">
        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="text-xl font-display font-bold text-surface-900 mb-2">Welcome Back!</h1>
        <p class="text-surface-600 mb-4">You've been successfully signed in.</p>
        <p class="text-sm text-surface-500">Redirecting you to your orders...</p>
      </template>
      
      <!-- Error State -->
      <template v-else>
        <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 class="text-xl font-display font-bold text-surface-900 mb-2">Link Expired or Invalid</h1>
        <p class="text-surface-600 mb-6">{{ errorMessage }}</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button class="btn btn-primary" @click="requestNewLink">
            Request New Link
          </button>
          <button class="btn btn-secondary" @click="goHome">
            Go to Homepage
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.gradient-primary {
  background: linear-gradient(135deg, #059669, #047857);
}
</style>
