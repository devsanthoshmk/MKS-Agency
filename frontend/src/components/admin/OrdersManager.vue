<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  orders: {
    type: Array,
    required: true
  },
  isLoading: Boolean
})

const emit = defineEmits(['refresh', 'select-order'])

// Search and filter state
const searchQuery = ref('')
const statusFilter = ref('all')

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

// Filtered orders
const filteredOrders = computed(() => {
  let result = props.orders

  // Filter by status
  if (statusFilter.value !== 'all') {
    result = result.filter(order => order.status === statusFilter.value)
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(order =>
      order.orderNumber?.toLowerCase().includes(query) ||
      order.shippingName?.toLowerCase().includes(query) ||
      order.shippingEmail?.toLowerCase().includes(query) ||
      order.shippingPhone?.includes(query)
    )
  }

  return result
})

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price)
}

function formatDate(dateString) {
  if (!dateString) return '-'
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

function selectOrder(order) {
  emit('select-order', order)
}
</script>

<template>
  <div class="orders-manager">
    <!-- Header with filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <!-- Search -->
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search orders by name, email, phone, or order #..."
          class="input w-full pl-10"
        />
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <!-- Status Filter -->
      <select v-model="statusFilter" class="input w-full sm:w-48">
        <option value="all">All Statuses</option>
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>

      <!-- Refresh Button -->
      <button
        class="btn btn-secondary"
        @click="emit('refresh')"
        :disabled="isLoading"
      >
        <svg v-if="isLoading" class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span v-else>Refresh</span>
      </button>
    </div>

    <!-- Orders Count -->
    <p class="text-sm text-surface-500 mb-4">
      Showing {{ filteredOrders.length }} of {{ orders.length }} orders
    </p>

    <!-- Empty State -->
    <div v-if="filteredOrders.length === 0" class="text-center py-12 text-surface-500">
      <svg class="w-16 h-16 mx-auto mb-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p v-if="orders.length === 0">No orders yet</p>
      <p v-else>No orders match your filters</p>
    </div>

    <!-- Orders Table -->
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
            v-for="order in filteredOrders"
            :key="order._id || order.id"
            class="border-b border-surface-100 hover:bg-surface-50 cursor-pointer transition-colors"
            @click="selectOrder(order)"
          >
            <td class="py-3 px-4">
              <span class="font-medium text-primary-700">{{ order.orderNumber }}</span>
            </td>
            <td class="py-3 px-4">
              <p class="font-medium">{{ order.shippingName }}</p>
              <p class="text-xs text-surface-500">{{ order.shippingEmail }}</p>
            </td>
            <td class="py-3 px-4 font-medium">{{ formatPrice(order.total) }}</td>
            <td class="py-3 px-4">
              <span :class="['text-xs px-2 py-1 rounded-full', getStatusColor(order.status)]">
                {{ order.status?.replace(/_/g, ' ') }}
              </span>
            </td>
            <td class="py-3 px-4 text-surface-500">{{ formatDate(order.createdAt) }}</td>
            <td class="py-3 px-4 text-right">
              <button
                class="text-primary-600 hover:underline font-medium"
                @click.stop="selectOrder(order)"
              >
                Manage
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.orders-manager {
  width: 100%;
}
</style>
