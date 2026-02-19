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
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section 
      v-if="showHero"
      ref="heroRef"
      class="relative min-h-[85vh] flex items-center overflow-hidden bg-surface-50"
    >
      <!-- Background Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-primary-200/20 blur-3xl animate-float"></div>
        <div class="absolute top-[20%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-secondary-200/20 blur-3xl animate-float" style="animation-delay: -2s"></div>
        <div class="absolute bottom-0 right-[20%] w-[30vw] h-[30vw] rounded-full bg-primary-100/30 blur-3xl animate-float" style="animation-delay: -4s"></div>
        
        <!-- Grid Pattern Overlay -->
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wMykiLz48L3N2Zz4=')] opacity-50"></div>
      </div>
      
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-20">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <!-- Text Content -->
          <div class="text-center lg:text-left space-y-8">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-surface-200 backdrop-blur-sm shadow-sm animate-fade-in-up">
              <span class="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
              <span class="text-xs font-bold tracking-widest text-surface-600 uppercase">Premium Ayurveda</span>
            </div>
            
            <h1 class="text-5xl sm:text-6xl lg:text-7xl font-display font-medium text-surface-900 leading-[1.1] tracking-tight animate-fade-in-up" style="animation-delay: 0.1s">
              Welcome to <br/>
              <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary-800 via-primary-600 to-secondary-600 italic pr-2">MKS Agencies.</span>
            </h1>
            
            <p class="text-lg sm:text-xl text-surface-700/80 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light animate-fade-in-up" style="animation-delay: 0.2s">
              Experience the ancient wisdom of Siddha and Ayurveda, distilled into pure, potent formulas for your modern lifestyle.
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4 animate-fade-in-up" style="animation-delay: 0.3s">
              <button 
                class="btn btn-primary btn-lg group"
                @click="scrollToProducts"
              >
                Shop Collection
                <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
              <button class="btn btn-secondary btn-lg group">
                Our Story
                <svg class="w-5 h-5 text-surface-400 group-hover:text-surface-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            
            <!-- Trust Indicators -->
            <div class="pt-8 flex items-center justify-center lg:justify-start gap-8 border-t border-surface-200/60 animate-fade-in-up" style="animation-delay: 0.4s">
              <div class="flex -space-x-3">
                 <div class="w-10 h-10 rounded-full border-2 border-white bg-surface-200 flex items-center justify-center text-xs font-bold text-surface-600">A</div>
                 <div class="w-10 h-10 rounded-full border-2 border-white bg-surface-300 flex items-center justify-center text-xs font-bold text-surface-600">M</div>
                 <div class="w-10 h-10 rounded-full border-2 border-white bg-surface-400 flex items-center justify-center text-xs font-bold text-white">+2k</div>
              </div>
              <div class="text-sm">
                <p class="font-bold text-surface-900">Trusted by 2,000+</p>
                <p class="text-surface-500">Customers Worldwide</p>
              </div>
            </div>
          </div>
          
          <!-- Visual Content -->
          <div class="hidden lg:block relative perspective">
             <!-- Abstract Composition -->
             <div class="relative w-full aspect-square transform hover:rotate-y-12 transition-transform duration-700 ease-out preserve-3d">
                <div class="absolute inset-10 bg-gradient-to-br from-primary-100 to-secondary-50 rounded-[2rem] shadow-2xl rotate-3"></div>
                <div class="absolute inset-10 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl -rotate-3 border border-white/50 flex items-center justify-center overflow-hidden">
                    <img src="/logo.jpeg" alt="Siddha Medicine" class="w-48 h-48 object-cover rounded-full shadow-lg opacity-80 mix-blend-multiply" />
                </div>
                
                <!-- Floating Cards -->
                <div class="absolute top-20 -right-4 glass-card p-4 rounded-2xl animate-float" style="animation-delay: -1s">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-primary-100 rounded-lg text-primary-600">
                             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p class="text-xs font-bold text-surface-900">100% Organic</p>
                            <p class="text-[10px] text-surface-500">Certified Ingredients</p>
                        </div>
                    </div>
                </div>
                
                <div class="absolute bottom-20 -left-4 glass-card p-4 rounded-2xl animate-float" style="animation-delay: -2.5s">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-secondary-100 rounded-lg text-secondary-600">
                             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <p class="text-xs font-bold text-surface-900">Fast Action</p>
                            <p class="text-[10px] text-surface-500">Proven Results</p>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      <!-- Scroll Hint -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" @click="scrollToProducts">
        <span class="text-[10px] uppercase tracking-widest text-surface-900">Scroll</span>
        <div class="w-0.5 h-12 bg-gradient-to-b from-surface-900 to-transparent"></div>
      </div>
    </section>
    
    <!-- Products Section -->
    <section 
      ref="productSectionRef"
      class="py-16 md:py-24 bg-white relative z-20"
      :class="{ 'pt-24': !showHero }"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header & Controls -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
                 <h2 class="text-3xl md:text-4xl font-display font-medium text-surface-900 mb-2">Curated Collection</h2>
                 <p class="text-surface-500">Explore our range of {{ filteredProducts.length }} premium remedies.</p>
            </div>
            
            <div class="flex items-center gap-4">
                 <!-- Search -->
                <div class="relative group">
                    <input 
                      v-model="searchQuery"
                      type="text"
                      placeholder="Search..."
                      class="pl-10 pr-4 py-2 bg-surface-50 border-none rounded-full w-40 focus:w-64 transition-all duration-300 focus:ring-2 focus:ring-primary-100"
                      @input="handleSearch"
                    />
                    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                
                <!-- Sort -->
                <div class="relative">
                    <select 
                      :value="filters.sort"
                      class="pl-4 pr-10 py-2 bg-white border border-surface-200 rounded-full text-sm font-medium text-surface-700 focus:outline-none focus:border-primary-500 cursor-pointer hover:bg-surface-50 transition-colors appearance-none"
                      @change="handleSortChange($event.target.value)"
                    >
                      <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </option>
                    </select>
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                         <svg class="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Sticky Category Filters -->
        <div class="sticky top-20 z-30 mb-8 py-2 bg-white/90 backdrop-blur-md border-b border-surface-100 -mx-4 px-4 sm:mx-0 sm:px-0 sm:border-none sm:bg-transparent">
            <div class="flex overflow-x-auto gap-2 pb-2 sm:pb-0 scrollbar-hide snap-x">
               <button 
                class="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-300 snap-start"
                :class="filters.category === '' 
                  ? 'bg-surface-900 text-white shadow-lg shadow-surface-900/20' 
                  : 'bg-white text-surface-600 border border-surface-200 hover:border-surface-300 hover:bg-surface-50'"
                @click="handleCategoryFilter('')"
              >
                All Products
              </button>
              <button 
                v-for="cat in categories"
                :key="cat"
                class="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-300 snap-start"
                 :class="filters.category === cat 
                  ? 'bg-surface-900 text-white shadow-lg shadow-surface-900/20' 
                  : 'bg-white text-surface-600 border border-surface-200 hover:border-surface-300 hover:bg-surface-50'"
                @click="handleCategoryFilter(cat)"
              >
                {{ cat.replace('-', ' ') }}
              </button>
            </div>
        </div>
        
        <!-- Loading Grid -->
        <div v-if="isLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
           <div v-for="i in 8" :key="i" class="space-y-4">
              <div class="aspect-[4/5] rounded-2xl bg-surface-100 animate-pulse"></div>
              <div class="h-4 bg-surface-100 rounded w-3/4 animate-pulse"></div>
              <div class="h-4 bg-surface-100 rounded w-1/2 animate-pulse"></div>
           </div>
        </div>
        
        <!-- Product Grid -->
        <div 
          v-else-if="filteredProducts.length > 0"
          class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 md:gap-x-8 md:gap-y-12"
        >
          <ProductCard 
            v-for="product in filteredProducts" 
            :key="product.id"
            :product="product"
          />
        </div>
        
        <!-- Empty State -->
        <div v-else class="text-center py-32">
            <div class="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 class="text-lg font-display font-medium text-surface-900">No products found</h3>
            <p class="text-surface-500 mb-6">Try adjusting your filters.</p>
            <button 
                class="btn btn-secondary btn-sm"
                @click="clearFilters(); searchQuery = ''"
            >
                Clear Filters
            </button>
        </div>

      </div>
    </section>
    
    <!-- Footer -->
    <footer class="bg-surface-900 text-white py-16 lg:py-24 relative overflow-hidden">
        <!-- Decor -->
        <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div class="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] bg-primary-900/20 rounded-full blur-3xl"></div>
        
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="grid md:grid-cols-12 gap-12 lg:gap-8">
                <div class="md:col-span-5 space-y-6">
                    <div class="flex items-center gap-3">
                         <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10">
                             <img src="/logo.jpeg" alt="MKS AGENCY" class="w-full h-full object-cover" />
                         </div>
                         <h2 class="text-2xl font-display font-bold">MKS AGENCY</h2>
                    </div>
                    <p class="text-surface-400 text-lg leading-relaxed max-w-sm">
                        Authentic Siddha & Ayurveda solutions for the modern world. We bridge ancient wisdom with contemporary wellness needs.
                    </p>
                    <div class="flex gap-4">
                        <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <!-- Facebook/Social Icon -->
                            <svg class="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg>
                        </a>
                        <a href="#" class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <!-- Instagram Icon -->
                            <svg class="w-5 h-5 text-white/70" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                    </div>
                </div>
                
                <div class="md:col-span-2">
                    <h4 class="font-bold text-lg mb-6 text-white">Shop</h4>
                    <ul class="space-y-4 text-surface-400">
                        <li><a href="#" class="hover:text-primary-400 transition-colors">All Products</a></li>
                        <li><a href="#" class="hover:text-primary-400 transition-colors">New Arrivals</a></li>
                        <li><a href="#" class="hover:text-primary-400 transition-colors">Bestsellers</a></li>
                    </ul>
                </div>
                
                <div class="md:col-span-2">
                     <h4 class="font-bold text-lg mb-6 text-white">Support</h4>
                    <ul class="space-y-4 text-surface-400">
                        <li><a href="#" class="hover:text-primary-400 transition-colors">Contact Us</a></li>
                        <li><a href="#" class="hover:text-primary-400 transition-colors">Shipping Policy</a></li>
                        <li><a href="#" class="hover:text-primary-400 transition-colors">Returns</a></li>
                         <li><a href="#" class="hover:text-primary-400 transition-colors">FAQ</a></li>
                    </ul>
                </div>
                
                 <div class="md:col-span-3">
                     <h4 class="font-bold text-lg mb-6 text-white">Contact</h4>
                      <ul class="space-y-4 text-surface-400">
                        <li class="flex items-start gap-3">
                             <svg class="w-6 h-6 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                             <span>mks.agencies.official@gmail.com</span>
                        </li>
                         <li class="flex items-start gap-3">
                             <svg class="w-6 h-6 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                             <span>+91 8610885886</span>
                        </li>
                         <li class="flex items-start gap-3">
                             <svg class="w-6 h-6 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             <span>Chennai, Tamil Nadu, India</span>
                        </li>
                    </ul>
                 </div>
            </div>
            
            <div class="border-t border-white/10 mt-16 pt-8 text-center text-surface-500 text-sm">
                 <p>&copy; 2026 MKS AGENCY. All rights reserved.</p>
            </div>
        </div>
    </footer>
  </div>
</template>
