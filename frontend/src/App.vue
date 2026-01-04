<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import TheHeader from './components/TheHeader.vue'
import CartPanel from './components/CartPanel.vue'
import WishlistPanel from './components/WishlistPanel.vue'
import ProductModal from './components/ProductModal.vue'
import CheckoutModal from './components/CheckoutModal.vue'
import OrdersModal from './components/OrdersModal.vue'
import AuthModal from './components/AuthModal.vue'
import ToastNotifications from './components/ToastNotifications.vue'
import { useCart } from './composables/useCart'
import { useWishlist } from './composables/useWishlist'
import { useProducts } from './composables/useProducts'
import { useAuth } from './composables/useAuth'
import { useUI } from './composables/useUI'

const route = useRoute()
const { isOpen: isCartOpen } = useCart()
const { isOpen: isWishlistOpen } = useWishlist()
const { loadProducts, getProductBySlug } = useProducts()
const { isAuthModalOpen } = useAuth()
const { activeModal, openModal, closeModal, setupEscapeListener, removeEscapeListener } = useUI()

// Load products on mount
onMounted(async () => {
  await loadProducts()
  setupEscapeListener()
})

onUnmounted(() => {
  removeEscapeListener()
})

// Watch route for product modal
watch(() => route.params.slug, (slug) => {
  if (slug && route.name === 'product-detail') {
    const product = getProductBySlug(slug)
    if (product) {
      openModal('product', product)
    }
  } else if (activeModal.value === 'product') {
    closeModal()
  }
}, { immediate: true })

// Watch route for checkout modal
watch(() => route.name, (name) => {
  if (name === 'checkout') {
    openModal('checkout')
  } else if (name === 'orders') {
    openModal('orders')
  }
}, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-surface-50">
    <!-- Header -->
    <TheHeader />
    
    <!-- Main Content -->
    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- Side Panels -->
    <CartPanel />
    <WishlistPanel />
    
    <!-- Modals -->
    <ProductModal />
    <CheckoutModal />
    <OrdersModal />
    <AuthModal />
    
    <!-- Toast Notifications -->
    <ToastNotifications />
    
    <!-- Overlay -->
    <transition name="fade">
      <div 
        v-if="isCartOpen || isWishlistOpen || activeModal"
        class="overlay"
        @click="closeModal"
      />
    </transition>
  </div>
</template>

<style>
/* Page Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide transitions for panels */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}

/* Scale transition for modals */
.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}
</style>
