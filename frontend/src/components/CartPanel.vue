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
      class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col font-sans"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-surface-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <h2 class="text-xl font-display font-bold text-surface-900 flex items-center gap-3">
          Your Bag
          <span v-if="itemCount > 0" class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
            {{ itemCount }}
          </span>
        </h2>
        <button 
          class="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors text-surface-500 hover:text-surface-900"
          @click="closeCart"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Empty State -->
      <div 
        v-if="items.length === 0"
        class="flex-1 flex flex-col items-center justify-center p-8 text-center"
      >
        <div class="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6 animate-pulse-glow">
          <svg class="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h3 class="text-xl font-display font-bold text-surface-900 mb-2">Your cart is empty</h3>
        <p class="text-surface-500 mb-8 max-w-[250px] mx-auto">Looks like you haven't discovered our premium collection yet.</p>
        <button 
          class="btn btn-primary"
          @click="closeCart(); router.push('/products')"
        >
          Start Shopping
        </button>
      </div>
      
      <!-- Cart Items -->
      <div v-else class="flex-1 overflow-y-auto p-6 space-y-6">
        <transition-group name="list">
          <div 
            v-for="item in items" 
            :key="item.product.id"
            class="flex gap-4 group"
          >
            <!-- Product Image -->
            <div class="w-24 h-24 rounded-xl overflow-hidden bg-surface-50 shrink-0 border border-surface-100 relative">
              <img 
                v-if="item.product.images?.[0]"
                :src="item.product.images[0]"
                :alt="item.product.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-8 h-8 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <!-- Product Details -->
            <div class="flex-1 min-w-0 flex flex-col justify-between py-1">
              <div>
                 <div class="flex justify-between items-start mb-1">
                    <h4 class="font-display font-semibold text-surface-900 line-clamp-2 text-base leading-snug">
                      {{ item.product.name }}
                    </h4>
                    <button 
                      class="text-surface-400 hover:text-red-500 transition-colors p-1 -mr-2"
                      @click="removeItem(item.product.id)"
                      title="Remove Item"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                 </div>
                 <p class="text-xs text-surface-500">{{ item.product.category || 'Wellness' }}</p>
              </div>
              
              <div class="flex items-center justify-between mt-3">
                 <!-- Quantity -->
                 <div class="flex items-center gap-3 bg-surface-50 rounded-lg p-1 border border-surface-100">
                    <button 
                      class="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-surface-500 hover:text-surface-900 transition-colors"
                      @click="decrementQuantity(item.product.id)"
                    >
                      -
                    </button>
                    <span class="text-sm font-medium text-surface-900 w-4 text-center">
                      {{ item.quantity }}
                    </span>
                    <button 
                      class="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-surface-500 hover:text-surface-900 transition-colors"
                      @click="incrementQuantity(item.product.id)"
                    >
                      +
                    </button>
                 </div>

                 <!-- Price -->
                 <div class="text-right">
                    <p class="text-primary-700 font-bold">
                       {{ formatPrice(item.product.price * item.quantity) }}
                    </p>
                    <p v-if="item.quantity > 1" class="text-xs text-surface-400 text-right">
                       {{ formatPrice(item.product.price) }} / each
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>
      
      <!-- Footer -->
      <div v-if="items.length > 0" class="p-6 border-t border-surface-100 bg-surface-50/50 backdrop-blur-sm">
        
        <!-- Free Shipping Progress -->
        <div v-if="subtotal < 500" class="mb-6 p-4 rounded-xl bg-white border border-surface-100 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-surface-600">Free Shipping</span>
            <span class="text-xs font-bold text-primary-600">{{ Math.min(Math.round((subtotal / 500) * 100), 100) }}%</span>
          </div>
          <div class="h-2 bg-surface-100 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500 ease-out"
              :style="{ width: `${Math.min((subtotal / 500) * 100, 100)}%` }"
            />
          </div>
          <p class="text-xs text-surface-500 mt-2 flex items-center gap-1">
            <svg class="w-3 h-3 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Add <span class="font-bold text-primary-700">{{ formatPrice(500 - subtotal) }}</span> to unlock free delivery.
          </p>
        </div>
        <div v-else class="mb-6 px-4 py-3 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center gap-2 text-green-700 text-sm font-bold">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
             Free Shipping Unlocked!
        </div>

        <!-- Summary -->
        <div class="space-y-3 mb-6">
           <div class="flex items-center justify-between text-sm">
              <span class="text-surface-600">Subtotal</span>
              <span class="font-medium text-surface-900">{{ formatPrice(subtotal) }}</span>
           </div>
           <div class="flex items-center justify-between text-sm">
              <span class="text-surface-600">Shipping</span>
              <span v-if="shippingFee === 0" class="text-emerald-600 font-bold">Free</span>
              <span v-else class="font-medium text-surface-900">{{ formatPrice(shippingFee) }}</span>
           </div>
           <div v-if="savings > 0" class="flex items-center justify-between text-sm text-emerald-600">
             <span>Total Bundle Savings</span>
             <span class="font-bold">-{{ formatPrice(savings) }}</span>
           </div>
           <div class="pt-4 mt-4 border-t border-surface-200 flex items-center justify-between">
              <span class="font-display font-bold text-lg text-surface-900">Total</span>
              <span class="font-display font-bold text-xl text-primary-700">{{ formatPrice(total) }}</span>
           </div>
        </div>

        
        <button 
          class="w-full btn btn-primary btn-lg shadow-lg shadow-primary-500/20 group flex items-center justify-center gap-2"
          @click="proceedToCheckout"
        >
          <span>Checkout Securely</span>
          <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    </aside>
  </transition>
</template>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
