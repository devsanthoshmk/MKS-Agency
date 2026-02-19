<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUI } from '../composables/useUI'
import { useCart } from '../composables/useCart'
import { useWishlist } from '../composables/useWishlist'

const router = useRouter()
const { activeModal, modalData, closeModal, closeModalWithoutNavigation } = useUI()
const { addItem: addToCart, isInCart } = useCart()
const { toggleItem, isInWishlist } = useWishlist()

// Image gallery state
const selectedImageIndex = ref(0)

const isOpen = computed(() => activeModal.value === 'product' && modalData.value)
const product = computed(() => modalData.value)

// Admin preview mode
const isAdminPreview = computed(() => !!product.value?._adminPreview)

const currentImage = computed(() => {
  if (product.value?.images?.length > 0) {
    return product.value.images[selectedImageIndex.value] || product.value.images[0]
  }
  return null
})

// Reset state when product changes
watch(product, () => {
  selectedImageIndex.value = 0
})

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
  if (isAdminPreview.value) {
    closeModalWithoutNavigation()
  } else {
    closeModal()
  }
}

function nextImage() {
  if (product.value?.images?.length) {
    selectedImageIndex.value = (selectedImageIndex.value + 1) % product.value.images.length
  }
}

function prevImage() {
  if (product.value?.images?.length) {
    selectedImageIndex.value = (selectedImageIndex.value - 1 + product.value.images.length) % product.value.images.length
  }
}
</script>

<template>
  <transition name="modal-fade">
    <div 
      v-if="isOpen && product"
      class="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6"
    >
      <!-- Backdrop with Blur -->
      <div 
        class="absolute inset-0 bg-surface-900/60 backdrop-blur-sm transition-opacity" 
        @click="handleClose"
      />
      
      <!-- Modal Container -->
      <div 
        class="relative w-full max-w-6xl h-[90vh] md:h-[85vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-modal-slide-up ring-1 ring-white/20"
        :class="isAdminPreview ? 'bg-[#111218] border border-white/10' : 'bg-white'"
      >
        <!-- Close Button (Absolute) -->
        <button 
          class="absolute top-6 right-6 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md group"
          :class="isAdminPreview ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/80 hover:bg-white text-surface-900 shadow-sm'"
          @click="handleClose"
        >
          <svg class="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Left: Image Gallery (Cinematic) -->
        <div class="w-full md:w-[55%] lg:w-[60%] h-[40vh] md:h-full relative bg-surface-100/50 group overflow-hidden">
          <!-- Main Image -->
          <div 
            class="w-full h-full cursor-zoom-in relative"
            @click="nextImage"
          >
             <transition name="fade" mode="out-in">
                <img 
                  v-if="currentImage"
                  :key="currentImage"
                  :src="currentImage"
                  :alt="product.name"
                  class="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                />
             </transition>
             
             <!-- Gradient Overlay for mobile text contrast if needed -->
             <div class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/10 to-transparent pointer-events-none md:hidden"></div>
          </div>

          <!-- Navigation Arrows (Desktop) -->
          <div v-if="product.images?.length > 1" class="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none px-4">
             <button @click.stop="prevImage" class="w-12 h-12 rounded-full bg-white/90 shadow-lg text-surface-900 flex items-center justify-center pointer-events-auto hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
             </button>
             <button @click.stop="nextImage" class="w-12 h-12 rounded-full bg-white/90 shadow-lg text-surface-900 flex items-center justify-center pointer-events-auto hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
             </button>
          </div>

          <!-- Thumbnails (Floating at bottom center) -->
          <div 
            v-if="product.images?.length > 1"
            class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 p-2 bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 max-w-[90%] overflow-x-auto scrollbar-hide z-10"
          >
            <button 
              v-for="(img, idx) in product.images" 
              :key="idx"
              class="relative w-14 h-14 rounded-xl overflow-hidden transition-all duration-300 shrink-0"
              :class="selectedImageIndex === idx ? 'ring-2 ring-primary-600 scale-105 opacity-100' : 'opacity-60 hover:opacity-100 hover:scale-105'"
              @click.stop="selectedImageIndex = idx"
            >
              <img :src="img" class="w-full h-full object-cover" />
            </button>
          </div>

           <!-- Badges (Floating Top Left) -->
          <div class="absolute top-6 left-6 flex flex-col gap-2 items-start pointer-events-none z-10">
            <span v-if="discount > 0" class="px-3 py-1 bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
              Save {{ discount }}%
            </span>
            <span v-if="isOutOfStock" class="px-3 py-1 bg-surface-900 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
              Out of Stock
            </span>
             <span v-if="product.tags?.includes('bestseller')" class="px-3 py-1 bg-amber-400 text-amber-900 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
              Bestseller
            </span>
          </div>
        </div>

        <!-- Right: Product Details (Scrollable) -->
        <div class="flex-1 overflow-y-auto custom-scrollbar relative">
          <div class="p-8 md:p-10 lg:p-12 flex flex-col min-h-full">
            
            <!-- Admin Banner -->
             <div v-if="isAdminPreview" class="mb-6 py-2 px-3 rounded-lg bg-surface-800 border border-surface-700 inline-flex items-center gap-2 self-start">
               <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span class="text-xs font-medium text-surface-300 uppercase tracking-widest">Preview Mode</span>
             </div>

            <!-- Breadcrumbs / Category -->
            <nav class="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-surface-400 mb-4">
               <span>Shop</span>
               <span class="text-surface-300">/</span>
               <span class="text-primary-600">{{ product.category }}</span>
            </nav>

            <!-- Title -->
            <h2 class="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-surface-900 leading-[1.1] mb-6">
              {{ product.name }}
            </h2>

            <!-- Price Block -->
            <div class="flex items-baseline gap-4 mb-8 pb-8 border-b border-surface-100">
               <span class="text-3xl font-display font-medium text-primary-700">
                  {{ formatPrice(product.price) }}
               </span>
               <span v-if="product.comparePrice" class="text-xl text-surface-400 line-through decoration-surface-300">
                  {{ formatPrice(product.comparePrice) }}
               </span>
            </div>

            <!-- Description -->
            <div class="prose prose-lg text-surface-600 prose-headings:font-display prose-headings:text-surface-900 mb-8">
              <p>{{ product.description }}</p>
            </div>

            <!-- Specs Grid -->
            <div class="grid grid-cols-2 gap-4 mb-8">
                <div v-if="product.weight" class="bg-surface-50 p-4 rounded-2xl border border-surface-100 transition-colors hover:border-primary-100">
                    <span class="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-1">Net Weight</span>
                    <span class="font-display text-lg text-surface-900">{{ product.weight }}</span>
                </div>
                 <div v-if="product.stock > 0" class="bg-green-50 p-4 rounded-2xl border border-green-100 transition-colors hover:border-green-200">
                    <span class="block text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Availability</span>
                    <span class="font-display text-lg text-green-800">In Stock</span>
                </div>
            </div>

            <!-- Benefits -->
            <div v-if="product.benefits?.length" class="mb-10">
               <h3 class="text-sm font-bold text-surface-900 uppercase tracking-widest mb-4">Why You'll Love It</h3>
               <div class="flex flex-wrap gap-3">
                  <span 
                    v-for="benefit in product.benefits" 
                    :key="benefit"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-50 border border-surface-200 text-sm font-medium text-surface-700 transition-colors hover:border-primary-200 hover:bg-primary-50"
                  >
                    <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                    {{ benefit }}
                  </span>
               </div>
            </div>

            <!-- Sticky Bottom Actions Mobile / Regular Desktop Actions -->
            <div class="mt-auto space-y-4 pt-6 border-t border-surface-100 sticky bottom-0 bg-white/95 backdrop-blur-md -mx-8 -mb-8 p-8 md:static md:bg-transparent md:mx-0 md:mb-0 md:p-0">
               <div v-if="!isAdminPreview" class="flex flex-col sm:flex-row gap-4">
                  <!-- Wishlist Button -->
                  <button 
                    class="order-2 sm:order-1 w-full sm:w-16 h-14 rounded-full border border-surface-200 flex items-center justify-center hover:bg-surface-50 hover:border-surface-300 transition-all duration-300 group"
                    :class="{ 'border-red-200 bg-red-50': inWishlist }"
                    @click="handleToggleWishlist"
                    title="Add to Wishlist"
                  >
                     <svg class="w-6 h-6 transition-transform group-hover:scale-110" :class="inWishlist ? 'text-red-500 fill-red-500' : 'text-surface-400 group-hover:text-red-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>

                  <!-- Add to Cart -->
                   <button 
                    class="order-1 sm:order-2 flex-1 h-14 rounded-full bg-surface-900 text-white font-medium text-lg hover:bg-black transition-all duration-300 shadow-xl shadow-surface-900/10 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                    :disabled="isOutOfStock"
                    @click="handleAddToCart"
                  >
                     <span class="relative z-10 flex items-center gap-2">
                        <svg v-if="inCart" class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                        <svg v-else class="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        {{ isOutOfStock ? 'Sold Out' : (inCart ? 'Added - Add More' : 'Add to Cart') }}
                     </span>
                     <!-- Shine Effect -->
                     <div class="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>
                  </button>
               </div>
               
               <!-- Admin Close Button -->
               <button v-else @click="handleClose" class="w-full h-14 rounded-full bg-surface-800 text-surface-200 hover:bg-surface-700 font-medium transition-colors">
                 Close Preview
               </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  </transition>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.1);
  border-radius: 20px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: rgba(0,0,0,0.2);
}

/* Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.4s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.animate-modal-slide-up {
  animation: modalSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
