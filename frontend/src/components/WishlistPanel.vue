<script setup>
import { useWishlist } from '../composables/useWishlist'
import { useCart } from '../composables/useCart'
import { useRouter } from 'vue-router'

const router = useRouter()
const { items, isOpen, itemCount, closeWishlist, removeItem } = useWishlist()
const { addItem: addToCart } = useCart()

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price)
}

function moveToCart(product) {
  addToCart(product)
  removeItem(product.id)
}

function buyNow(product) {
  addToCart(product)
  removeItem(product.id)
  closeWishlist()
  router.push('/checkout')
}

function viewProduct(slug) {
  closeWishlist()
  router.push(`/product/${slug}`)
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
          Wishlist
          <span v-if="itemCount > 0" class="text-primary-600">({{ itemCount }})</span>
        </h2>
        <button 
          class="w-10 h-10 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors"
          @click="closeWishlist"
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-surface-900 mb-2">Your wishlist is empty</h3>
        <p class="text-surface-500 mb-6">Save your favorite products here for later.</p>
        <button 
          class="btn btn-primary"
          @click="closeWishlist(); router.push('/products')"
        >
          Explore Products
        </button>
      </div>
      
      <!-- Wishlist Items -->
      <div v-else class="flex-1 overflow-y-auto p-4 space-y-4">
        <div 
          v-for="item in items" 
          :key="item.id"
          class="flex gap-4 p-3 bg-surface-50 rounded-xl"
        >
          <!-- Product Image -->
          <div 
            class="w-24 h-24 rounded-lg overflow-hidden bg-surface-200 flex-shrink-0 cursor-pointer"
            @click="viewProduct(item.slug)"
          >
            <img 
              v-if="item.images?.[0]"
              :src="item.images[0]"
              :alt="item.name"
              class="w-full h-full object-cover hover:scale-105 transition-transform"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <!-- Product Details -->
          <div class="flex-1 min-w-0">
            <h4 
              class="font-medium text-surface-900 line-clamp-2 text-sm cursor-pointer hover:text-primary-600 transition-colors"
              @click="viewProduct(item.slug)"
            >
              {{ item.name }}
            </h4>
            
            <!-- Price -->
            <div class="flex items-center gap-2 mt-1">
              <span class="text-primary-700 font-bold">{{ formatPrice(item.price) }}</span>
              <span 
                v-if="item.comparePrice && item.comparePrice > item.price"
                class="text-xs text-surface-400 line-through"
              >
                {{ formatPrice(item.comparePrice) }}
              </span>
            </div>
            
            <!-- Stock Status -->
            <p 
              class="text-xs mt-1"
              :class="item.stock > 0 ? 'text-green-600' : 'text-red-500'"
            >
              {{ item.stock > 0 ? 'In Stock' : 'Out of Stock' }}
            </p>
            
            <!-- Actions -->
            <div class="flex items-center gap-2 mt-3">
              <button 
                v-if="item.stock > 0"
                class="btn btn-primary btn-sm flex-1"
                @click="moveToCart(item)"
              >
                Add to Cart
              </button>
              <button 
                v-if="item.stock > 0"
                class="btn btn-secondary btn-sm"
                @click="buyNow(item)"
              >
                Buy Now
              </button>
              <button 
                class="w-8 h-8 rounded-full hover:bg-surface-200 flex items-center justify-center transition-colors"
                @click="removeItem(item.id)"
                title="Remove"
              >
                <svg class="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
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
