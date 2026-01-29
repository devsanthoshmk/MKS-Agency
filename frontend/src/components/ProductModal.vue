<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUI } from '../composables/useUI'
import { useCart } from '../composables/useCart'
import { useWishlist } from '../composables/useWishlist'
import { useProducts } from '../composables/useProducts'

const router = useRouter()
const { activeModal, modalData, closeModal } = useUI()
const { addItem: addToCart, isInCart } = useCart()
const { toggleItem, isInWishlist } = useWishlist()
const { getRelatedProducts } = useProducts()

// Image gallery state
const selectedImageIndex = ref(0)

const isOpen = computed(() => activeModal.value === 'product' && modalData.value)
const product = computed(() => modalData.value)

// Get the currently selected image
const currentImage = computed(() => {
  if (product.value?.images?.length > 0) {
    return product.value.images[selectedImageIndex.value] || product.value.images[0]
  }
  return null
})

// Reset image index when product changes
watch(product, () => {
  selectedImageIndex.value = 0
})
const related = computed(() => product.value ? getRelatedProducts(product.value, 4) : [])

const discount = computed(() => {
  if (product.value?.comparePrice && product.value.comparePrice > product.value.price) {
    return Math.round(((product.value.comparePrice - product.value.price) / product.value.comparePrice) * 100)
  }
  return 0
})

const isOutOfStock = computed(() => product.value?.stock <= 0)
const inCart = computed(() => product.value && isInCart(product.value.id))
const inWishlist = computed(() => product.value && isInWishlist(product.value.id))

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price)
}

function handleAddToCart() {
  if (!isOutOfStock.value && product.value) {
    addToCart(product.value)
  }
}

function handleBuyNow() {
  if (!isOutOfStock.value && product.value) {
    addToCart(product.value)
    closeModal()
    router.push('/checkout')
  }
}

function handleToggleWishlist() {
  if (product.value) {
    toggleItem(product.value)
  }
}

function handleClose() {
  closeModal()
  router.push('/products')
}

function viewRelated(slug) {
  router.push(`/product/${slug}`)
}
</script>

<template>
  <transition name="scale">
    <div 
      v-if="isOpen && product"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <!-- Overlay -->
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
      
      <!-- Modal -->
      <div class="relative min-h-screen flex items-center justify-center p-4">
        <div class="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
          <!-- Close Button -->
          <button 
            class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-center hover:bg-white transition-colors"
            @click="handleClose"
          >
            <svg class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div class="grid md:grid-cols-2">
            <!-- Image Section -->
            <div class="relative bg-surface-100">
              <!-- Main Image -->
              <div class="aspect-square overflow-hidden">
                <img 
                  v-if="currentImage"
                  :src="currentImage"
                  :alt="product.name"
                  class="w-full h-full object-cover transition-all duration-300"
                  :key="selectedImageIndex"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
                  <svg class="w-24 h-24 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              <!-- Badges -->
              <div class="absolute top-4 left-4 flex flex-col gap-2">
                <span 
                  v-if="discount > 0"
                  class="bg-secondary-500 text-white text-sm font-bold px-3 py-1 rounded-full"
                >
                  {{ discount }}% OFF
                </span>
                <span 
                  v-if="product.tags?.includes('bestseller')"
                  class="bg-accent-500 text-white text-sm font-bold px-3 py-1 rounded-full"
                >
                  Bestseller
                </span>
              </div>
              
              <!-- Thumbnail Gallery -->
              <div 
                v-if="product.images?.length > 1"
                class="absolute bottom-4 left-4 right-4 flex gap-2 justify-center"
              >
                <button 
                  v-for="(img, idx) in product.images.slice(0, 4)" 
                  :key="idx"
                  class="w-16 h-16 rounded-lg overflow-hidden border-2 shadow-lg transition-all duration-200 hover:scale-105"
                  :class="selectedImageIndex === idx ? 'border-primary-500 ring-2 ring-primary-500 ring-offset-2' : 'border-white hover:border-primary-300'"
                  @click="selectedImageIndex = idx"
                >
                  <img :src="img" :alt="`${product.name} ${idx + 1}`" class="w-full h-full object-cover" />
                </button>
              </div>
            </div>
            
            <!-- Content Section -->
            <div class="p-6 md:p-8 flex flex-col">
              <!-- Category -->
              <p class="text-sm text-primary-600 font-medium uppercase tracking-wide mb-2">
                {{ product.category }}
              </p>
              
              <!-- Name -->
              <h1 class="text-2xl md:text-3xl font-display font-bold text-surface-900 mb-2">
                {{ product.name }}
              </h1>
              
              <!-- Price -->
              <div class="flex items-center gap-3 mb-4">
                <span class="text-2xl font-bold text-primary-700">
                  {{ formatPrice(product.price) }}
                </span>
                <span 
                  v-if="product.comparePrice && product.comparePrice > product.price"
                  class="text-lg text-surface-400 line-through"
                >
                  {{ formatPrice(product.comparePrice) }}
                </span>
              </div>
              
              <!-- Stock Status -->
              <p 
                class="text-sm font-medium mb-4"
                :class="isOutOfStock ? 'text-red-500' : 'text-green-600'"
              >
                {{ isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock} available)` }}
              </p>
              
              <!-- Description -->
              <p class="text-surface-600 mb-6 leading-relaxed">
                {{ product.description }}
              </p>
              
              <!-- Benefits -->
              <div v-if="product.benefits?.length" class="mb-6">
                <h3 class="text-sm font-semibold text-surface-900 mb-2">Key Benefits</h3>
                <ul class="space-y-2">
                  <li 
                    v-for="benefit in product.benefits" 
                    :key="benefit"
                    class="flex items-start gap-2 text-sm text-surface-600"
                  >
                    <svg class="w-5 h-5 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ benefit }}
                  </li>
                </ul>
              </div>
              
              <!-- Weight/Size -->
              <p v-if="product.weight" class="text-sm text-surface-500 mb-6">
                <span class="font-medium">Size:</span> {{ product.weight }}
              </p>
              
              <!-- Action Buttons -->
              <div class="mt-auto space-y-3">
                <div class="flex gap-3">
                  <button 
                    class="flex-1 btn btn-primary btn-lg"
                    :class="{ 'opacity-50 cursor-not-allowed': isOutOfStock }"
                    :disabled="isOutOfStock"
                    @click="handleAddToCart"
                  >
                    {{ inCart ? 'Added to Cart ✓' : 'Add to Cart' }}
                  </button>
                  <button 
                    class="w-14 h-14 rounded-xl border border-surface-200 flex items-center justify-center hover:bg-surface-50 transition-colors"
                    :class="{ 'bg-red-50 border-red-200': inWishlist }"
                    @click="handleToggleWishlist"
                  >
                    <svg 
                      class="w-6 h-6"
                      :class="inWishlist ? 'text-red-500 fill-current' : 'text-surface-600'"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                
                <button 
                  v-if="!isOutOfStock"
                  class="w-full btn btn-accent btn-lg"
                  @click="handleBuyNow"
                >
                  Buy Now
                </button>
              </div>
              
              <!-- Usage Instructions -->
              <div v-if="product.usage" class="mt-6 p-4 bg-primary-50 rounded-xl">
                <h3 class="text-sm font-semibold text-primary-800 mb-1">How to Use</h3>
                <p class="text-sm text-primary-700">{{ product.usage }}</p>
              </div>
            </div>
          </div>
          
          <!-- Related Products -->
          <div v-if="related.length" class="border-t border-surface-200 p-6">
            <h3 class="text-lg font-display font-bold text-surface-900 mb-4">You May Also Like</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                v-for="item in related" 
                :key="item.id"
                class="cursor-pointer group"
                @click="viewRelated(item.slug)"
              >
                <div class="aspect-square rounded-xl overflow-hidden bg-surface-100 mb-2">
                  <img 
                    v-if="item.images?.[0]"
                    :src="item.images[0]"
                    :alt="item.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h4 class="text-sm font-medium text-surface-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                  {{ item.name }}
                </h4>
                <p class="text-sm font-bold text-primary-700">{{ formatPrice(item.price) }}</p>
              </div>
            </div>
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

.scale-enter-from .animate-scale-in,
.scale-leave-to .animate-scale-in {
  transform: scale(0.95);
}
</style>
