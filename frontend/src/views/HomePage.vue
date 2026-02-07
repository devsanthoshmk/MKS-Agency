<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import { useProducts } from '../composables/useProducts'

const route = useRoute()
const router = useRouter()
const {
  filteredProducts,
  categories,
  filters,
  priceRange,
  isLoading,
  loadProducts,
  syncFiltersFromUrl,
  setFilter,
  setSearch,
  clearFilters
} = useProducts()

const heroRef = ref(null)
const productSectionRef = ref(null)
const showHero = ref(true)
const searchQuery = ref('')
const isFiltersOpen = ref(false)

// Initialize
onMounted(async () => {
  await loadProducts()
  syncFiltersFromUrl()
  searchQuery.value = filters.value.search
  
  // Check if should show hero
  if (route.name === 'products') {
    showHero.value = false
    scrollToProducts()
  }
})

// Watch route for hero visibility
watch(() => route.name, (name) => {
  if (name === 'products') {
    showHero.value = false
    scrollToProducts()
  } else if (name === 'home') {
    showHero.value = true
  }
})

onUnmounted(() => {
  if (scrollObserver) {
    scrollObserver.disconnect()
  }
})

function scrollToProducts() {
  setTimeout(() => {
    productSectionRef.value?.scrollIntoView({ behavior: 'smooth' })
  }, 100)
}

function handleSearch(e) {
  setSearch(e.target.value)
}

function handleCategoryFilter(category) {
  setFilter('category', category === filters.value.category ? '' : category)
  isFiltersOpen.value = false
}

function handleSortChange(sort) {
  setFilter('sort', sort)
}

// Sort options
const sortOptions = [
  { value: 'default', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' }
]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section 
      v-if="showHero"
      ref="heroRef"
      class="relative min-h-[90vh] flex items-center gradient-hero overflow-hidden"
    >
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23059669%22 fill-opacity=%221%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');" />
      </div>
      
      <!-- Floating Elements -->
      <div class="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary-200/30 blur-2xl" />
      <div class="absolute bottom-40 right-20 w-32 h-32 rounded-full bg-accent-200/40 blur-3xl" />
      <div class="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-secondary-200/30 blur-2xl" />
      
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Text Content -->
          <div class="text-center lg:text-left">
            <span class="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6 animate-fade-in">
              🌿 Siddha & Ayurveda Medicines
            </span>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-surface-900 mb-6 animate-slide-up">
              Discover the Power of
              <span class="text-gradient"> Siddha & Ayurveda</span>
            </h1>
            <p class="text-lg sm:text-xl text-surface-600 mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up" style="animation-delay: 0.1s">
              Premium quality herbal supplements, oils, and remedies crafted from authentic Siddha and Ayurveda traditions for your holistic wellness journey.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style="animation-delay: 0.2s">
              <button 
                class="btn btn-primary btn-lg"
                @click="scrollToProducts"
              >
                Explore Products
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button class="btn btn-secondary btn-lg">
                Our Traditions
              </button>
            </div>
            
            <!-- Trust Badges -->
            <div class="mt-12 flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-surface-500">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Lab Tested
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
                100% Natural
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Free Shipping 500+
              </div>
            </div>
          </div>
          
          <!-- Hero Image/Visual -->
          <div class="hidden lg:block relative">
            <div class="relative w-full aspect-square">
              <!-- Decorative circles -->
              <div class="absolute inset-0 rounded-full border-2 border-primary-200/50 animate-pulse" />
              <div class="absolute inset-8 rounded-full border-2 border-accent-200/50" style="animation: pulse 3s infinite 0.5s" />
              <div class="absolute inset-16 rounded-full bg-linear-to-br from-primary-100 to-accent-100" />
              
              <!-- Center content -->
              <div class="absolute inset-24 rounded-full bg-white shadow-2xl flex items-center justify-center">
                <div class="text-center">
                  <span class="text-6xl">🌿</span>
                  <p class="mt-2 text-sm font-medium text-primary-700">Natural Wellness</p>
                </div>
              </div>
              
              <!-- Floating product badges -->
              <div class="absolute top-10 right-0 bg-white rounded-xl shadow-lg p-3 animate-bounce" style="animation-duration: 3s">
                <span class="text-2xl">💊</span>
                <p class="text-xs font-medium text-surface-600 mt-1">Supplements</p>
              </div>
              <div class="absolute bottom-20 left-0 bg-white rounded-xl shadow-lg p-3 animate-bounce" style="animation-duration: 3.5s; animation-delay: 0.5s">
                <span class="text-2xl">🧴</span>
                <p class="text-xs font-medium text-surface-600 mt-1">Oils</p>
              </div>
              <div class="absolute bottom-0 right-20 bg-white rounded-xl shadow-lg p-3 animate-bounce" style="animation-duration: 4s; animation-delay: 1s">
                <span class="text-2xl">🍃</span>
                <p class="text-xs font-medium text-surface-600 mt-1">Powders</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-surface-400 animate-bounce">
        <span class="text-sm">Scroll to explore</span>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
    
    <!-- Products Section -->
    <section 
      ref="productSectionRef"
      class="py-12 sm:py-16 min-h-screen"
      :class="{ 'pt-8': !showHero }"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Section Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 class="text-2xl sm:text-3xl font-display font-bold text-surface-900">
              Our Products
            </h2>
            <p class="text-surface-500 mt-1">
              {{ filteredProducts.length }} products available
            </p>
          </div>
          
          <!-- Search (Desktop) -->
          <div class="hidden sm:block relative w-80">
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Search products..."
              class="input pl-10"
              @input="handleSearch"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <!-- Mobile Search -->
        <div class="sm:hidden relative mb-4">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Search products..."
            class="input pl-10"
            @input="handleSearch"
          />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <!-- Filters & Sort Bar -->
        <div class="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-surface-200">
          <!-- Category Filters -->
          <div class="flex-1 overflow-x-auto scrollbar-hide">
            <div class="flex gap-2">
              <button 
                class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                :class="filters.category === '' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'"
                @click="handleCategoryFilter('')"
              >
                All
              </button>
              <button 
                v-for="cat in categories"
                :key="cat"
                class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-colors"
                :class="filters.category === cat 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'"
                @click="handleCategoryFilter(cat)"
              >
                {{ cat.replace('-', ' ') }}
              </button>
            </div>
          </div>
          
          <!-- Sort Dropdown -->
          <div class="shrink-0">
            <select 
              :value="filters.sort"
              class="input py-2 px-3 text-sm min-w-35"
              @change="handleSortChange($event.target.value)"
            >
              <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- Active Filters -->
        <div v-if="filters.category || filters.search" class="flex flex-wrap gap-2 mb-6">
          <span class="text-sm text-surface-500">Active filters:</span>
          <button 
            v-if="filters.category"
            class="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
            @click="setFilter('category', '')"
          >
            {{ filters.category }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button 
            v-if="filters.search"
            class="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
            @click="setFilter('search', ''); searchQuery = ''"
          >
            "{{ filters.search }}"
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button 
            class="text-sm text-primary-600 hover:underline"
            @click="clearFilters(); searchQuery = ''"
          >
            Clear all
          </button>
        </div>
        
        <!-- Loading State -->
        <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          <div v-for="i in 8" :key="i" class="card">
            <div class="aspect-square skeleton" />
            <div class="p-4 space-y-3">
              <div class="skeleton h-4 w-20" />
              <div class="skeleton h-6 w-full" />
              <div class="skeleton h-4 w-full" />
              <div class="skeleton h-6 w-24" />
            </div>
          </div>
        </div>
        
        <!-- Products Grid -->
        <div 
          v-else-if="filteredProducts.length > 0"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <ProductCard 
            v-for="product in filteredProducts" 
            :key="product.id"
            :product="product"
          />
        </div>
        
        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <div class="w-24 h-24 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-6">
            <svg class="w-12 h-12 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-surface-900 mb-2">No products found</h3>
          <p class="text-surface-500 mb-6">Try adjusting your search or filter criteria</p>
          <button 
            class="btn btn-primary"
            @click="clearFilters(); searchQuery = ''"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </section>
    
    <!-- Footer -->
    <footer class="bg-surface-900 text-white py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-4 gap-8">
          <!-- Brand -->
          <div class="md:col-span-2">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                <span class="text-white text-xl font-bold">M</span>
              </div>
              <span class="text-xl font-display font-bold">MKS Agencies</span>
            </div>
            <p class="text-surface-400 max-w-md">
              Bringing the ancient wisdom of Siddha and Ayurveda to modern wellness. Authentic medicines for your holistic health journey.
            </p>
          </div>
          
          <!-- Quick Links -->
          <div>
            <h4 class="font-semibold mb-4">Quick Links</h4>
            <ul class="space-y-2 text-surface-400">
              <li><a href="/products" class="hover:text-white transition-colors">All Products</a></li>
              <li><a href="#" class="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" class="hover:text-white transition-colors">FAQs</a></li>
            </ul>
          </div>
          
          <!-- Contact -->
          <div>
            <h4 class="font-semibold mb-4">Contact Us</h4>
            <ul class="space-y-2 text-surface-400">
              <li>📧 mks.agencies.official@gmail.com</li>
              <li>📞 +91 8610885886</li>
              <li>📍 Chennai, Tamil Nadu, India</li>
            </ul>
          </div>
        </div>
        
        <div class="border-t border-surface-800 mt-8 pt-8 text-center text-surface-500 text-sm">
          <p>© 2026 MKS Agencies. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>
