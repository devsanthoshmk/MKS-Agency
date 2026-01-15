<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '../composables/useCart'
import { useWishlist } from '../composables/useWishlist'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { itemCount: cartCount, toggleCart } = useCart()
const { itemCount: wishlistCount, toggleWishlist } = useWishlist()
const { isAuthenticated, user, logout, openAuthModal } = useAuth()

const isMobileMenuOpen = ref(false)
const isScrolled = ref(false)

// Track scroll for header styling
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    isScrolled.value = window.scrollY > 20
  })
}

function handleAuthClick() {
  if (isAuthenticated.value) {
    // Show user menu or logout
    logout()
  } else {
    openAuthModal()
  }
}

function goToOrders() {
  router.push('/orders')
}
</script>

<template>
  <header 
    :class="[
      'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
      isScrolled ? 'glass shadow-sm py-2' : 'bg-transparent py-4'
    ]"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
            <span class="text-white text-xl font-bold">M</span>
          </div>
          <div class="hidden sm:block">
            <span class="text-xl font-display font-bold text-primary-700">MKS</span>
            <span class="text-xl font-display text-surface-600"> Ayurvedic</span>
          </div>
        </router-link>
        
        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-6">
          <router-link 
            to="/" 
            class="text-surface-600 hover:text-primary-600 font-medium transition-colors"
          >
            Home
          </router-link>
          <router-link 
            to="/products" 
            class="text-surface-600 hover:text-primary-600 font-medium transition-colors"
          >
            Products
          </router-link>
        </nav>
        
        <!-- Right Side Actions -->
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Search (Desktop) -->
          <button 
            class="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-100 transition-colors"
            @click="router.push('/products?focus=search')"
          >
            <svg class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          <!-- Wishlist -->
          <button 
            class="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-100 transition-colors"
            @click="toggleWishlist"
          >
            <svg class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span 
              v-if="wishlistCount > 0"
              class="absolute -top-1 -right-1 w-5 h-5 bg-secondary-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
            >
              {{ wishlistCount > 99 ? '99+' : wishlistCount }}
            </span>
          </button>
          
          <!-- Cart -->
          <button 
            class="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-100 transition-colors"
            @click="toggleCart"
          >
            <svg class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span 
              v-if="cartCount > 0"
              class="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-medium"
            >
              {{ cartCount > 99 ? '99+' : cartCount }}
            </span>
          </button>
          
          <!-- User / Auth -->
          <button 
            class="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-surface-100 transition-colors"
            @click="handleAuthClick"
          >
            <template v-if="isAuthenticated">
              <img 
                v-if="user?.avatar_url"
                :src="user.avatar_url"
                :alt="user.name"
                class="w-8 h-8 rounded-full"
              />
              <div v-else class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span class="text-primary-700 font-medium">{{ user?.name?.[0] || 'U' }}</span>
              </div>
              <span class="hidden sm:block text-sm font-medium text-surface-700">
                {{ user?.name?.split(' ')[0] }}
              </span>
            </template>
            <template v-else>
              <svg class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="hidden sm:block text-sm font-medium text-surface-600">Sign In</span>
            </template>
          </button>
          
          <!-- Orders (if authenticated) -->
          <button 
            v-if="isAuthenticated"
            class="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-100 transition-colors"
            @click="goToOrders"
            title="My Orders"
          >
            <svg class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          
          <!-- Mobile Menu Toggle -->
          <button 
            class="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-100 transition-colors"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <svg v-if="!isMobileMenuOpen" class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Mobile Menu -->
      <transition name="slide-down">
        <nav 
          v-if="isMobileMenuOpen" 
          class="md:hidden mt-4 pb-4 border-t border-surface-200 pt-4"
        >
          <div class="flex flex-col gap-2">
            <router-link 
              to="/" 
              class="px-4 py-2 text-surface-600 hover:text-primary-600 hover:bg-surface-100 rounded-lg transition-colors"
              @click="isMobileMenuOpen = false"
            >
              Home
            </router-link>
            <router-link 
              to="/products" 
              class="px-4 py-2 text-surface-600 hover:text-primary-600 hover:bg-surface-100 rounded-lg transition-colors"
              @click="isMobileMenuOpen = false"
            >
              Products
            </router-link>
            <router-link 
              v-if="isAuthenticated"
              to="/orders" 
              class="px-4 py-2 text-surface-600 hover:text-primary-600 hover:bg-surface-100 rounded-lg transition-colors"
              @click="isMobileMenuOpen = false"
            >
              My Orders
            </router-link>
          </div>
        </nav>
      </transition>
    </div>
  </header>
  
  <!-- Spacer for fixed header -->
  <div class="h-16 sm:h-20" />
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
