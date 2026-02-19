<script setup>
import { computed } from 'vue'
import { useUI } from '../composables/useUI'
import { useCart } from '../composables/useCart'
import { useWishlist } from '../composables/useWishlist'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const { addItem, isInCart } = useCart()
const { toggleItem, isInWishlist } = useWishlist()
const { openModal } = useUI()

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
  openModal('product', props.product)
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
    class="group cursor-pointer h-full flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    @click="viewProduct"
  >
    <!-- Image Container -->
    <div class="relative aspect-[3/4] overflow-hidden bg-surface-100">
      <img
        v-if="product.images?.[0]"
        :src="product.images[0]"
        :alt="product.name"
        class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        loading="lazy"
      />
      <!-- Fallback -->
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-100 to-surface-200"
      >
        <svg class="w-12 h-12 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- Hover overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <!-- ── BADGES ── -->
      <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        <span v-if="discount > 0" class="product-badge product-badge--sale">
          {{ discount }}% OFF
        </span>
        <span v-if="product.tags?.includes('bestseller')" class="product-badge product-badge--best">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Bestseller
        </span>
        <span v-if="product.tags?.includes('new')" class="product-badge product-badge--new">
          New
        </span>
        <span v-if="isOutOfStock" class="product-badge product-badge--oos">
          Sold Out
        </span>
      </div>

      <!-- ── WISHLIST (Top-Right) ── -->
      <button
        class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
        :class="inWishlist
          ? 'bg-red-50 text-red-500 ring-1 ring-red-200 opacity-100'
          : 'bg-white/90 backdrop-blur-sm text-surface-400 hover:text-red-500 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'"
        @click.stop="handleToggleWishlist"
        :title="inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'"
      >
        <svg
          class="w-[18px] h-[18px]"
          :class="inWishlist ? 'fill-red-500 stroke-red-500' : ''"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <!-- ── ADD TO CART (Desktop Hover) ── -->
      <div class="absolute bottom-0 left-0 right-0 p-3 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out hidden md:block z-10">
        <button
          v-if="!isOutOfStock"
          class="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-surface-900 text-white text-sm font-bold transition-colors duration-200 hover:bg-black"
          @click.stop="handleAddToCart"
        >
          <template v-if="inCart">
            <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
            In Cart
          </template>
          <template v-else>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            Add to Cart
          </template>
        </button>
      </div>
    </div>

    <!-- ── CONTENT ── -->
    <div class="p-4 flex flex-col flex-1">
      <!-- Category -->
      <span class="text-[10px] font-bold uppercase tracking-[0.12em] text-primary-600 mb-1.5">
        {{ product.category }}
      </span>

      <!-- Name -->
      <h3 class="font-display font-bold text-[15px] sm:text-base text-surface-900 leading-snug mb-2.5 group-hover:text-primary-700 transition-colors line-clamp-2">
        {{ product.name }}
      </h3>

      <!-- Price Row -->
      <div class="mt-auto flex items-baseline gap-2.5">
        <span class="text-lg font-bold text-surface-900 tracking-tight">
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
        class="md:hidden w-full flex items-center justify-center gap-2 mt-3 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200"
        :class="isOutOfStock
          ? 'bg-surface-100 text-surface-400 border-surface-200 cursor-not-allowed'
          : inCart
            ? 'bg-primary-50 text-primary-700 border-primary-200'
            : 'bg-white text-surface-800 border-surface-200 hover:border-surface-300'"
        @click.stop="handleAddToCart"
        :disabled="isOutOfStock"
      >
        <template v-if="isOutOfStock">Sold Out</template>
        <template v-else-if="inCart">
          <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
          In Cart
        </template>
        <template v-else>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          Add to Cart
        </template>
      </button>
    </div>
  </article>
</template>

<style scoped>
/* Badge base — plain CSS, no @apply */
.product-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
  border-radius: 8px;
}

/* Sale = solid red */
.product-badge--sale {
  background: #ef4444;
  color: #fff;
}

/* Bestseller = solid warm gold */
.product-badge--best {
  background: #f59e0b;
  color: #451a03;
}

/* New = solid blue */
.product-badge--new {
  background: #3b82f6;
  color: #fff;
}

/* Out of stock = solid dark */
.product-badge--oos {
  background: #1e293b;
  color: #fff;
}
</style>
