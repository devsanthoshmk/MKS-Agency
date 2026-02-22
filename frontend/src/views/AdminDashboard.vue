<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api.js'

// Admin child components
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard.vue'
import OrdersManager from '@/components/admin/OrdersManager.vue'
import OrderEditModal from '@/components/admin/OrderEditModal.vue'
import ProductsManager from '@/components/admin/ProductsManager.vue'
import ContentManager from '@/components/admin/ContentManager.vue'

// API URL for production/development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const router = useRouter()
const route = useRoute()

// Auth state
const isAuthenticated = ref(false)
const isLoading = ref(false)
const passcode = ref('')
const authError = ref('')
const adminToken = ref(null)
const showPasscode = ref(false)

// Tab state — derived from route path
const activeTab = computed(() => {
  const path = route.path.replace('/admin/', '').replace('/admin', '')
  const validTabs = ['analytics', 'orders', 'products', 'content', 'settings']
  return validTabs.includes(path) ? path : 'analytics'
})

function setActiveTab(tabId) {
  router.push(`/admin/${tabId}`)
}

const isSidebarExpanded = ref(true)

const tabs = [
  { id: 'analytics', label: 'Overview', icon: 'M18 20V10M12 20V4M6 20v-6' },
  { id: 'orders', label: 'Orders', icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0' },
  { id: 'products', label: 'Products', icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12' },
  { id: 'content', label: 'Content', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8' },
  { id: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' },
]

const activeTabLabel = computed(() => {
  return tabs.find(t => t.id === activeTab.value)?.label || 'Dashboard'
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const orders = ref([])
const selectedOrder = ref(null)
const isLoadingOrders = ref(false)
const products = ref([])
const analytics = ref({
  totalOrders: 0,
  pendingVerification: 0,
  verifiedRevenue: 0,
  ordersToday: 0,
  paymentVerified: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
  failed: 0,
  completedRevenue: 0,
  ordersWeek: 0,
  ordersMonth: 0
})

async function handleLogin() {
  if (!passcode.value) {
    authError.value = 'Please enter the admin passcode'
    return
  }

  isLoading.value = true
  authError.value = ''

  try {
    const response = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: passcode.value })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      adminToken.value = data.token
      isAuthenticated.value = true
      localStorage.setItem('mks_admin_token', data.token)
      loadData()
    } else {
      authError.value = data.error || 'Invalid passcode'
    }
  } catch (e) {
    authError.value = 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

function handleLogout() {
  adminToken.value = null
  isAuthenticated.value = false
  localStorage.removeItem('mks_admin_token')
  router.push('/')
}

onMounted(() => {
  const storedToken = localStorage.getItem('mks_admin_token')
  if (storedToken) {
    adminToken.value = storedToken
    isAuthenticated.value = true
    loadData()
  }
})

async function loadData() {
  await Promise.all([
    loadOrders(),
    loadProducts(),
    loadAnalytics()
  ])
}

async function loadOrders() {
  isLoadingOrders.value = true
  try {
    const response = await fetch(`${API_URL}/api/admin/orders`, {
      headers: { 'Authorization': `Bearer ${adminToken.value}` }
    })
    
    if (response.status === 401) {
      handleLogout()
      return
    }
    
    const data = await response.json()
    orders.value = data.orders || []
  } catch (e) {
    console.error('Failed to load orders:', e)
  } finally {
    isLoadingOrders.value = false
  }
}

async function loadProducts() {
  try {
    const CONVEX_URL = import.meta.env.VITE_CONVEX_URL
    if (!CONVEX_URL) {
      console.error('VITE_CONVEX_URL not configured')
      return
    }
    const client = new ConvexHttpClient(CONVEX_URL)
    const fetchedProducts = await client.query(api.queries.getAllProductsAdmin, {})
    products.value = fetchedProducts || []
  } catch (e) {
    console.error('Failed to load products:', e)
  }
}

async function loadAnalytics() {
  try {
    const response = await fetch(`${API_URL}/api/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${adminToken.value}` }
    })
    
    if (response.status === 401) {
      handleLogout()
      return
    }

    const data = await response.json()
    analytics.value = data
  } catch (e) {
    console.error('Failed to load analytics:', e)
  }
}

function handleOrderSelect(order) {
  selectedOrder.value = order
}

function closeOrderModal() {
  selectedOrder.value = null
}

async function handleOrderSave(updatedOrder) {
  try {
    const response = await fetch(`${API_URL}/api/admin/orders/${updatedOrder._id || updatedOrder.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken.value}`
      },
      body: JSON.stringify(updatedOrder)
    })

    if (response.status === 401) {
      handleLogout()
      return
    }

    if (response.ok) {
      loadOrders()
      loadAnalytics()
      closeOrderModal()
    } else {
      console.error('Failed to update order')
    }
  } catch (e) {
    console.error('Error updating order:', e)
  }
}

async function handleOrderStatusUpdate({ orderId, status }) {
  try {
    const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken.value}`
      },
      body: JSON.stringify({ status })
    })

    if (response.status === 401) {
      handleLogout()
      return
    }

    if (response.ok) {
      loadOrders()
      loadAnalytics()
    } else {
      console.error('Failed to update status')
    }
  } catch (e) {
    console.error('Error updating status:', e)
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 font-inter selection:bg-emerald-500/20 selection:text-emerald-900 overflow-hidden relative">
    
    <!-- Background Effects -->
    <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      <!-- Ambient Lights for Light Theme -->
      <div class="absolute -top-[10%] -right-[5%] w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px] mix-blend-multiply animate-pulse-slow"></div>
      <div class="absolute bottom-[10%] -left-[10%] w-[600px] h-[600px] bg-emerald-700/5 rounded-full blur-[100px] mix-blend-multiply animate-float"></div>
      <div class="absolute top-[40%] left-[20%] w-[400px] h-[400px] bg-[#d4af37]/5 rounded-full blur-[80px] mix-blend-multiply animate-float" style="animation-delay: -5s"></div>
    </div>

    <!-- Login Screen -->
    <Transition name="fade-slide" mode="out-in">
      <div v-if="!isAuthenticated" class="relative z-10 min-h-screen flex items-center justify-center p-6 bg-transparent">
        <div class="w-full max-w-md">
          
          <div class="text-center mb-10 slide-up" style="animation-delay: 0.1s;">
            <!-- Premium Logo Reveal -->
            <div class="relative w-24 h-24 mx-auto mb-6 transform hover:scale-105 transition-transform duration-500">
              <div class="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-2xl animate-pulse-slow"></div>
              <img src="/logo.png" alt="Logo" class="relative w-full h-full object-cover rounded-3xl border border-slate-200/50 shadow-xl bg-white" />
            </div>
            <h1 class="text-4xl font-outfit font-extrabold text-slate-800 tracking-tight">Admin Gateway</h1>
            <p class="text-emerald-600 text-sm font-medium mt-3 uppercase tracking-widest font-inter">Secure Operations Center</p>
          </div>

          <div class="bg-white/80 rounded-[2rem] p-8 relative overflow-hidden backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white slide-up" style="animation-delay: 0.2s;">
            <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
            
            <form @submit.prevent="handleLogin" class="space-y-6">
              <div class="space-y-2 relative">
                <label class="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Authentication Key</label>
                <div class="relative group">
                  <input
                    v-model="passcode"
                    :type="showPasscode ? 'text' : 'password'"
                    class="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 text-base outline-none transition-all duration-300 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 hover:border-slate-300"
                    placeholder="Enter operations passcode"
                    autofocus
                  />
                  <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 p-2 rounded-xl hover:bg-slate-100 transition-all" @click="showPasscode = !showPasscode">
                    <svg v-if="!showPasscode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  </button>
                </div>
                
                <Transition name="fade">
                  <div v-if="authError" class="absolute -bottom-6 left-1 text-rose-500 text-xs font-medium flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    {{ authError }}
                  </div>
                </Transition>
              </div>

              <button type="submit" class="w-full relative group overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 text-white font-semibold py-4 mt-6 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5" :disabled="isLoading">
                <div class="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <div class="relative flex items-center justify-center gap-3">
                  <span v-if="isLoading" class="flex items-center gap-2">
                    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Authenticating Handshake...</span>
                  </span>
                  <template v-else>
                    <span class="tracking-wide">Initialize Session</span>
                    <svg class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </template>
                </div>
              </button>
            </form>

            <button @click="router.push('/')" class="mt-8 w-full flex justify-center items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-semibold tracking-wide uppercase">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Return to storefront
            </button>
          </div>
        </div>
      </div>

      <!-- Dashboard Layout -->
      <div v-else class="relative z-10 flex h-screen overflow-hidden text-sm">
        
        <!-- Sidebar (Desktop) -->
        <aside 
          class="hidden md:flex flex-col border-r border-slate-200 bg-white shadow-[10px_0_30px_rgb(0,0,0,0.02)] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] relative z-50 group"
          :class="isSidebarExpanded ? 'w-[260px]' : 'w-[80px]'"
          @mouseenter="isSidebarExpanded = true"
          @mouseleave="isSidebarExpanded = false"
        >
          <!-- Logo Area -->
          <div class="h-24 flex items-center px-6 border-b border-slate-100">
            <div class="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm flex items-center justify-center bg-white">
              <img src="/logo.png" alt="Logo" class="w-full h-full object-cover" />
            </div>
            <div class="ml-4 overflow-hidden transition-all duration-300 whitespace-nowrap" :class="isSidebarExpanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'">
              <span class="block font-outfit font-bold tracking-wide text-slate-900 text-base">MKS Agency</span>
              <span class="block text-[0.65rem] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Admin Ops</span>
            </div>
          </div>

          <!-- Navigation -->
          <div class="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="setActiveTab(tab.id)"
              class="w-full flex items-center px-3 py-3.5 rounded-xl transition-all duration-300 relative group/nav"
              :class="activeTab === tab.id ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'"
            >
              <!-- Active Glow Line -->
              <div v-if="activeTab === tab.id" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
              
              <div class="w-6 h-6 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path :d="tab.icon"/>
                </svg>
              </div>
              <span class="ml-4 tracking-wide whitespace-nowrap transition-all duration-300" :class="[isSidebarExpanded ? 'opacity-100' : 'opacity-0', activeTab === tab.id ? 'font-bold' : 'font-medium']">{{ tab.label }}</span>
            </button>
          </div>

          <!-- Bottom Actions -->
          <div class="p-4 border-t border-slate-100">
             <button @click="handleLogout" class="w-full flex items-center px-3 py-3 rounded-xl transition-all duration-300 text-rose-500 hover:bg-rose-50 hover:text-rose-600 group/logout">
               <div class="w-6 h-6 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
               </div>
               <span class="ml-4 font-bold tracking-wide whitespace-nowrap transition-all duration-300" :class="isSidebarExpanded ? 'opacity-100' : 'opacity-0'">Terminate Session</span>
             </button>
          </div>
        </aside>

        <!-- Main Workspace -->
        <main class="flex-1 flex flex-col relative min-w-0 bg-transparent">
          
          <!-- Top Navigation Header -->
          <header class="h-24 sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between border-b border-slate-200 bg-white/70 backdrop-blur-2xl transition-all shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
            <div class="flex items-center gap-4">
              <div class="md:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                <img src="/logo.png" alt="Logo" class="w-8 h-8 object-cover rounded-lg" />
              </div>
              <div class="animate-fade-in-up">
                <h1 class="font-outfit text-2xl md:text-[1.75rem] font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                  {{ activeTabLabel }}
                  <span v-if="isLoadingOrders" class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  </span>
                </h1>
                <p class="text-[0.8rem] text-emerald-600 font-semibold tracking-wide mt-1">{{ greeting }} <span class="text-slate-300 mx-2 inline-block">|</span> <span class="text-slate-500">{{ currentDate }}</span></p>
              </div>
            </div>
            
            <div class="flex items-center gap-3 animate-fade-in-left">
              <button @click="loadData" class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-slate-50 hover:border-emerald-200 shadow-sm flex items-center justify-center transition-all group" title="Sync Data">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover:rotate-180 transition-transform duration-700 ease-out"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/></svg>
              </button>
              <button @click="handleLogout" class="md:hidden w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-all shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              </button>
            </div>
          </header>

          <!-- Render active component view -->
          <div class="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar relative p-6 md:p-10 pb-28 md:pb-10 z-10">
            <Transition name="view-transition" mode="out-in">
              <div :key="activeTab" class="h-full w-full max-w-[1600px] mx-auto">
                <AnalyticsDashboard v-if="activeTab === 'analytics'" :analytics="analytics" />
                
                <OrdersManager
                  v-else-if="activeTab === 'orders'"
                  :orders="orders"
                  :is-loading="isLoadingOrders"
                  @refresh="loadOrders"
                  @select-order="handleOrderSelect"
                />

                <ProductsManager
                  v-else-if="activeTab === 'products'"
                  :products="products"
                  :admin-token="adminToken"
                  @refresh="loadProducts"
                />

                <ContentManager v-else-if="activeTab === 'content'" :admin-token="adminToken" />

                <!-- Settings Stub -->
                <div v-else-if="activeTab === 'settings'" class="flex flex-col items-center justify-center min-h-[65vh] text-center max-w-lg mx-auto">
                  <div class="relative mb-8 group">
                    <div class="absolute inset-0 bg-emerald-100 blur-[60px] rounded-full group-hover:bg-emerald-200/50 transition-all duration-700"></div>
                    <div class="w-28 h-28 rounded-[2.5rem] bg-white border border-slate-200 shadow-xl flex items-center justify-center relative transform group-hover:scale-105 transition-all duration-500">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500">
                        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                      </svg>
                    </div>
                  </div>
                  <h2 class="text-4xl font-outfit font-extrabold text-slate-800 mb-4 tracking-tight">Platform Configuration</h2>
                  <p class="text-slate-500 mb-10 text-base leading-relaxed">Advanced controls for SEO, localization, tax setups, global shipping zones, and integration management are being forged.</p>
                  <div class="px-6 py-2.5 rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold tracking-widest uppercase shadow-sm">Deployment Pending</div>
                </div>
              </div>
            </Transition>
          </div>
        </main>

        <!-- Mobile Bottom Nav -->
        <nav class="md:hidden fixed bottom-6 left-4 right-4 z-50 rounded-[1.5rem] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl flex justify-between p-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="setActiveTab(tab.id)"
            class="flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 relative flex-1"
            :class="activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'"
          >
            <div class="relative z-10 transition-transform duration-300" :class="activeTab === tab.id ? '-translate-y-1' : ''">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="tab.icon"/>
              </svg>
            </div>
            <span class="text-[0.65rem] font-bold tracking-wide transition-all duration-300 uppercase absolute bottom-2" :class="activeTab === tab.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'">{{ tab.label }}</span>
            <div v-if="activeTab === tab.id" class="absolute inset-0 bg-emerald-50 rounded-2xl pointer-events-none"></div>
          </button>
        </nav>

      </div>
    </Transition>

    <OrderEditModal
      :order="selectedOrder"
      :show="!!selectedOrder"
      @close="closeOrderModal"
      @save="handleOrderSave"
      @update-status="handleOrderStatusUpdate"
    />
  </div>
</template>

<style scoped>
@keyframes pulse-slow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}
@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.02); }
}

.animate-pulse-slow {
  animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.animate-float {
  animation: float 12s ease-in-out infinite;
}

.slide-up {
  opacity: 0;
  animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-left {
  animation: fadeInLeft 0.5s ease-out forwards;
}
@keyframes fadeInLeft {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Transitions */
.view-transition-enter-active,
.view-transition-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.view-transition-enter-from { opacity: 0; transform: translateY(15px) scale(0.99); }
.view-transition-leave-to { opacity: 0; transform: translateY(-15px) scale(0.99); }

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}
.fade-slide-enter-from { opacity: 0; transform: scale(0.97); }
.fade-slide-leave-to { opacity: 0; transform: scale(1.03); }

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* Custom Scrollbar for sidebar and main content */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.3);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(148, 163, 184, 0.5);
}
</style>
