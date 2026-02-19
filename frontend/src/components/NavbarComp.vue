<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
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
const isUserMenuOpen = ref(false)
const userMenuRef = ref(null)

// Track scroll for header styling
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    isScrolled.value = window.scrollY > 20
  })
}

// Close user menu when clicking outside
function handleClickOutside(event) {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    isUserMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleAuthClick() {
  if (isAuthenticated.value) {
    // Toggle user dropdown menu
    isUserMenuOpen.value = !isUserMenuOpen.value
  } else {
    openAuthModal()
  }
}

function goToOrders() {
  isUserMenuOpen.value = false
  router.push('/orders')
}

function handleLogout() {
  isUserMenuOpen.value = false
  logout()
}
</script>

<template>
  <header 
    :class="[
      'fixed top-0 left-0 right-0 z-40 transition-all duration-500 ease-in-out',
      isScrolled ? 'glass h-16 sm:h-20 shadow-sm' : 'bg-transparent h-20 sm:h-24'
    ]"
  >
    <div class="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <!-- Logo -->
        <router-link to="/" class="group flex items-center gap-3">
          <div class="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shadow-lg border-2 border-white/50 group-hover:scale-105 transition-transform duration-300">
            <img src="/logo.jpeg" alt="MKS AGENCY" class="w-full h-full object-cover" />
          </div>
          <div class="hidden sm:flex flex-col">
            <span class="text-xl font-display font-bold text-surface-900 leading-none tracking-tight group-hover:text-primary-700 transition-colors">MKS AGENCY</span>
            <span class="text-[0.65rem] font-sans font-medium text-surface-500 uppercase tracking-[0.2em] mt-1">Natural Wellness</span>
          </div>
        </router-link>
        
        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-1 bg-surface-50/50 backdrop-blur-md px-2 py-1.5 rounded-full border border-surface-200/50 shadow-sm ml-8">
          <router-link 
            to="/" 
            class="px-5 py-2 text-sm font-medium text-surface-600 rounded-full hover:text-surface-900 hover:bg-white transition-all duration-300 relative group"
            active-class="!bg-white !text-primary-700 shadow-sm"
          >
            Home
          </router-link>
          <router-link 
            to="/products" 
            class="px-5 py-2 text-sm font-medium text-surface-600 rounded-full hover:text-surface-900 hover:bg-white transition-all duration-300 relative group"
            active-class="!bg-white !text-primary-700 shadow-sm"
          >
            Products
          </router-link>
        </nav>
        
        <!-- Right Side Actions -->
        <div class="flex items-center gap-3 sm:gap-5">
          <!-- Search (Desktop) -->
          <button 
            class="hidden sm:flex items-center justify-center w-10 h-10 rounded-full text-surface-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300"
            @click="router.push('/products?focus=search')"
            title="Search Products"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          <!-- Wishlist -->
          <button 
            class="relative flex items-center justify-center w-10 h-10 rounded-full text-surface-500 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
            @click="toggleWishlist"
            title="Wishlist"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span 
              v-if="wishlistCount > 0"
              class="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold ring-2 ring-white animate-scale-in"
            >
              {{ wishlistCount }}
            </span>
          </button>
          
          <!-- Cart -->
          <button 
            class="relative flex items-center justify-center w-10 h-10 rounded-full text-surface-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300"
            @click="toggleCart"
            title="Shopping Cart"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span 
              v-if="cartCount > 0"
              class="absolute top-0 right-0 w-4 h-4 bg-primary-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold ring-2 ring-white animate-scale-in"
            >
              {{ cartCount }}
            </span>
          </button>
          
          <!-- User / Auth with Dropdown -->
          <div class="relative" ref="userMenuRef">
            <button 
              class="flex items-center gap-2 pl-2 pr-1 py-1 sm:pl-3 sm:pr-2 sm:py-1.5 rounded-full border border-surface-200 bg-white/50 hover:bg-white hover:shadow-md transition-all duration-300 group"
              @click="handleAuthClick"
              :class="{ 'ring-2 ring-primary-100 ring-offset-2': isUserMenuOpen }"
            >
              <template v-if="isAuthenticated">
                <span class="hidden sm:block text-xs font-bold text-surface-700 uppercase tracking-wide px-1">
                  {{ user?.name?.split(' ')[0] }}
                </span>
                <img 
                  v-if="user?.avatar_url"
                  :src="user.avatar_url"
                  :alt="user.name"
                  class="w-7 h-7 rounded-full ring-2 ring-white object-cover"
                />
                <div v-else class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center ring-2 ring-white text-primary-700 font-bold text-xs uppercase">
                  {{ user?.name?.[0] || 'U' }}
                </div>
              </template>
              <template v-else>
                <span class="hidden sm:block text-xs font-bold text-surface-600 uppercase tracking-wide px-2 group-hover:text-primary-600">Account</span>
                <div class="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </template>
            </button>
            
            <!-- User Dropdown Menu -->
            <transition name="dropdown">
              <div 
                v-if="isUserMenuOpen && isAuthenticated"
                class="absolute right-0 top-full mt-3 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-surface-100 py-2 z-50 overflow-hidden text-left"
              >
                <!-- User Info -->
                <div class="px-5 py-4 border-b border-surface-100 bg-surface-50/50">
                  <p class="text-sm font-bold text-surface-900 truncate">{{ user?.name }}</p>
                  <p class="text-xs text-surface-500 truncate mt-0.5">{{ user?.email }}</p>
                </div>
                
                <!-- Menu Items -->
                <div class="p-2 space-y-1">
                  <button 
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-surface-700 rounded-xl hover:bg-surface-50 hover:text-primary-700 transition-all duration-200 group"
                    @click="goToOrders"
                  >
                    <div class="p-1.5 rounded-lg bg-surface-100 text-surface-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    My Orders
                  </button>
                  
                  <button 
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 group"
                    @click="handleLogout"
                  >
                     <div class="p-1.5 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                     </div>
                    Sign Out
                  </button>
                </div>
              </div>
            </transition>
          </div>
          
          <!-- Mobile Menu Toggle Button (Hamburger) -->
           <button 
                class="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-full hover:bg-surface-100 transition-colors gap-1.5 group"
                @click="isMobileMenuOpen = !isMobileMenuOpen"
                aria-label="Toggle Menu"
            >
                <span 
                    class="w-5 h-0.5 bg-surface-800 rounded-full transition-all duration-300 origin-center" 
                    :class="isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''"
                ></span>
                <span 
                    class="w-5 h-0.5 bg-surface-800 rounded-full transition-all duration-300" 
                    :class="isMobileMenuOpen ? 'opacity-0' : ''"
                ></span>
                <span 
                    class="w-5 h-0.5 bg-surface-800 rounded-full transition-all duration-300 origin-center" 
                    :class="isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''"
                ></span>
            </button>
        </div>
    </div>
      
    <!-- Mobile Menu Overlay -->
    <transition name="fade">
      <div 
        v-if="isMobileMenuOpen" 
        class="fixed inset-0 bg-surface-900/20 backdrop-blur-sm z-30 md:hidden mt-[80px]"
        @click="isMobileMenuOpen = false"
      />
    </transition>

    <!-- Mobile Menu Slide-down -->
    <transition name="slide-down">
      <nav 
        v-if="isMobileMenuOpen" 
        class="absolute top-full left-0 right-0 bg-white border-b border-surface-100 shadow-xl z-40 md:hidden overflow-hidden rounded-b-3xl"
      >
        <div class="px-6 py-8 flex flex-col gap-4">
          <router-link 
            to="/" 
            class="text-lg font-display font-medium text-surface-900 hover:text-primary-600 transition-colors flex items-center justify-between group"
            @click="isMobileMenuOpen = false"
          >
            Home
            <span class="w-8 h-8 rounded-full bg-surface-50 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                <svg class="w-4 h-4 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </span>
          </router-link>
          <div class="h-px bg-surface-100 w-full"></div>
          <router-link 
            to="/products" 
            class="text-lg font-display font-medium text-surface-900 hover:text-primary-600 transition-colors flex items-center justify-between group"
            @click="isMobileMenuOpen = false"
          >
            Products
             <span class="w-8 h-8 rounded-full bg-surface-50 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                <svg class="w-4 h-4 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </span>
          </router-link>
           <div class="h-px bg-surface-100 w-full"></div>
          <router-link 
            v-if="isAuthenticated"
            to="/orders" 
            class="text-lg font-display font-medium text-surface-900 hover:text-primary-600 transition-colors flex items-center justify-between group"
            @click="isMobileMenuOpen = false"
          >
            My Orders
             <span class="w-8 h-8 rounded-full bg-surface-50 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                <svg class="w-4 h-4 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </span>
          </router-link>
        </div>
      </nav>
    </transition>
  </header>
  
  <!-- Spacer -->
  <div class="h-20 sm:h-24" />
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* User dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
