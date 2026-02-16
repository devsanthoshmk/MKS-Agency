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
const { activeModal, openModal, closeModalWithoutNavigation, setupEscapeListener, removeEscapeListener } = useUI()

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

// Watch route hash for cart/wishlist modals
watch(() => route.hash, (hash, oldHash) => {
  if (hash === '#wishlist') {
    openModal('wishlist')
  } else if (hash === '#cart') {
    openModal('cart')
  } else if (oldHash === '#wishlist' || oldHash === '#cart') {
    // Hash was removed, close the modal
    closeModalWithoutNavigation()
  }
}, { immediate: true })

// Watch route for checkout/orders modals
watch(() => route.name, (name) => {
  if (name === 'checkout') {
    openModal('checkout')
  } else if (name === 'orders') {
    openModal('orders')
  }
}, { immediate: true })

// Handle overlay click - close and remove hash from URL
function handleOverlayClick() {
  if (activeModal.value === 'cart' || activeModal.value === 'wishlist') {
    // Only navigate if there's a hash to remove
    if (route.hash === '#cart' || route.hash === '#wishlist') {
      router.push({ path: route.path, hash: '' })
    } else {
      // Cart was opened without hash (e.g., from addItem), just close it
      closeModalWithoutNavigation()
    }
  } else {
    closeModalWithoutNavigation()
  }
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
    
    <!-- Overlay -->
    <transition name="fade">
      <div 
        v-if="isCartOpen || isWishlistOpen || activeModal"
        class="overlay"
        @click="handleOverlayClick"
      />
    </transition>

    <!-- Maintenance Popup -->
    <transition name="popup-scale">
      <div v-if="showMaintenancePopup" class="maintenance-overlay" @click.self="dismissMaintenancePopup">
        <div class="maintenance-popup">
          <!-- Decorative Elements -->
          <div class="popup-glow"></div>
          <div class="popup-pattern"></div>
          
          <!-- Content -->
          <div class="popup-content">
            <!-- Animated Icon -->
            <div class="icon-container">
              <div class="icon-ring"></div>
              <div class="icon-ring icon-ring-2"></div>
              <svg class="construction-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>

            <!-- Badge -->
            <div class="status-badge">
              <span class="pulse-dot"></span>
              <span>Under Development</span>
            </div>

            <!-- Title -->
            <h2 class="popup-title">Welcome to Our Preview</h2>

            <!-- Message -->
            <p class="popup-message">
              We're putting the finishing touches on something amazing! 
              This site is currently in <strong>demo mode</strong> — feel free to explore 
              our products and experience the full checkout flow.
            </p>

            <!-- Feature List -->
            <div class="features-list">
              <div class="feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Browse our complete catalog</span>
              </div>
              <div class="feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Test the shopping experience</span>
              </div>
              <div class="feature-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Place sample orders (not processed)</span>
              </div>
            </div>

            <!-- Notice -->
            <div class="notice-box">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Orders placed here are for demonstration purposes only and will not be fulfilled.</span>
            </div>

            <!-- CTA Button -->
            <button class="cta-button" @click="dismissMaintenancePopup">
              <span>Continue Exploring</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
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

/* Popup Scale Transition */
.popup-scale-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.popup-scale-leave-active {
  transition: all 0.3s ease-out;
}

.popup-scale-enter-from,
.popup-scale-leave-to {
  opacity: 0;
}

.popup-scale-enter-from .maintenance-popup,
.popup-scale-leave-to .maintenance-popup {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

/* Maintenance Popup Styles */
.maintenance-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.maintenance-popup {
  position: relative;
  width: 100%;
  max-width: 520px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.98));
  border-radius: 24px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.popup-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.popup-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.05) 1px, transparent 0);
  background-size: 24px 24px;
  pointer-events: none;
}

.popup-content {
  position: relative;
  z-index: 1;
  padding: 2.5rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Icon Container */
.icon-container {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.icon-ring {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(99, 102, 241, 0.2);
  border-radius: 50%;
  animation: pulse-ring 2s ease-out infinite;
}

.icon-ring-2 {
  animation-delay: 1s;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.construction-icon {
  width: 40px;
  height: 40px;
  color: #6366f1;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fcd34d;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #92400e;
  margin-bottom: 1.25rem;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #f59e0b;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

/* Typography */
.popup-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.75rem;
  line-height: 1.2;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.popup-message {
  font-size: 1rem;
  line-height: 1.6;
  color: #64748b;
  margin-bottom: 1.5rem;
  max-width: 420px;
}

.popup-message strong {
  color: #6366f1;
  font-weight: 600;
}

/* Features List */
.features-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 320px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.5rem 0;
}

.feature-item svg {
  width: 18px;
  height: 18px;
  color: #10b981;
  flex-shrink: 0;
}

.feature-item span {
  font-size: 0.9rem;
  color: #475569;
  text-align: left;
}

/* Notice Box */
.notice-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  width: 100%;
}

.notice-box svg {
  width: 20px;
  height: 20px;
  color: #ef4444;
  flex-shrink: 0;
  margin-top: 1px;
}

.notice-box span {
  font-size: 0.85rem;
  color: #991b1b;
  text-align: left;
  line-height: 1.5;
}

/* CTA Button */
.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 1rem 2rem;
  width: 100%;
  max-width: 280px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}

.cta-button:active {
  transform: translateY(0);
}

.cta-button svg {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.cta-button:hover svg {
  transform: translateX(4px);
}

/* Responsive */
@media (max-width: 480px) {
  .popup-content {
    padding: 2rem 1.5rem 1.5rem;
  }
  
  .popup-title {
    font-size: 1.5rem;
  }
  
  .popup-message {
    font-size: 0.9rem;
  }
  
  .icon-container {
    width: 64px;
    height: 64px;
  }
  
  .construction-icon {
    width: 32px;
    height: 32px;
  }
}
</style>
