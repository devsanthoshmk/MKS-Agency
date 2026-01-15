<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUI } from '../composables/useUI'
import { useCart } from '../composables/useCart'
import { useAuth } from '../composables/useAuth'
import { useOrders } from '../composables/useOrders'

const router = useRouter()
const { activeModal, closeModal, success, error: showError } = useUI()
const { items, subtotal, clearCart } = useCart()
const { isAuthenticated, user, createGuestSession } = useAuth()
const { createOrder, isLoading } = useOrders()

const isOpen = computed(() => activeModal.value === 'checkout')

// Form state
const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postal: ''
})

const errors = ref({})
const isSubmitting = ref(false)
const orderSuccess = ref(false)
const orderNumber = ref('')

// Pre-fill form if authenticated
if (isAuthenticated.value && user.value) {
  form.value.name = user.value.name || ''
  form.value.email = user.value.email || ''
  form.value.phone = user.value.phone || ''
}

const shippingFee = computed(() => subtotal.value >= 500 ? 0 : 50)
const total = computed(() => subtotal.value + shippingFee.value)

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price)
}

function validateForm() {
  errors.value = {}
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
  }
  
  if (!form.value.email.trim()) {
    errors.value.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email'
  }
  
  if (!form.value.phone.trim()) {
    errors.value.phone = 'Phone is required'
  } else if (!/^[6-9]\d{9}$/.test(form.value.phone.replace(/\D/g, ''))) {
    errors.value.phone = 'Please enter a valid 10-digit phone number'
  }
  
  if (!form.value.address.trim()) {
    errors.value.address = 'Address is required'
  }
  
  if (!form.value.city.trim()) {
    errors.value.city = 'City is required'
  }
  
  if (!form.value.state.trim()) {
    errors.value.state = 'State is required'
  }
  
  if (!form.value.postal.trim()) {
    errors.value.postal = 'Postal code is required'
  } else if (!/^\d{6}$/.test(form.value.postal)) {
    errors.value.postal = 'Please enter a valid 6-digit postal code'
  }
  
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    let guestInfo = null
    
    // If not authenticated, create guest session
    if (!isAuthenticated.value) {
      const guestResult = await createGuestSession({
        name: form.value.name,
        email: form.value.email,
        phone: form.value.phone
      })
      
      if (!guestResult.success) {
        showError(guestResult.error || 'Failed to create guest session')
        return
      }
      
      guestInfo = {
        name: form.value.name,
        email: form.value.email,
        phone: form.value.phone,
        verificationRequired: guestResult.verificationRequired
      }
    }
    
    // Create order
    const result = await createOrder({
      shipping: {
        name: form.value.name,
        email: form.value.email,
        phone: form.value.phone,
        address: form.value.address,
        city: form.value.city,
        state: form.value.state,
        postal: form.value.postal
      },
      isGuest: !isAuthenticated.value,
      guestInfo
    })
    
    if (result.success) {
      orderSuccess.value = true
      orderNumber.value = result.orderNumber
      success('Order placed successfully!')
    } else {
      showError(result.error || 'Failed to place order')
    }
  } catch (e) {
    showError('Something went wrong. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  if (orderSuccess.value) {
    orderSuccess.value = false
    orderNumber.value = ''
    form.value = {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postal: ''
    }
  }
  closeModal()
  router.push('/products')
}

function goToOrders() {
  closeModal()
  router.push('/orders')
}

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry'
]
</script>

<template>
  <transition name="scale">
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <!-- Overlay -->
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
      
      <!-- Modal -->
      <div class="relative min-h-screen flex items-center justify-center p-4">
        <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          <!-- Close Button -->
          <button 
            class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors"
            @click="handleClose"
          >
            <svg class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <!-- Success State -->
          <div v-if="orderSuccess" class="p-8 text-center">
            <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-2xl font-display font-bold text-surface-900 mb-2">Order Placed!</h2>
            <p class="text-surface-600 mb-2">Your order number is:</p>
            <p class="text-xl font-bold text-primary-700 mb-4">{{ orderNumber }}</p>
            <p class="text-surface-500 text-sm mb-6">
              We will contact you shortly to verify your payment. 
              <template v-if="!isAuthenticated">
                A verification email has been sent to your email address.
              </template>
            </p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button class="btn btn-primary" @click="goToOrders">View My Orders</button>
              <button class="btn btn-secondary" @click="handleClose">Continue Shopping</button>
            </div>
          </div>
          
          <!-- Checkout Form -->
          <div v-else>
            <div class="p-6 border-b border-surface-200">
              <h2 class="text-xl font-display font-bold text-surface-900">Checkout</h2>
              <p class="text-surface-500 text-sm mt-1">
                {{ isAuthenticated ? 'Complete your order' : 'Enter your details to place order' }}
              </p>
            </div>
            
            <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
              <!-- Contact Information -->
              <div>
                <h3 class="text-sm font-semibold text-surface-900 mb-4">Contact Information</h3>
                <div class="grid gap-4">
                  <div>
                    <label class="block text-sm font-medium text-surface-700 mb-1">Full Name *</label>
                    <input 
                      v-model="form.name"
                      type="text"
                      class="input"
                      :class="{ 'input-error': errors.name }"
                      placeholder="Enter your full name"
                    />
                    <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
                  </div>
                  
                  <div class="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-surface-700 mb-1">Email *</label>
                      <input 
                        v-model="form.email"
                        type="email"
                        class="input"
                        :class="{ 'input-error': errors.email }"
                        placeholder="your@email.com"
                      />
                      <p v-if="errors.email" class="text-red-500 text-xs mt-1">{{ errors.email }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 mb-1">Phone *</label>
                      <input 
                        v-model="form.phone"
                        type="tel"
                        class="input"
                        :class="{ 'input-error': errors.phone }"
                        placeholder="10-digit mobile number"
                      />
                      <p v-if="errors.phone" class="text-red-500 text-xs mt-1">{{ errors.phone }}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Shipping Address -->
              <div>
                <h3 class="text-sm font-semibold text-surface-900 mb-4">Shipping Address</h3>
                <div class="grid gap-4">
                  <div>
                    <label class="block text-sm font-medium text-surface-700 mb-1">Address *</label>
                    <textarea 
                      v-model="form.address"
                      rows="2"
                      class="input resize-none"
                      :class="{ 'input-error': errors.address }"
                      placeholder="House/Flat No, Street, Landmark"
                    />
                    <p v-if="errors.address" class="text-red-500 text-xs mt-1">{{ errors.address }}</p>
                  </div>
                  
                  <div class="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-surface-700 mb-1">City *</label>
                      <input 
                        v-model="form.city"
                        type="text"
                        class="input"
                        :class="{ 'input-error': errors.city }"
                        placeholder="City"
                      />
                      <p v-if="errors.city" class="text-red-500 text-xs mt-1">{{ errors.city }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 mb-1">State *</label>
                      <select 
                        v-model="form.state"
                        class="input"
                        :class="{ 'input-error': errors.state }"
                      >
                        <option value="">Select State</option>
                        <option v-for="state in indianStates" :key="state" :value="state">
                          {{ state }}
                        </option>
                      </select>
                      <p v-if="errors.state" class="text-red-500 text-xs mt-1">{{ errors.state }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 mb-1">PIN Code *</label>
                      <input 
                        v-model="form.postal"
                        type="text"
                        maxlength="6"
                        class="input"
                        :class="{ 'input-error': errors.postal }"
                        placeholder="6-digit PIN"
                      />
                      <p v-if="errors.postal" class="text-red-500 text-xs mt-1">{{ errors.postal }}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Order Summary -->
              <div class="bg-surface-50 rounded-xl p-4">
                <h3 class="text-sm font-semibold text-surface-900 mb-3">Order Summary</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-surface-600">Subtotal ({{ items.length }} items)</span>
                    <span class="font-medium">{{ formatPrice(subtotal) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-surface-600">Shipping</span>
                    <span v-if="shippingFee === 0" class="text-green-600 font-medium">FREE</span>
                    <span v-else class="font-medium">{{ formatPrice(shippingFee) }}</span>
                  </div>
                  <div class="border-t border-surface-200 pt-2 mt-2 flex justify-between">
                    <span class="font-semibold text-surface-900">Total</span>
                    <span class="font-bold text-primary-700 text-lg">{{ formatPrice(total) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Guest Notice -->
              <div v-if="!isAuthenticated" class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div class="flex gap-3">
                  <svg class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="text-sm">
                    <p class="text-blue-800 font-medium">Checkout as Guest</p>
                    <p class="text-blue-700 mt-1">
                      You'll receive a verification link via email. Your order will be confirmed once verified.
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Payment Notice -->
              <div class="bg-accent-50 border border-accent-200 rounded-xl p-4">
                <div class="flex gap-3">
                  <svg class="w-5 h-5 text-accent-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="text-sm">
                    <p class="text-accent-800 font-medium">Manual Payment</p>
                    <p class="text-accent-700 mt-1">
                      After placing your order, we will contact you via phone/email to verify payment details.
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Submit Button -->
              <button 
                type="submit"
                class="w-full btn btn-primary btn-lg"
                :disabled="isSubmitting || items.length === 0"
              >
                <span v-if="isSubmitting" class="spinner mr-2" />
                {{ isSubmitting ? 'Placing Order...' : 'Place Order' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
}
</style>
