<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  order: {
    type: Object,
    default: null
  },
  adminToken: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])

// Loading states
const isUpdating = ref(false)
const updateError = ref('')
const updateSuccess = ref('')

// Active tab in modal
const activeTab = ref('details')

// Editable order data
const editableOrder = ref({})

// Status options
const statusOptions = [
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification', color: 'warning', icon: '⏳' },
  { value: 'PAYMENT_VERIFIED', label: 'Payment Verified', color: 'success', icon: '✓' },
  { value: 'PROCESSING', label: 'Processing', color: 'info', icon: '⚙️' },
  { value: 'SHIPPED', label: 'Shipped', color: 'primary', icon: '📦' },
  { value: 'DELIVERED', label: 'Delivered', color: 'success', icon: '✅' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'error', icon: '❌' },
  { value: 'FAILED', label: 'Failed', color: 'error', icon: '⚠️' }
]

// Watch for order changes and initialize editable data
watch(() => props.order, (newOrder) => {
  if (newOrder) {
    editableOrder.value = {
      ...newOrder,
      newStatus: newOrder.status,
      trackingUrl: newOrder.trackingUrl || '',
      trackingNumber: newOrder.trackingNumber || '',
      courierName: newOrder.courierName || '',
      adminNotes: newOrder.adminNotes || '',
      note: '',
      // Editable shipping info
      shippingName: newOrder.shippingName || '',
      shippingPhone: newOrder.shippingPhone || '',
      shippingEmail: newOrder.shippingEmail || '',
      shippingAddress: newOrder.shippingAddress || '',
      shippingCity: newOrder.shippingCity || '',
      shippingState: newOrder.shippingState || '',
      shippingPostal: newOrder.shippingPostal || '',
      cancellationReason: newOrder.cancellationReason || '',
      failureReason: newOrder.failureReason || '',
    }
    updateError.value = ''
    updateSuccess.value = ''
    activeTab.value = 'details'
  }
}, { immediate: true })

// Computed: Has status changed
const hasStatusChanged = computed(() => {
  return editableOrder.value.newStatus !== props.order?.status
})

// Computed: Is shipping form changed
const hasShippingChanged = computed(() => {
  if (!props.order) return false
  return (
    editableOrder.value.shippingName !== props.order.shippingName ||
    editableOrder.value.shippingPhone !== props.order.shippingPhone ||
    editableOrder.value.shippingEmail !== props.order.shippingEmail ||
    editableOrder.value.shippingAddress !== props.order.shippingAddress ||
    editableOrder.value.shippingCity !== props.order.shippingCity ||
    editableOrder.value.shippingState !== props.order.shippingState ||
    editableOrder.value.shippingPostal !== props.order.shippingPostal
  )
})

// Computed: Show tracking fields
const showTrackingFields = computed(() => {
  return ['SHIPPED', 'DELIVERED'].includes(editableOrder.value.newStatus)
})

// Computed: Show cancellation reason
const showCancellationReason = computed(() => {
  return editableOrder.value.newStatus === 'CANCELLED'
})

// Computed: Show failure reason
const showFailureReason = computed(() => {
  return editableOrder.value.newStatus === 'FAILED'
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
    case 'success': return 'bg-green-100 text-green-700 border-green-200'
    case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'error': return 'bg-red-100 text-red-700 border-red-200'
    case 'info': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'primary': return 'bg-primary-100 text-primary-700 border-primary-200'
    default: return 'bg-surface-100 text-surface-700 border-surface-200'
  }
}

async function updateOrderStatus() {
  if (!editableOrder.value.newStatus) return

  isUpdating.value = true
  updateError.value = ''
  updateSuccess.value = ''

  try {
    // Get the order ID - it could be _id (Convex) or id
    const orderId = props.order._id || props.order.id
    
    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${props.adminToken}`
      },
      body: JSON.stringify({
        status: editableOrder.value.newStatus,
        trackingUrl: editableOrder.value.trackingUrl || undefined,
        trackingNumber: editableOrder.value.trackingNumber || undefined,
        courierName: editableOrder.value.courierName || undefined,
        note: editableOrder.value.note || undefined,
        adminNotes: editableOrder.value.adminNotes || undefined,
        cancellationReason: editableOrder.value.cancellationReason || undefined,
        failureReason: editableOrder.value.failureReason || undefined,
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      updateSuccess.value = 'Order updated successfully!'
      emit('updated')
      // Close after short delay to show success
      setTimeout(() => {
        emit('close')
      }, 1000)
    } else {
      updateError.value = data.error || 'Failed to update order'
    }
  } catch (e) {
    console.error('Order update error:', e)
    updateError.value = 'Network error. Please try again.'
  } finally {
    isUpdating.value = false
  }
}

function close() {
  emit('close')
}
</script>

<template>
  <div v-if="order" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="close" />

    <!-- Modal -->
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-surface-200">
        <div>
          <h3 class="text-xl font-bold text-surface-900">Order {{ order.orderNumber }}</h3>
          <p class="text-sm text-surface-500">Placed on {{ formatDate(order.createdAt) }}</p>
        </div>
        <button
          @click="close"
          class="p-2 hover:bg-surface-100 rounded-full transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-surface-200">
        <button
          v-for="tab in ['details', 'items', 'status', 'history']"
          :key="tab"
          class="flex-1 py-3 text-center font-medium capitalize transition-colors"
          :class="activeTab === tab ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50' : 'text-surface-500 hover:text-surface-900'"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Success/Error Messages -->
        <div v-if="updateSuccess" class="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ updateSuccess }}
        </div>
        <div v-if="updateError" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ updateError }}
        </div>

        <!-- Details Tab -->
        <div v-if="activeTab === 'details'" class="space-y-6">
          <!-- Current Status -->
          <div class="flex items-center gap-3">
            <span class="text-sm text-surface-500">Current Status:</span>
            <span :class="['px-3 py-1 rounded-full text-sm font-medium border', getStatusColor(order.status)]">
              {{ order.status?.replace(/_/g, ' ') }}
            </span>
          </div>

          <!-- Order Summary -->
          <div class="bg-surface-50 rounded-xl p-4">
            <h4 class="font-semibold text-surface-900 mb-3">Order Summary</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-surface-500">Subtotal:</span>
                <span class="ml-2 font-medium">{{ formatPrice(order.subtotal) }}</span>
              </div>
              <div>
                <span class="text-surface-500">Shipping:</span>
                <span class="ml-2 font-medium">{{ formatPrice(order.shippingFee) }}</span>
              </div>
              <div v-if="order.discount" class="col-span-2">
                <span class="text-surface-500">Discount:</span>
                <span class="ml-2 font-medium text-green-600">-{{ formatPrice(order.discount) }}</span>
              </div>
              <div class="col-span-2 pt-2 border-t border-surface-200">
                <span class="text-surface-900 font-semibold">Total:</span>
                <span class="ml-2 text-lg font-bold text-primary-700">{{ formatPrice(order.total) }}</span>
              </div>
            </div>
          </div>

          <!-- Customer Info -->
          <div class="bg-surface-50 rounded-xl p-4">
            <h4 class="font-semibold text-surface-900 mb-3">Customer Information</h4>
            <div class="space-y-3">
              <div>
                <label class="text-xs text-surface-500 block mb-1">Name</label>
                <input v-model="editableOrder.shippingName" type="text" class="input" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-surface-500 block mb-1">Phone</label>
                  <input v-model="editableOrder.shippingPhone" type="tel" class="input" />
                </div>
                <div>
                  <label class="text-xs text-surface-500 block mb-1">Email</label>
                  <input v-model="editableOrder.shippingEmail" type="email" class="input" />
                </div>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div class="bg-surface-50 rounded-xl p-4">
            <h4 class="font-semibold text-surface-900 mb-3">Shipping Address</h4>
            <div class="space-y-3">
              <div>
                <label class="text-xs text-surface-500 block mb-1">Street Address</label>
                <textarea v-model="editableOrder.shippingAddress" rows="2" class="input resize-none" />
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label class="text-xs text-surface-500 block mb-1">City</label>
                  <input v-model="editableOrder.shippingCity" type="text" class="input" />
                </div>
                <div>
                  <label class="text-xs text-surface-500 block mb-1">State</label>
                  <input v-model="editableOrder.shippingState" type="text" class="input" />
                </div>
                <div>
                  <label class="text-xs text-surface-500 block mb-1">Postal Code</label>
                  <input v-model="editableOrder.shippingPostal" type="text" class="input" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Tab -->
        <div v-if="activeTab === 'items'" class="space-y-4">
          <h4 class="font-semibold text-surface-900">Order Items</h4>
          <div
            v-for="(item, index) in order.items"
            :key="index"
            class="flex items-center gap-4 p-3 bg-surface-50 rounded-xl"
          >
            <div class="w-16 h-16 rounded-lg overflow-hidden bg-surface-200 shrink-0">
              <img
                v-if="item.productImage"
                :src="item.productImage"
                :alt="item.productName"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-surface-400">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h5 class="font-medium text-surface-900 line-clamp-1">{{ item.productName }}</h5>
              <p class="text-sm text-surface-500">Qty: {{ item.quantity }}</p>
            </div>
            <div class="text-right">
              <p class="font-medium text-surface-900">{{ formatPrice(item.productPrice) }}</p>
              <p class="text-sm text-surface-500">{{ formatPrice(item.productPrice * item.quantity) }}</p>
            </div>
          </div>

          <div v-if="!order.items?.length" class="text-center py-8 text-surface-500">
            No items found
          </div>
        </div>

        <!-- Status Tab -->
        <div v-if="activeTab === 'status'" class="space-y-6">
          <!-- Status Update -->
          <div>
            <label class="block text-sm font-medium text-surface-700 mb-2">Update Status</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                v-for="opt in statusOptions"
                :key="opt.value"
                @click="editableOrder.newStatus = opt.value"
                :class="[
                  'p-3 rounded-lg border-2 text-center transition-all',
                  editableOrder.newStatus === opt.value
                    ? getStatusColor(opt.value) + ' border-current shadow-md'
                    : 'border-surface-200 hover:border-surface-300'
                ]"
              >
                <span class="text-lg block mb-1">{{ opt.icon }}</span>
                <span class="text-xs font-medium">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <!-- Tracking Info (for shipped/delivered) -->
          <div v-if="showTrackingFields" class="bg-blue-50 rounded-xl p-4 space-y-3">
            <h4 class="font-semibold text-blue-900">Tracking Information</h4>
            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-blue-700 block mb-1">Courier Name</label>
                <input
                  v-model="editableOrder.courierName"
                  type="text"
                  class="input"
                  placeholder="e.g., Blue Dart, DTDC"
                />
              </div>
              <div>
                <label class="text-xs text-blue-700 block mb-1">Tracking Number</label>
                <input
                  v-model="editableOrder.trackingNumber"
                  type="text"
                  class="input"
                  placeholder="e.g., BD123456789IN"
                />
              </div>
            </div>
            <div>
              <label class="text-xs text-blue-700 block mb-1">Tracking URL</label>
              <input
                v-model="editableOrder.trackingUrl"
                type="url"
                class="input"
                placeholder="https://..."
              />
            </div>
          </div>

          <!-- Cancellation Reason -->
          <div v-if="showCancellationReason" class="bg-red-50 rounded-xl p-4">
            <label class="text-sm font-medium text-red-700 block mb-2">Cancellation Reason</label>
            <textarea
              v-model="editableOrder.cancellationReason"
              rows="2"
              class="input resize-none"
              placeholder="Reason for cancellation..."
            />
          </div>

          <!-- Failure Reason -->
          <div v-if="showFailureReason" class="bg-red-50 rounded-xl p-4">
            <label class="text-sm font-medium text-red-700 block mb-2">Failure Reason</label>
            <textarea
              v-model="editableOrder.failureReason"
              rows="2"
              class="input resize-none"
              placeholder="Reason for failure..."
            />
          </div>

          <!-- Status Note -->
          <div>
            <label class="text-sm font-medium text-surface-700 block mb-2">Status Note (optional)</label>
            <textarea
              v-model="editableOrder.note"
              rows="2"
              class="input resize-none"
              placeholder="Add a note for this status update..."
            />
          </div>

          <!-- Admin Notes -->
          <div>
            <label class="text-sm font-medium text-surface-700 block mb-2">Admin Notes (internal)</label>
            <textarea
              v-model="editableOrder.adminNotes"
              rows="2"
              class="input resize-none"
              placeholder="Internal notes (not visible to customer)..."
            />
          </div>
        </div>

        <!-- History Tab -->
        <div v-if="activeTab === 'history'" class="space-y-4">
          <h4 class="font-semibold text-surface-900">Status History</h4>
          
          <div v-if="order.history?.length" class="relative">
            <!-- Timeline line -->
            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-200" />
            
            <div
              v-for="(entry, index) in order.history"
              :key="index"
              class="relative pl-10 pb-6 last:pb-0"
            >
              <!-- Timeline dot -->
              <div :class="['absolute left-2 w-5 h-5 rounded-full border-2 bg-white', getStatusColor(entry.status)]" />
              
              <div class="bg-surface-50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-1">
                  <span :class="['text-sm font-medium', getStatusColor(entry.status).split(' ')[1]]">
                    {{ entry.status?.replace(/_/g, ' ') }}
                  </span>
                  <span class="text-xs text-surface-500">{{ formatDate(entry.createdAt) }}</span>
                </div>
                <p v-if="entry.note" class="text-sm text-surface-600">{{ entry.note }}</p>
                <p class="text-xs text-surface-400 mt-1">by {{ entry.changedBy || 'system' }}</p>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-surface-500">
            <svg class="w-12 h-12 mx-auto mb-3 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No status history available</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex gap-3 p-6 border-t border-surface-200 bg-surface-50">
        <button
          class="flex-1 btn btn-primary btn-lg"
          :disabled="isUpdating || (!hasStatusChanged && !hasShippingChanged)"
          @click="updateOrderStatus"
        >
          <span v-if="isUpdating" class="flex items-center justify-center gap-2">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Updating...
          </span>
          <span v-else>Save Changes</span>
        </button>
        <button class="btn btn-secondary btn-lg" @click="close">Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
