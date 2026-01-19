<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// API URL for production/development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const route = useRoute()
const token = computed(() => route.params.token)
const isLoading = ref(true)
const isVerified = ref(false)
const error = ref(null)

onMounted(async () => {
  if (!token.value) {
    error.value = 'Invalid verification link'
    isLoading.value = false
    return
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/verify-guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: token.value })
    })

    const data = await response.json()

    if (response.ok && data.verified) {
      isVerified.value = true
    } else {
      error.value = data.message || 'Verification failed. The link may have expired.'
    }
  } catch (e) {
    error.value = 'Something went wrong. Please try again later.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 gradient-hero">
    <div class="max-w-md w-full">
      <!-- Loading State -->
      <div v-if="isLoading" class="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="spinner mx-auto mb-4" style="width: 40px; height: 40px; border-width: 3px;" />
        <h2 class="text-xl font-bold text-surface-900">Verifying your email...</h2>
        <p class="text-surface-500 mt-2">Please wait a moment</p>
      </div>

      <!-- Success State -->
      <div v-else-if="isVerified" class="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-2xl font-display font-bold text-surface-900 mb-2">Email Verified!</h2>
        <p class="text-surface-600 mb-6">
          Your email has been verified successfully. Your order is now confirmed and we will contact you shortly regarding payment details.
        </p>
        <a href="/" class="btn btn-primary">
          Continue Shopping
        </a>
      </div>

      <!-- Error State -->
      <div v-else class="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div class="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="text-2xl font-display font-bold text-surface-900 mb-2">Verification Failed</h2>
        <p class="text-surface-600 mb-6">{{ error }}</p>
        <div class="space-y-3">
          <a href="/" class="btn btn-primary block">
            Go to Homepage
          </a>
          <p class="text-sm text-surface-500">
            Need help? Contact us at <a href="mailto:support@mksagencies.com" class="text-primary-600 hover:underline">support@mksagencies.com</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
