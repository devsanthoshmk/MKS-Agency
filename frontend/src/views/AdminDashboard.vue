<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Auth state
const isAuthenticated = ref(false)
const isLoading = ref(false)
const passcode = ref('')
const authError = ref('')
const adminToken = ref(null)

// Tab state
const activeTab = ref('orders')

// Orders state
const orders = ref([])
const selectedOrder = ref(null)
const isUpdatingStatus = ref(false)

// Products state
const products = ref([])
const editingProduct = ref(null)
const isCreatingProduct = ref(false)
const isSavingProducts = ref(false)

// Analytics state
const analytics = ref({
  totalOrders: 0,
  pendingVerification: 0,
  verifiedRevenue: 0,
  ordersToday: 0
})

// Status options
const statusOptions = [
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification', color: 'warning' },
  { value: 'PAYMENT_VERIFIED', label: 'Payment Verified', color: 'success' },
  { value: 'PROCESSING', label: 'Processing', color: 'info' },
  { value: 'SHIPPED', label: 'Shipped', color: 'primary' },
  { value: 'DELIVERED', label: 'Delivered', color: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error' },
  { value: 'FAILED', label: 'Failed', color: 'error' }
]

// Login
async function handleLogin() {
  if (!passcode.value) {
    authError.value = 'Please enter the admin passcode'
    return
  }

  isLoading.value = true
  authError.value = ''

  try {
    const response = await fetch('/api/admin/login', {
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
  try {
    const response = await fetch('/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${adminToken.value}` }
    })
    const data = await response.json()
    orders.value = data.orders || []
  } catch (e) {
    console.error('Failed to load orders:', e)
  }
}

async function loadProducts() {
  try {
    const data = await import('@/assets/products.json')
    products.value = data.products || []
  } catch (e) {
    console.error('Failed to load products:', e)
  }
}

async function loadAnalytics() {
  try {
    const response = await fetch('/api/admin/analytics', {
      headers: { 'Authorization': `Bearer ${adminToken.value}` }
    })
    const data = await response.json()
    analytics.value = data
  } catch (e) {
    console.error('Failed to load analytics:', e)
  }
}

// Update order status
async function updateOrderStatus(orderId, newStatus, trackingData = {}) {
  isUpdatingStatus.value = true
  
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken.value}`
      },
      body: JSON.stringify({
        status: newStatus,
        ...trackingData
      })
    })

    if (response.ok) {
      await loadOrders()
      selectedOrder.value = null
    }
  } catch (e) {
    console.error('Failed to update status:', e)
  } finally {
    isUpdatingStatus.value = false
  }
}

// Product management
function createNewProduct() {
  editingProduct.value = {
    id: 'prod_' + Date.now(),
    slug: '',
    name: '',
    description: '',
    shortDescription: '',
    price: 0,
    comparePrice: null,
    category: '',
    images: [],
    stock: 100,
    isActive: true,
    tags: [],
    benefits: [],
    ingredients: '',
    usage: '',
    weight: ''
  }
  isCreatingProduct.value = true
}

function editProduct(product) {
  editingProduct.value = { ...product }
  isCreatingProduct.value = false
}

function cancelEdit() {
  editingProduct.value = null
  isCreatingProduct.value = false
}

async function saveProduct() {
  if (!editingProduct.value) return

  isSavingProducts.value = true

  try {
    let updatedProducts
    if (isCreatingProduct.value) {
      updatedProducts = [...products.value, editingProduct.value]
    } else {
      updatedProducts = products.value.map(p => 
        p.id === editingProduct.value.id ? editingProduct.value : p
      )
    }

    const response = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken.value}`
      },
      body: JSON.stringify({ products: updatedProducts })
    })

    if (response.ok) {
      products.value = updatedProducts
      editingProduct.value = null
      isCreatingProduct.value = false
    }
  } catch (e) {
    console.error('Failed to save product:', e)
  } finally {
    isSavingProducts.value = false
  }
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return

  isSavingProducts.value = true

  try {
    const updatedProducts = products.value.filter(p => p.id !== productId)

    const response = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken.value}`
      },
      body: JSON.stringify({ products: updatedProducts })
    })

    if (response.ok) {
      products.value = updatedProducts
    }
  } catch (e) {
    console.error('Failed to delete product:', e)
  } finally {
    isSavingProducts.value = false
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price)
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusColor(status) {
  const opt = statusOptions.find(s => s.value === status)
  if (!opt) return 'bg-surface-100 text-surface-700'
  switch (opt.color) {
    case 'success': return 'bg-green-100 text-green-700'
    case 'warning': return 'bg-yellow-100 text-yellow-700'
    case 'error': return 'bg-red-100 text-red-700'
    case 'info': return 'bg-blue-100 text-blue-700'
    case 'primary': return 'bg-primary-100 text-primary-700'
    default: return 'bg-surface-100 text-surface-700'
  }
}

// Generate slug from name
function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <span class="text-white font-bold">M</span>
            </div>
            <div>
              <h1 class="text-lg font-bold text-surface-900">Admin Dashboard</h1>
              <p class="text-sm text-surface-500">MKS Ayurvedic</p>
            </div>
          </div>
          <button @click="handleLogout" class="btn btn-secondary">Logout</button>
        </div>
      </header>

      <!-- Analytics Cards -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <p class="text-surface-500 text-sm">Total Orders</p>
            <p class="text-2xl font-bold text-surface-900">{{ analytics.totalOrders }}</p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <p class="text-surface-500 text-sm">Pending Verification</p>
            <p class="text-2xl font-bold text-yellow-600">{{ analytics.pendingVerification }}</p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <p class="text-surface-500 text-sm">Today's Orders</p>
            <p class="text-2xl font-bold text-primary-600">{{ analytics.ordersToday }}</p>
          </div>
          <div class="bg-white rounded-xl p-4 shadow-sm">
            <p class="text-surface-500 text-sm">Verified Revenue</p>
            <p class="text-2xl font-bold text-green-600">{{ formatPrice(analytics.verifiedRevenue) }}</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div class="flex border-b border-surface-200">
            <button
              v-for="tab in ['orders', 'products', 'settings']"
              :key="tab"
              class="flex-1 py-3 text-center font-medium capitalize transition-colors"
              :class="activeTab === tab ? 'text-primary-600 border-b-2 border-primary-600' : 'text-surface-500 hover:text-surface-900'"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <!-- Orders Tab -->
          <div v-if="activeTab === 'orders'" class="p-4">
            <div v-if="orders.length === 0" class="text-center py-12 text-surface-500">
              No orders yet
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-surface-200">
                    <th class="text-left py-3 px-4 font-medium text-surface-500">Order</th>
                    <th class="text-left py-3 px-4 font-medium text-surface-500">Customer</th>
                    <th class="text-left py-3 px-4 font-medium text-surface-500">Total</th>
                    <th class="text-left py-3 px-4 font-medium text-surface-500">Status</th>
                    <th class="text-left py-3 px-4 font-medium text-surface-500">Date</th>
                    <th class="text-right py-3 px-4 font-medium text-surface-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="order in orders"
                    :key="order.id"
                    class="border-b border-surface-100 hover:bg-surface-50"
                  >
                    <td class="py-3 px-4 font-medium">{{ order.orderNumber }}</td>
                    <td class="py-3 px-4">{{ order.shippingName }}</td>
                    <td class="py-3 px-4 font-medium">{{ formatPrice(order.total) }}</td>
                    <td class="py-3 px-4">
                      <span :class="['text-xs px-2 py-1 rounded-full', getStatusColor(order.status)]">
                        {{ order.status.replace('_', ' ') }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-surface-500">{{ formatDate(order.createdAt) }}</td>
                    <td class="py-3 px-4 text-right">
                      <button
                        class="text-primary-600 hover:underline"
                        @click="selectedOrder = order"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Products Tab -->
          <div v-if="activeTab === 'products'" class="p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-semibold text-surface-900">Products ({{ products.length }})</h3>
              <button class="btn btn-primary btn-sm" @click="createNewProduct">
                + Add Product
              </button>
            </div>

            <div class="grid gap-4">
              <div
                v-for="product in products"
                :key="product.id"
                class="flex items-center gap-4 p-3 bg-surface-50 rounded-lg"
              >
                <div class="w-16 h-16 rounded-lg overflow-hidden bg-surface-200 flex-shrink-0">
                  <img
                    v-if="product.images?.[0]"
                    :src="product.images[0]"
                    :alt="product.name"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-surface-900 line-clamp-1">{{ product.name }}</h4>
                  <p class="text-sm text-surface-500">{{ product.category }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="font-bold text-primary-700">{{ formatPrice(product.price) }}</span>
                    <span
                      :class="product.stock > 0 ? 'text-green-600' : 'text-red-500'"
                      class="text-xs"
                    >
                      {{ product.stock > 0 ? `${product.stock} in stock` : 'Out of stock' }}
                    </span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    class="px-3 py-1 text-sm bg-white border border-surface-200 rounded-lg hover:bg-surface-50"
                    @click="editProduct(product)"
                  >
                    Edit
                  </button>
                  <button
                    class="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    @click="deleteProduct(product.id)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Settings Tab -->
          <div v-if="activeTab === 'settings'" class="p-6 text-center text-surface-500">
            <p>Settings coming soon...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <div
      v-if="selectedOrder"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div class="fixed inset-0 bg-black/50" @click="selectedOrder = null" />
      <div class="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 class="text-lg font-bold mb-4">Order {{ selectedOrder.orderNumber }}</h3>
        
        <div class="space-y-4 mb-6">
          <div>
            <label class="text-sm text-surface-500">Customer</label>
            <p class="font-medium">{{ selectedOrder.shippingName }}</p>
            <p class="text-sm text-surface-600">{{ selectedOrder.shippingPhone }}</p>
            <p class="text-sm text-surface-600">{{ selectedOrder.shippingEmail }}</p>
          </div>
          
          <div>
            <label class="text-sm text-surface-500">Update Status</label>
            <select
              v-model="selectedOrder.newStatus"
              class="input mt-1"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div v-if="selectedOrder.newStatus === 'SHIPPED'">
            <label class="text-sm text-surface-500">Tracking URL</label>
            <input
              v-model="selectedOrder.trackingUrl"
              type="url"
              class="input mt-1"
              placeholder="https://..."
            />
          </div>
        </div>

        <div class="flex gap-3">
          <button
            class="flex-1 btn btn-primary"
            :disabled="isUpdatingStatus"
            @click="updateOrderStatus(selectedOrder.id, selectedOrder.newStatus, { trackingUrl: selectedOrder.trackingUrl })"
          >
            {{ isUpdatingStatus ? 'Updating...' : 'Update Status' }}
          </button>
          <button class="btn btn-secondary" @click="selectedOrder = null">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Product Edit Modal -->
    <div
      v-if="editingProduct"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div class="fixed inset-0 bg-black/50" @click="cancelEdit" />
      <div class="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 class="text-lg font-bold mb-4">
          {{ isCreatingProduct ? 'Create Product' : 'Edit Product' }}
        </h3>

        <div class="grid gap-4 mb-6">
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-surface-700">Name *</label>
              <input
                v-model="editingProduct.name"
                type="text"
                class="input mt-1"
                @input="editingProduct.slug = generateSlug(editingProduct.name)"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-surface-700">Slug</label>
              <input
                v-model="editingProduct.slug"
                type="text"
                class="input mt-1"
              />
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-surface-700">Short Description</label>
            <input
              v-model="editingProduct.shortDescription"
              type="text"
              class="input mt-1"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-surface-700">Full Description</label>
            <textarea
              v-model="editingProduct.description"
              rows="3"
              class="input mt-1 resize-none"
            />
          </div>

          <div class="grid sm:grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-medium text-surface-700">Price *</label>
              <input
                v-model.number="editingProduct.price"
                type="number"
                class="input mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-surface-700">Compare Price</label>
              <input
                v-model.number="editingProduct.comparePrice"
                type="number"
                class="input mt-1"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-surface-700">Stock</label>
              <input
                v-model.number="editingProduct.stock"
                type="number"
                class="input mt-1"
              />
            </div>
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-surface-700">Category</label>
              <input
                v-model="editingProduct.category"
                type="text"
                class="input mt-1"
                placeholder="e.g., supplements"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-surface-700">Weight/Size</label>
              <input
                v-model="editingProduct.weight"
                type="text"
                class="input mt-1"
                placeholder="e.g., 100g"
              />
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-surface-700">Usage Instructions</label>
            <textarea
              v-model="editingProduct.usage"
              rows="2"
              class="input mt-1 resize-none"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-surface-700">Ingredients</label>
            <input
              v-model="editingProduct.ingredients"
              type="text"
              class="input mt-1"
            />
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="editingProduct.isActive"
              type="checkbox"
              id="isActive"
              class="w-4 h-4"
            />
            <label for="isActive" class="text-sm font-medium text-surface-700">Active (visible on store)</label>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            class="flex-1 btn btn-primary"
            :disabled="isSavingProducts"
            @click="saveProduct"
          >
            {{ isSavingProducts ? 'Saving...' : 'Save Product' }}
          </button>
          <button class="btn btn-secondary" @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
