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
const { isAuthenticated, user, continueAsGuest } = useAuth()
const { placeOrder, isLoading } = useOrders()

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
      const guestResult = await continueAsGuest({
        name: form.value.name,
        email: form.value.email,
        phone: form.value.phone
      })
      
      if (!guestResult) {
        showError('Failed to create guest session')
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
    const result = await placeOrder({
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      address: form.value.address,
      city: form.value.city,
      state: form.value.state,
      postal: form.value.postal
    })
    
    if (result) {
      orderSuccess.value = true
      orderNumber.value = result.orderNumber
      success('Order placed successfully!')
    } else {
      showError('Failed to place order')
    }
  } catch (e) {
  console.error(e)
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
      <div class="overlay" @click="handleClose" />
      
      <!-- Modal -->
      <div class="relative min-h-screen flex items-center justify-center p-4">
          <div class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in z-50">
          <!-- Close Button -->
          <button 
            class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-surface-50 hover:bg-surface-100 transition-colors"
            @click="handleClose"
          >
            <svg class="w-5 h-5 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <!-- Success State -->
          <div v-if="orderSuccess" class="p-12 text-center flex flex-col items-center">
            <div class="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mb-8 relative">
               <div class="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-20"></div>
              <svg class="w-12 h-12 text-emerald-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-3xl font-display font-bold text-surface-900 mb-2">Order Confirmed!</h2>
            <p class="text-surface-600 mb-6 max-w-md mx-auto">
               Thank you for your purchase. We have received your order and will begin processing it right away.
            </p>
            
             <div class="bg-surface-50 rounded-xl p-4 mb-8 w-full max-w-sm border border-surface-100">
               <p class="text-xs text-surface-500 uppercase tracking-wide font-bold mb-1">Order Number</p>
               <p class="text-2xl font-mono font-bold text-primary-700">{{ orderNumber }}</p>
             </div>

            <p class="text-surface-500 text-sm mb-8">
              <template v-if="!isAuthenticated">
                A verification link has been sent to <span class="font-bold text-surface-900">{{ form.email }}</span>.
              </template>
              <template v-else>
                 Check your email for order details.
              </template>
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button class="flex-1 btn btn-primary btn-lg" @click="goToOrders">Track Your Order</button>
              <button class="flex-1 btn btn-secondary btn-lg" @click="handleClose">Back to Shop</button>
            </div>
          </div>
          
          <!-- Checkout Form -->
          <div v-else>
            <div class="p-8 border-b border-surface-100 bg-surface-50/50">
              <h2 class="text-2xl font-display font-bold text-surface-900">Secure Checkout</h2>
              <p class="text-surface-500 text-sm mt-1 flex items-center gap-2">
                 <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                {{ isAuthenticated ? 'Complete your purchase securely' : 'Enter details to verify & order' }}
              </p>
            </div>
            
            <form @submit.prevent="handleSubmit" class="p-8 space-y-8">
              <!-- Contact Information -->
              <div class="space-y-4">
                <h3 class="text-sm font-bold text-surface-900 uppercase tracking-widest flex items-center gap-2">
                   <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs">1</span>
                   Contact Details
                </h3>
                <div class="grid gap-5">
                  <div>
                    <label class="block text-sm font-medium text-surface-700 mb-1.5 ml-1">Full Name</label>
                    <input 
                      v-model="form.name"
                      type="text"
                      class="input"
                      :class="{ 'input-error': errors.name }"
                      placeholder="e.g. John Doe"
                    />
                    <p v-if="errors.name" class="text-red-500 text-xs mt-1 ml-1">{{ errors.name }}</p>
                  </div>
                  
                  <div class="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label class="block text-sm font-medium text-surface-700 mb-1.5 ml-1">Email</label>
                      <input 
                        v-model="form.email"
                        type="email"
                        class="input"
                        :class="{ 'input-error': errors.email }"
                        placeholder="john@example.com"
                      />
                      <p v-if="errors.email" class="text-red-500 text-xs mt-1 ml-1">{{ errors.email }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 mb-1.5 ml-1">Phone</label>
                      <input 
                        v-model="form.phone"
                        type="tel"
                        class="input"
                        :class="{ 'input-error': errors.phone }"
                        placeholder="10-digit mobile number"
                      />
                      <p v-if="errors.phone" class="text-red-500 text-xs mt-1 ml-1">{{ errors.phone }}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Shipping Address -->
              <div class="space-y-4">
                 <h3 class="text-sm font-bold text-surface-900 uppercase tracking-widest flex items-center gap-2">
                   <span class="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs">2</span>
                   Shipping Address
                </h3>
                <div class="grid gap-5">
                  <div>
                    <label class="block text-sm font-medium text-surface-700 mb-1.5 ml-1">Address</label>
                    <textarea 
                      v-model="form.address"
                      rows="2"
                      class="input resize-none"
                      :class="{ 'input-error': errors.address }"
                      placeholder="House/Flat No, Street, Landmark"
                    />
                    <p v-if="errors.address" class="text-red-500 text-xs mt-1 ml-1">{{ errors.address }}</p>
                  </div>
                  
                  <div class="grid sm:grid-cols-3 gap-5">
                    <div>
                      <label class="block text-sm font-medium text-surface-700 mb-1.5 ml-1">City</label>
                      <input 
                        v-model="form.city"
                        type="text"
                        class="input"
                        :class="{ 'input-error': errors.city }"
                        placeholder="City"
                      />
                      <p v-if="errors.city" class="text-red-500 text-xs mt-1 ml-1">{{ errors.city }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 mb-1.5 ml-1">State</label>
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
                      <p v-if="errors.state" class="text-red-500 text-xs mt-1 ml-1">{{ errors.state }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-surface-700 mb-1.5 ml-1">PIN Code</label>
                      <input 
                        v-model="form.postal"
                        type="text"
                        maxlength="6"
                        class="input"
                        :class="{ 'input-error': errors.postal }"
                        placeholder="6-digit PIN"
                      />
                      <p v-if="errors.postal" class="text-red-500 text-xs mt-1 ml-1">{{ errors.postal }}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Order Summary -->
              <div class="bg-surface-50 rounded-2xl p-6 border border-surface-100">
                <h3 class="text-sm font-bold text-surface-900 mb-4">Order Summary</h3>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-surface-600">Subtotal ({{ items.length }} items)</span>
                    <span class="font-medium text-surface-900">{{ formatPrice(subtotal) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-surface-600">Shipping</span>
                    <span v-if="shippingFee === 0" class="text-emerald-600 font-bold">Free</span>
                    <span v-else class="font-medium text-surface-900">{{ formatPrice(shippingFee) }}</span>
                  </div>
                  <div class="border-t border-surface-200 pt-3 mt-3 flex justify-between items-center">
                    <span class="font-bold text-surface-900">Total</span>
                    <span class="font-display font-bold text-2xl text-primary-700">{{ formatPrice(total) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Notices -->
              <!-- Guest -->
              <div v-if="!isAuthenticated" class="notice notice-info">
                <div class="flex gap-3">
                  <svg class="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="text-sm">
                    <p class="font-bold">Checkout as Guest</p>
                    <p class="mt-1 opacity-90">
                      You'll receive a verification link via email. Your order will be confirmed once verified.
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Payment -->
              <div class="bg-accent-50 border border-accent-100 rounded-xl p-4 text-accent-900">
                <div class="flex gap-3">
                  <svg class="w-5 h-5 shrink-0 mt-0.5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="text-sm">
                    <p class="font-bold text-accent-800">Phone/Manual Payment</p>
                    <p class="mt-1 text-accent-700">
                      We'll contact you to verify payment details after you place the order.
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Submit Button -->
              <button 
                type="submit"
                class="w-full btn btn-primary btn-lg shadow-xl shadow-primary-500/20"
                :disabled="isSubmitting || items.length === 0"
              >
                <div v-if="isSubmitting" class="flex items-center justify-center gap-2">
                   <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing Order...</span>
                </div>
                <span v-else>Confirm & Place Order</span>
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
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
