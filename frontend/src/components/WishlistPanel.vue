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
      class="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col font-sans"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-surface-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <h2 class="text-xl font-display font-bold text-surface-900 flex items-center gap-3">
          Your Wishlist
          <span v-if="itemCount > 0" class="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
            {{ itemCount }}
          </span>
        </h2>
        <button 
          class="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors text-surface-500 hover:text-surface-900"
          @click="closeWishlist"
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
        <div class="w-24 h-24 rounded-full bg-surface-50 flex items-center justify-center mb-6 animate-pulse">
           <svg class="w-10 h-10 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-display font-bold text-surface-900 mb-2">Your wishlist is empty</h3>
        <p class="text-surface-500 mb-8 max-w-[250px] mx-auto">Save items you love and come back to them later.</p>
        <button 
          class="btn btn-primary"
          @click="closeWishlist(); router.push('/products')"
        >
          Explore Collection
        </button>
      </div>
      
      <!-- Wishlist Items -->
      <div v-else class="flex-1 overflow-y-auto p-6 space-y-6">
        <transition-group name="list">
          <div 
            v-for="item in items" 
            :key="item.id"
            class="flex gap-4 group"
          >
            <!-- Product Image -->
            <div 
              class="w-24 h-24 rounded-xl overflow-hidden bg-surface-50 shrink-0 border border-surface-100 relative cursor-pointer"
              @click="viewProduct(item.slug)"
            >
              <img 
                v-if="item.images?.[0]"
                :src="item.images[0]"
                :alt="item.name"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-8 h-8 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
               <!-- Remove Button (Absolute) -->
               <button 
                class="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 shadow-sm"
                @click.stop="removeItem(item.id)"
                title="Remove"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- Product Details -->
            <div class="flex-1 min-w-0 flex flex-col justify-between py-1">
              <div>
                <h4 
                  class="font-display font-semibold text-surface-900 line-clamp-2 text-base leading-snug cursor-pointer hover:text-primary-600 transition-colors"
                  @click="viewProduct(item.slug)"
                >
                  {{ item.name }}
                </h4>
                 <div class="flex items-center gap-2 mt-1">
                    <span class="text-primary-700 font-bold">{{ formatPrice(item.price) }}</span>
                    <span 
                        v-if="item.comparePrice && item.comparePrice > item.price"
                        class="text-xs text-surface-400 line-through"
                    >
                        {{ formatPrice(item.comparePrice) }}
                    </span>
                 </div>
              </div>
              
               <div class="mt-3">
                 <!-- Actions -->
                 <div class="flex gap-2">
                    <button 
                        class="btn btn-primary btn-sm flex-1 text-xs"
                        @click="moveToCart(item)"
                    >
                        Move to Cart
                    </button>
                 </div>
               </div>
            </div>
          </div>
        </transition-group>
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
