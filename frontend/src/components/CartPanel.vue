<script setup>
import { computed } from 'vue'
import { useCart } from '../composables/useCart'
import { useRouter } from 'vue-router'

const router = useRouter()
const { 
  items, 
  isOpen, 
  itemCount, 
  subtotal, 
  savings,
  closeCart, 
  removeItem, 
  incrementQuantity, 
  decrementQuantity 
} = useCart()

const shippingFee = computed(() => subtotal.value >= 500 ? 0 : 50)
const total = computed(() => subtotal.value + shippingFee.value)

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price)
}

function proceedToCheckout() {
  closeCart()
  router.push('/checkout')
}
</script>

<template>
  <transition name="slide-right">
    <aside 
      v-if="isOpen"
      class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-surface-200">
        <h2 class="text-lg font-display font-bold text-surface-900">
          Shopping Cart
          <span v-if="itemCount > 0" class="text-primary-600">({{ itemCount }})</span>
        </h2>
        <button 
          class="w-10 h-10 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors"
          @click="closeCart"
        >
          <svg class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Empty State -->
      <div 
        v-if="items.length === 0"
        class="flex-1 flex flex-col items-center justify-center p-8 text-center"
      >
        <div class="w-24 h-24 rounded-full bg-surface-100 flex items-center justify-center mb-4">
          <svg class="w-12 h-12 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-surface-900 mb-2">Your cart is empty</h3>
        <p class="text-surface-500 mb-6">Looks like you haven't added any products yet.</p>
        <button 
          class="btn btn-primary"
          @click="closeCart(); router.push('/products')"
        >
          Browse Products
        </button>
      </div>
      
      <!-- Cart Items -->
      <div v-else class="flex-1 overflow-y-auto p-4 space-y-4">
        <div 
          v-for="item in items" 
          :key="item.product.id"
          class="flex gap-4 p-3 bg-surface-50 rounded-xl"
        >
          <!-- Product Image -->
          <div class="w-20 h-20 rounded-lg overflow-hidden bg-surface-200 shrink-0">
            <img 
              v-if="item.product.images?.[0]"
              :src="item.product.images[0]"
              :alt="item.product.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <!-- Product Details -->
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-surface-900 line-clamp-2 text-sm">
              {{ item.product.name }}
            </h4>
            <p class="text-primary-700 font-bold mt-1">
              {{ formatPrice(item.product.price) }}
            </p>
            
            <!-- Quantity Controls -->
            <div class="flex items-center gap-2 mt-2">
              <button 
                class="w-8 h-8 rounded-full bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-100 transition-colors"
                @click="decrementQuantity(item.product.id)"
              >
                <svg class="w-4 h-4 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
              </button>
              <span class="w-8 text-center font-medium text-surface-900">
                {{ item.quantity }}
              </span>
              <button 
                class="w-8 h-8 rounded-full bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-100 transition-colors"
                @click="incrementQuantity(item.product.id)"
              >
                <svg class="w-4 h-4 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              
              <!-- Remove -->
              <button 
                class="ml-auto text-surface-400 hover:text-red-500 transition-colors"
                @click="removeItem(item.product.id)"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div v-if="items.length > 0" class="p-4 border-t border-surface-200 bg-surface-50">
        <!-- Savings -->
        <div v-if="savings > 0" class="flex items-center justify-between text-sm mb-2">
          <span class="text-green-600 font-medium">You're saving</span>
          <span class="text-green-600 font-bold">{{ formatPrice(savings) }}</span>
        </div>
        
        <!-- Subtotal -->
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="text-surface-600">Subtotal</span>
          <span class="font-medium text-surface-900">{{ formatPrice(subtotal) }}</span>
        </div>
        
        <!-- Shipping -->
        <div class="flex items-center justify-between text-sm mb-3">
          <span class="text-surface-600">Shipping</span>
          <span v-if="shippingFee === 0" class="text-green-600 font-medium">FREE</span>
          <span v-else class="font-medium text-surface-900">{{ formatPrice(shippingFee) }}</span>
        </div>
        
        <!-- Free Shipping Progress -->
        <div v-if="subtotal < 500" class="mb-4">
          <div class="h-2 bg-surface-200 rounded-full overflow-hidden">
            <div 
              class="h-full bg-primary-500 transition-all duration-300"
              :style="{ width: `${Math.min((subtotal / 500) * 100, 100)}%` }"
            />
          </div>
          <p class="text-xs text-surface-500 mt-1">
            Add {{ formatPrice(500 - subtotal) }} more for free shipping
          </p>
        </div>
        
        <!-- Total -->
        <div class="flex items-center justify-between mb-4">
          <span class="text-lg font-bold text-surface-900">Total</span>
          <span class="text-lg font-bold text-primary-700">{{ formatPrice(total) }}</span>
        </div>
        
        <!-- Checkout Button -->
        <button 
          class="w-full btn btn-primary btn-lg"
          @click="proceedToCheckout"
        >
          Proceed to Checkout
        </button>
        
        <!-- Continue Shopping -->
        <button 
          class="w-full btn btn-ghost mt-2"
          @click="closeCart"
        >
          Continue Shopping
        </button>
      </div>
    </aside>
  </transition>
</template>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}
</style>
