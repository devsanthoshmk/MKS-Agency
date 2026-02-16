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

// Tab state — derived from route path (industry standard)
const activeTab = computed(() => {
  const path = route.path.replace('/admin/', '').replace('/admin', '')
  const validTabs = ['analytics', 'orders', 'products', 'content', 'settings']
  return validTabs.includes(path) ? path : 'analytics'
})

function setActiveTab(tabId) {
  router.push(`/admin/${tabId}`)
}
const sidebarExpanded = ref(false)
const tabs = [
  { id: 'analytics', label: 'Overview', icon: 'chart-bar' },
  { id: 'orders', label: 'Orders', icon: 'shopping-bag' },
  { id: 'products', label: 'Products', icon: 'cube' },
  { id: 'content', label: 'Content', icon: 'document-text' },
  { id: 'settings', label: 'Settings', icon: 'cog' },
]

// Computed title based on active tab
const activeTabLabel = computed(() => {
  return tabs.find(t => t.id === activeTab.value)?.label || 'Dashboard'
})

// Greeting based on time
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

// Orders state
const orders = ref([])
const selectedOrder = ref(null)
const isLoadingOrders = ref(false)

// Products state
const products = ref([])

// Analytics state
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

// Login
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

// Logout
function handleLogout() {
  adminToken.value = null
  isAuthenticated.value = false
  localStorage.removeItem('mks_admin_token')
  router.push('/')
}


// Check stored token
onMounted(() => {
  const storedToken = localStorage.getItem('mks_admin_token')
  if (storedToken) {
    adminToken.value = storedToken
    isAuthenticated.value = true
    loadData()
  }
})

// Load data
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

function handleOrderUpdated() {
  loadOrders()
  loadAnalytics()
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
  <div class="admin-root">
    <!-- ========== LOGIN SCREEN ========== -->
    <div v-if="!isAuthenticated" class="login-screen">
      <!-- Animated Background -->
      <div class="login-bg">
        <div class="login-orb login-orb--1"></div>
        <div class="login-orb login-orb--2"></div>
        <div class="login-orb login-orb--3"></div>
        <div class="login-noise"></div>
      </div>

      <div class="login-card">
        <!-- Logo area -->
        <div class="login-logo">
          <div class="login-logo__icon overflow-hidden">
            <img src="/logo.jpeg" alt="MKS Admin" class="w-full h-full object-cover" />
          </div>
          <h1 class="login-title">MKS Admin</h1>
          <p class="login-subtitle">Secure dashboard access</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="login-field">
            <label class="login-label">Passcode</label>
            <div class="login-input-wrap">
              <input
                v-model="passcode"
                :type="showPasscode ? 'text' : 'password'"
                class="login-input"
                placeholder="Enter your passcode"
                autofocus
              />
              <button type="button" class="login-eye" @click="showPasscode = !showPasscode" tabindex="-1">
                <svg v-if="!showPasscode" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <p v-if="authError" class="login-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {{ authError }}
            </p>
          </div>

          <button type="submit" class="login-btn" :disabled="isLoading">
            <span v-if="isLoading" class="login-btn__spinner"></span>
            <span>{{ isLoading ? 'Verifying...' : 'Unlock Dashboard' }}</span>
            <svg v-if="!isLoading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </form>

        <button class="login-back" @click="router.push('/')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Store
        </button>
      </div>
    </div>

    <!-- ========== DASHBOARD LAYOUT ========== -->
    <div v-else class="dashboard-layout">
      
      <!-- Desktop Sidebar -->
      <nav
        class="sidebar"
        :class="{ 'sidebar--expanded': sidebarExpanded }"
        @mouseenter="sidebarExpanded = true"
        @mouseleave="sidebarExpanded = false"
      >
        <div class="sidebar__logo">
          <div class="sidebar__logo-icon flex items-center justify-center overflow-hidden rounded-full w-8 h-8">
            <img src="/logo.jpeg" alt="MKS Admin" class="w-full h-full object-cover" />
          </div>
          <span class="sidebar__logo-text" v-show="sidebarExpanded">MKS Admin</span>
        </div>

        <div class="sidebar__nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="setActiveTab(tab.id)"
            class="sidebar__item"
            :class="{ 'sidebar__item--active': activeTab === tab.id }"
            :title="tab.label"
          >
            <div class="sidebar__icon">
              <!-- Chart Bar -->
              <svg v-if="tab.icon === 'chart-bar'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              <!-- Shopping Bag -->
              <svg v-else-if="tab.icon === 'shopping-bag'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <!-- Cube -->
              <svg v-else-if="tab.icon === 'cube'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              <!-- Document Text -->
              <svg v-else-if="tab.icon === 'document-text'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <!-- Cog -->
              <svg v-else-if="tab.icon === 'cog'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <span class="sidebar__label" v-show="sidebarExpanded">{{ tab.label }}</span>
            <div v-if="activeTab === tab.id" class="sidebar__indicator"></div>
          </button>
        </div>

        <!-- Sidebar footer -->
        <div class="sidebar__footer">
          <button class="sidebar__item sidebar__item--logout" @click="handleLogout" title="Logout">
            <div class="sidebar__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <span class="sidebar__label" v-show="sidebarExpanded">Logout</span>
          </button>
        </div>
      </nav>

      <!-- Mobile Bottom Navigation -->
      <nav class="mobile-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="setActiveTab(tab.id)"
          class="mobile-nav__item"
          :class="{ 'mobile-nav__item--active': activeTab === tab.id }"
        >
          <div class="mobile-nav__icon">
            <svg v-if="tab.icon === 'chart-bar'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
            <svg v-else-if="tab.icon === 'shopping-bag'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <svg v-else-if="tab.icon === 'cube'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            <svg v-else-if="tab.icon === 'document-text'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <svg v-else-if="tab.icon === 'cog'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <span class="mobile-nav__label">{{ tab.label }}</span>
        </button>
      </nav>

      <!-- Top Header Bar -->
      <header class="topbar">
        <div class="topbar__left">
          <!-- Mobile logo -->
          <div class="topbar__mobile-logo flex items-center justify-center overflow-hidden rounded-full w-8 h-8">
            <img src="/logo.jpeg" alt="MKS Admin" class="w-full h-full object-cover" />
          </div>
          <div>
            <h1 class="topbar__title">{{ activeTabLabel }}</h1>
            <p class="topbar__subtitle">{{ greeting }} — {{ currentDate }}</p>
          </div>
        </div>
        <div class="topbar__actions">
          <button @click="loadData" class="topbar__btn" title="Refresh data">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button @click="handleLogout" class="topbar__btn topbar__btn--logout md:hidden" title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="main-content">
        <Transition name="page" mode="out-in">
          
          <div v-if="activeTab === 'analytics'" key="analytics">
             <AnalyticsDashboard :analytics="analytics" />
          </div>

          <div v-else-if="activeTab === 'orders'" key="orders">
            <OrdersManager
              :orders="orders"
              :is-loading="isLoadingOrders"
              @refresh="loadOrders"
              @select-order="handleOrderSelect"
            />
          </div>

          <div v-else-if="activeTab === 'products'" key="products">
            <ProductsManager
              :products="products"
              :admin-token="adminToken"
              @refresh="loadProducts"
            />
          </div>

          <div v-else-if="activeTab === 'content'" key="content">
            <ContentManager :admin-token="adminToken" />
          </div>

          <div v-else-if="activeTab === 'settings'" key="settings" class="settings-placeholder">
            <div class="settings-placeholder__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <h2 class="settings-placeholder__title">Settings</h2>
            <p class="settings-placeholder__desc">Configure store settings, payments, and shipping options.</p>
            <span class="settings-placeholder__badge">Coming Soon</span>
          </div>

        </Transition>
        <!-- Hidden router-view for child route matching -->
        <router-view v-show="false" />
      </main>
    </div>

    <!-- Order Edit Modal -->
    <OrderEditModal
      :order="selectedOrder"
      :is-open="!!selectedOrder"
      @close="closeOrderModal"
      @save="handleOrderSave"
      @update-status="handleOrderStatusUpdate"
    />
  </div>
</template>



<style scoped>
/* ============================================================
   ADMIN DASHBOARD — Refined Dark Theme
   ============================================================ */

.admin-root {
  min-height: 100vh;
  background: #0c0d10;
  color: #e4e5e9;
  font-family: 'Inter', 'Outfit', system-ui, -apple-system, sans-serif;
}

/* ----- LOGIN SCREEN ----- */
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.login-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.login-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: orbFloat 12s ease-in-out infinite alternate;
}

.login-orb--1 {
  width: 300px;
  height: 300px;
  background: #10b981;
  top: -60px;
  right: -40px;
  animation-delay: 0s;
}

.login-orb--2 {
  width: 250px;
  height: 250px;
  background: #6366f1;
  bottom: -60px;
  left: -30px;
  animation-delay: -4s;
}

.login-orb--3 {
  width: 180px;
  height: 180px;
  background: #f59e0b;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -8s;
  opacity: 0.15;
}

.login-noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
}

@keyframes orbFloat {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(20px, -20px) scale(1.08); }
}

.login-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 400px;
  background: rgba(18, 19, 24, 0.85);
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.06);
  animation: cardAppear 0.5s ease-out;
}

@keyframes cardAppear {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.login-logo {
  text-align: center;
  margin-bottom: 2rem;
}

.login-logo__icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
}

.login-title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #f0f1f3;
  margin: 0 0 0.25rem;
}

.login-subtitle {
  font-size: 0.85rem;
  color: #787992;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.login-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.login-input-wrap {
  position: relative;
}

.login-input {
  width: 100%;
  padding: 0.875rem 1rem;
  padding-right: 2.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #f0f1f3;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  outline: none;
  box-sizing: border-box;
}

.login-input::placeholder {
  color: #4b5563;
}

.login-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  background: rgba(255, 255, 255, 0.06);
}

.login-eye {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  transition: color 0.2s;
}

.login-eye:hover {
  color: #d1d5db;
}

.login-error {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  color: #f87171;
  margin: 0;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.login-btn:hover:not(:disabled) {
  box-shadow: 0 6px 24px rgba(16, 185, 129, 0.45);
  transform: translateY(-1px);
}

.login-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-back {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  margin-top: 1.5rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.85rem;
  cursor: pointer;
  transition: color 0.2s;
}

.login-back:hover {
  color: #10b981;
}


/* ----- DASHBOARD LAYOUT ----- */
.dashboard-layout {
  min-height: 100vh;
  padding-bottom: 5rem;
  transition: padding-left 0.3s ease;
}

@media (min-width: 768px) {
  .dashboard-layout {
    padding-left: 72px;
    padding-bottom: 0;
  }
}

/* ----- SIDEBAR (Desktop) ----- */
.sidebar {
  display: none;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 72px;
  background: #111218;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 50;
  flex-direction: column;
  padding: 1.25rem 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

@media (min-width: 768px) {
  .sidebar {
    display: flex;
  }
}

.sidebar--expanded {
  width: 200px;
  box-shadow: 8px 0 32px rgba(0, 0, 0, 0.3);
}

.sidebar__logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1.25rem;
  margin-bottom: 1.75rem;
  white-space: nowrap;
}

.sidebar__logo-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.sidebar__logo-text {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: #f0f1f3;
}

.sidebar__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 0.75rem;
}

.sidebar__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.65rem;
  border-radius: 10px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 500;
}

.sidebar__item:hover {
  color: #d1d5db;
  background: rgba(255, 255, 255, 0.04);
}

.sidebar__item--active {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.sidebar__item--active:hover {
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
}

.sidebar__indicator {
  position: absolute;
  left: -0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #10b981;
  border-radius: 0 4px 4px 0;
}

.sidebar__icon {
  width: 22px;
  height: 22px;
  min-width: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__label {
  font-family: 'Inter', sans-serif;
}

.sidebar__footer {
  padding: 0 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0.75rem;
  margin-top: 0.5rem;
}

.sidebar__item--logout:hover {
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
}


/* ----- MOBILE BOTTOM NAV ----- */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  background: rgba(17, 18, 24, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
}

@media (min-width: 768px) {
  .mobile-nav {
    display: none;
  }
}

.mobile-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0.65rem 0;
  background: none;
  border: none;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-nav__item--active {
  color: #10b981;
}

.mobile-nav__icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.mobile-nav__item--active .mobile-nav__icon {
  background: rgba(16, 185, 129, 0.12);
}

.mobile-nav__label {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}


/* ----- TOP BAR ----- */
.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: rgba(12, 13, 16, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

@media (min-width: 768px) {
  .topbar {
    padding: 1.25rem 2rem;
  }
}

.topbar__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.topbar__mobile-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

@media (min-width: 768px) {
  .topbar__mobile-logo {
    display: none;
  }
}

.topbar__title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.15rem;
  color: #f0f1f3;
  margin: 0;
  line-height: 1.2;
}

.topbar__subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.125rem 0 0;
  display: none;
}

@media (min-width: 640px) {
  .topbar__subtitle {
    display: block;
  }
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.topbar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
}

.topbar__btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.topbar__btn--logout:hover {
  color: #f87171;
  background: rgba(248, 113, 113, 0.08);
  border-color: rgba(248, 113, 113, 0.15);
}


/* ----- MAIN CONTENT ----- */
.main-content {
  padding: 1.25rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  .main-content {
    padding: 1.75rem 2rem;
  }
}


/* ----- PAGE TRANSITION ----- */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}


/* ----- SETTINGS PLACEHOLDER ----- */
.settings-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  text-align: center;
  animation: fadeUp 0.5s ease;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.settings-placeholder__icon {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  margin-bottom: 1.5rem;
}

.settings-placeholder__title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.35rem;
  color: #f0f1f3;
  margin: 0 0 0.5rem;
}

.settings-placeholder__desc {
  font-size: 0.9rem;
  color: #6b7280;
  max-width: 320px;
  margin: 0 0 1.25rem;
  line-height: 1.5;
}

.settings-placeholder__badge {
  display: inline-flex;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #9ca3af;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
