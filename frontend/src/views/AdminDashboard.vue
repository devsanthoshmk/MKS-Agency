<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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

// Auth state
const isAuthenticated = ref(false)
const isLoading = ref(false)
const passcode = ref('')
const authError = ref('')
const adminToken = ref(null)

// Tab state
const activeTab = ref('orders')
const tabs = [
  { id: 'orders', label: 'Orders', icon: '📦' },
  { id: 'products', label: 'Products', icon: '🛍️' },
  { id: 'content', label: 'Content', icon: '📝' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

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
</script>

<template>
  <div class="min-h-screen bg-surface-100">
    <!-- Login Screen -->
    <div v-if="!isAuthenticated" class="min-h-screen flex items-center justify-center p-4">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <div class="text-center mb-8">
            <div class="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
              <span class="text-white text-2xl font-bold">M</span>
            </div>
            <h1 class="text-2xl font-display font-bold text-surface-900">Admin Access</h1>
            <p class="text-surface-500 mt-2">Enter passcode to continue</p>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 mb-1">Passcode</label>
              <input
                v-model="passcode"
                type="password"
                class="input"
                placeholder="Enter admin passcode"
                autofocus
              />
              <p v-if="authError" class="text-red-500 text-sm mt-1">{{ authError }}</p>
            </div>

            <button
              type="submit"
              class="w-full btn btn-primary btn-lg"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="spinner mr-2" />
              {{ isLoading ? 'Verifying...' : 'Access Dashboard' }}
            </button>
          </form>

          <button
            class="w-full btn btn-ghost mt-4"
            @click="router.push('/')"
          >
            ← Back to Store
          </button>
        </div>
      </div>
    </div>

    <!-- Dashboard -->
    <div v-else>
      <!-- Header -->
      <header class="bg-white shadow-sm sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <span class="text-white font-bold">M</span>
            </div>
            <div>
              <h1 class="text-lg font-bold text-surface-900">Admin Dashboard</h1>
              <p class="text-sm text-surface-500">MKS Agencies</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button @click="loadData" class="btn btn-ghost" title="Refresh data">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button @click="handleLogout" class="btn btn-secondary">Logout</button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Analytics Dashboard -->
        <AnalyticsDashboard :analytics="analytics" class="mb-6" />

        <!-- Tabs -->
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="flex border-b border-surface-200">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2"
              :class="activeTab === tab.id ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-surface-500 hover:text-surface-900 hover:bg-surface-50'"
              @click="activeTab = tab.id"
            >
              <span>{{ tab.icon }}</span>
              <span class="hidden sm:inline">{{ tab.label }}</span>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="p-4 sm:p-6">
            <!-- Orders Tab -->
            <div v-if="activeTab === 'orders'">
              <OrdersManager
                :orders="orders"
                :is-loading="isLoadingOrders"
                @refresh="loadOrders"
                @select-order="handleOrderSelect"
              />
            </div>

            <!-- Products Tab -->
            <div v-if="activeTab === 'products'">
              <ProductsManager
                :products="products"
                :admin-token="adminToken"
                @refresh="loadProducts"
              />
            </div>

            <!-- Content Tab -->
            <div v-if="activeTab === 'content'">
              <ContentManager :admin-token="adminToken" />
            </div>

            <!-- Settings Tab -->
            <div v-if="activeTab === 'settings'" class="text-center py-12">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
                <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h4 class="text-lg font-semibold text-surface-700 mb-2">Settings</h4>
              <p class="text-surface-500">Admin settings coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Edit Modal -->
    <OrderEditModal
      :order="selectedOrder"
      :admin-token="adminToken"
      @close="closeOrderModal"
      @updated="handleOrderUpdated"
    />
  </div>
</template>
