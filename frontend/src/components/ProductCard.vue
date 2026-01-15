<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '../composables/useCart'
import { useWishlist } from '../composables/useWishlist'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const { addItem, isInCart } = useCart()
const { toggleItem, isInWishlist } = useWishlist()

const discount = computed(() => {
  if (props.product.comparePrice && props.product.comparePrice > props.product.price) {
    return Math.round(((props.product.comparePrice - props.product.price) / props.product.comparePrice) * 100)
  }
  return 0
})

const isOutOfStock = computed(() => props.product.stock <= 0)
const inCart = computed(() => isInCart(props.product.id))
const inWishlist = computed(() => isInWishlist(props.product.id))

function viewProduct() {
  router.push(`/product/${props.product.slug}`)
}

function handleAddToCart(e) {
  e.stopPropagation()
  if (!isOutOfStock.value) {
    addItem(props.product)
  }
}

function handleToggleWishlist(e) {
  e.stopPropagation()
  toggleItem(props.product)
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price)
}
</script>

<template>
  <article 
    class="card group cursor-pointer"
    @click="viewProduct"
  >
    <!-- Image Container -->
    <div class="relative aspect-square overflow-hidden bg-surface-100">
      <!-- Product Image -->
      <img 
        v-if="product.images?.[0]"
        :src="product.images[0]"
        :alt="product.name"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <div 
        v-else 
        class="w-full h-full flex items-center justify-center bg-linear-to-br from-primary-100 to-primary-50"
      >
        <svg class="w-16 h-16 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      
      <!-- Discount Badge -->
      <div 
        v-if="discount > 0"
        class="absolute top-3 left-3 bg-secondary-500 text-white text-xs font-bold px-2 py-1 rounded-full"
      >
        {{ discount }}% OFF
      </div>
      
      <!-- Bestseller Badge -->
      <div 
        v-if="product.tags?.includes('bestseller')"
        class="absolute top-3 right-3 bg-accent-500 text-white text-xs font-bold px-2 py-1 rounded-full"
      >
        Bestseller
      </div>
      
      <!-- New Badge -->
      <div 
        v-else-if="product.tags?.includes('new')"
        class="absolute top-3 right-3 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-full"
      >
        New
      </div>
      
      <!-- Out of Stock Overlay -->
      <div 
        v-if="isOutOfStock"
        class="absolute inset-0 bg-surface-900/60 flex items-center justify-center"
      >
        <span class="bg-surface-900 text-white px-4 py-2 rounded-full font-medium">
          Out of Stock
        </span>
      </div>
      
      <!-- Quick Actions -->
      <div class="absolute bottom-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <!-- Wishlist Button -->
        <button 
          class="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-primary-50 transition-colors"
          :class="{ 'bg-primary-50': inWishlist }"
          @click="handleToggleWishlist"
          :title="inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'"
        >
          <svg 
            class="w-5 h-5 transition-colors"
            :class="inWishlist ? 'text-red-500 fill-current' : 'text-surface-600'"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        
        <!-- Add to Cart Button -->
        <button 
          v-if="!isOutOfStock"
          class="w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors"
          :class="inCart ? 'bg-primary-600 text-white' : 'bg-white text-surface-600 hover:bg-primary-50'"
          @click="handleAddToCart"
          :title="inCart ? 'Added to Cart' : 'Add to Cart'"
        >
          <svg v-if="inCart" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Product Info -->
    <div class="p-4">
      <!-- Category -->
      <p class="text-xs text-primary-600 font-medium uppercase tracking-wide mb-1">
        {{ product.category }}
      </p>
      
      <!-- Name -->
      <h3 class="font-display font-semibold text-surface-900 mb-1 line-clamp-2 group-hover:text-primary-700 transition-colors">
        {{ product.name }}
      </h3>
      
      <!-- Short Description -->
      <p class="text-sm text-surface-500 mb-3 line-clamp-2">
        {{ product.shortDescription }}
      </p>
      
      <!-- Price -->
      <div class="flex items-center gap-2">
        <span class="text-lg font-bold text-primary-700">
          {{ formatPrice(product.price) }}
        </span>
        <span 
          v-if="product.comparePrice && product.comparePrice > product.price"
          class="text-sm text-surface-400 line-through"
        >
          {{ formatPrice(product.comparePrice) }}
        </span>
      </div>
      
      <!-- Mobile Add to Cart -->
      <button 
        v-if="!isOutOfStock"
        class="md:hidden w-full mt-3 btn btn-primary btn-sm"
        @click="handleAddToCart"
      >
        {{ inCart ? 'Added ✓' : 'Add to Cart' }}
      </button>
    </div>
  </article>
</template>
