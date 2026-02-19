<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavbarComp from './components/NavbarComp.vue'
import CartPanel from './components/CartPanel.vue'
import WishlistPanel from './components/WishlistPanel.vue'
import ProductModal from './components/ProductModal.vue'
import CheckoutModal from './components/CheckoutModal.vue'
import OrdersModal from './components/OrdersModal.vue'
import AuthModal from './components/AuthModal.vue'
import ToastNotifications from './components/ToastNotifications.vue'
import MaintenancePopup from './components/MaintenancePopup.vue'
import { useCart } from './composables/useCart'
import { useWishlist } from './composables/useWishlist'
import { useProducts } from './composables/useProducts'
import { useAuth } from './composables/useAuth'
import { useUI } from './composables/useUI'

const route = useRoute()
const router = useRouter()
const { isOpen: isCartOpen, closeCart } = useCart()
const { isOpen: isWishlistOpen, closeWishlist } = useWishlist()
const { loadProducts, getProductBySlug } = useProducts()
const { isAuthModalOpen } = useAuth()
const { activeModal, openModal, closeModal, setupEscapeListener, removeEscapeListener } = useUI()

// Maintenance popup state
const showMaintenancePopup = ref(false)

// Check if popup was already dismissed in this session
const checkMaintenancePopup = () => {
  const dismissed = sessionStorage.getItem('maintenancePopupDismissed')
  if (!dismissed) {
    showMaintenancePopup.value = true
  }
}

const dismissMaintenancePopup = () => {
  showMaintenancePopup.value = false
  sessionStorage.setItem('maintenancePopupDismissed', 'true')
}

// Check if on admin page
const isAdminPage = computed(() => route.path.startsWith('/admin'))

// Load products on mount
onMounted(async () => {
  await loadProducts()
  setupEscapeListener()
  checkMaintenancePopup()
})

onUnmounted(() => {
  removeEscapeListener()
})

// Watch route for checkout/orders modals
watch(() => route.name, (name) => {
  if (name === 'checkout') {
    openModal('checkout')
  } else if (name === 'orders') {
    openModal('orders')
  }
}, { immediate: true })

// Handle overlay click
function handleOverlayClick() {
  closeModal()
}
</script>

<template>
  <div class="min-h-screen bg-surface-50">
    <!-- Header (hidden on admin page) -->
    <NavbarComp v-if="!isAdminPage" />
    
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
    
    <!-- Overlay for Panels/Modals -->
    <transition name="fade">
      <div 
        v-if="isCartOpen || isWishlistOpen || activeModal"
        class="overlay"
        @click="handleOverlayClick"
      />
    </transition>

    <!-- Maintenance Popup -->
    <MaintenancePopup 
      :show="showMaintenancePopup" 
      @close="dismissMaintenancePopup" 
    />
  </div>
</template>
