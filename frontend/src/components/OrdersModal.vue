<script setup>
import { computed, onMounted } from 'vue'
import { useUI } from '../composables/useUI'
import { useOrders } from '../composables/useOrders'
import { useAuth } from '../composables/useAuth'

const { activeModal, closeModal } = useUI()
const { 
  orders, 
  currentOrder, 
  isLoading, 
  fetchOrders, 
  getStatusInfo, 
  formatPrice, 
  formatDate,
  closeOrdersModal 
} = useOrders()
const { isAuthenticated } = useAuth()

const isOpen = computed(() => activeModal.value === 'orders')

onMounted(() => {
  if (isAuthenticated.value) {
    fetchOrders()
  }
})

function handleClose() {
  closeModal()
  closeOrdersModal()
}

function selectOrder(order) {
  currentOrder.value = order
}

function getStatusColor(status) {
  const info = getStatusInfo(status)
  switch (info.color) {
    case 'success': return 'bg-green-100 text-green-700 border-green-200'
    case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'error': return 'bg-red-100 text-red-700 border-red-200'
    case 'info': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'primary': return 'bg-primary-100 text-primary-700 border-primary-200'
    default: return 'bg-surface-100 text-surface-700 border-surface-200'
  }
}
</script>

<template>
  <transition name="scale">
    <div 
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <!-- Overlay -->
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose" />
      
      <!-- Modal -->
      <div class="relative min-h-screen flex items-center justify-center p-4">
        <div class="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="p-6 border-b border-surface-200 flex items-center justify-between shrink-0">
            <div>
              <h2 class="text-xl font-display font-bold text-surface-900">My Orders</h2>
              <p class="text-surface-500 text-sm mt-1">Track and manage your orders</p>
            </div>
            <button 
              class="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center hover:bg-surface-200 transition-colors"
              @click="handleClose"
            >
              <svg class="w-5 h-5 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-hidden flex">
            <!-- Orders List -->
            <div class="w-full md:w-1/3 border-r border-surface-200 overflow-y-auto">
              <!-- Loading -->
              <div v-if="isLoading" class="p-6 space-y-4">
                <div v-for="i in 3" :key="i" class="skeleton h-24 rounded-xl" />
              </div>
              
              <!-- Empty State -->
              <div v-else-if="orders.length === 0" class="p-6 text-center">
                <div class="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p class="text-surface-600">No orders yet</p>
              </div>
              
              <!-- Orders List -->
              <div v-else class="divide-y divide-surface-100">
                <button 
                  v-for="order in orders" 
                  :key="order.id"
                  class="w-full p-4 text-left hover:bg-surface-50 transition-colors"
                  :class="{ 'bg-primary-50': currentOrder?.id === order.id }"
                  @click="selectOrder(order)"
                >
                  <div class="flex items-start justify-between mb-2">
                    <span class="font-medium text-surface-900 text-sm">{{ order.orderNumber }}</span>
                    <span 
                      class="text-xs px-2 py-0.5 rounded-full border"
                      :class="getStatusColor(order.status)"
                    >
                      {{ getStatusInfo(order.status).label }}
                    </span>
                  </div>
                  <p class="text-xs text-surface-500">{{ formatDate(order.createdAt) }}</p>
                  <p class="text-sm font-bold text-primary-700 mt-1">{{ formatPrice(order.total) }}</p>
                </button>
              </div>
            </div>
            
            <!-- Order Details -->
            <div class="hidden md:flex flex-1 overflow-y-auto">
              <!-- No Selection -->
              <div v-if="!currentOrder" class="flex-1 flex items-center justify-center text-surface-400">
                <div class="text-center">
                  <svg class="w-16 h-16 mx-auto mb-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>Select an order to view details</p>
                </div>
              </div>
              
              <!-- Order Detail View -->
              <div v-else class="flex-1 p-6 space-y-6">
                <!-- Order Header -->
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-lg font-bold text-surface-900">{{ currentOrder.orderNumber }}</h3>
                    <p class="text-sm text-surface-500">Placed on {{ formatDate(currentOrder.createdAt) }}</p>
                  </div>
                  <span 
                    class="px-3 py-1 rounded-full text-sm font-medium border"
                    :class="getStatusColor(currentOrder.status)"
                  >
                    {{ getStatusInfo(currentOrder.status).icon }} {{ getStatusInfo(currentOrder.status).label }}
                  </span>
                </div>
                
                <!-- Status Description -->
                <div class="bg-surface-50 rounded-xl p-4">
                  <p class="text-surface-700">{{ getStatusInfo(currentOrder.status).description }}</p>
                </div>
                
                <!-- Tracking Info -->
                <div v-if="currentOrder.trackingUrl" class="bg-primary-50 rounded-xl p-4">
                  <h4 class="font-semibold text-primary-900 mb-2">Tracking Information</h4>
                  <p class="text-sm text-primary-700 mb-2">
                    Courier: {{ currentOrder.courierName || 'Not specified' }}
                  </p>
                  <a 
                    :href="currentOrder.trackingUrl"
                    target="_blank"
                    class="btn btn-primary btn-sm"
                  >
                    Track Package →
                  </a>
                </div>
                
                <!-- Failure/Cancellation Reason -->
                <div v-if="currentOrder.failureReason || currentOrder.cancellationReason" class="bg-red-50 rounded-xl p-4">
                  <h4 class="font-semibold text-red-900 mb-1">Reason</h4>
                  <p class="text-sm text-red-700">
                    {{ currentOrder.failureReason || currentOrder.cancellationReason }}
                  </p>
                </div>
                
                <!-- Order Items -->
                <div>
                  <h4 class="font-semibold text-surface-900 mb-3">Order Items</h4>
                  <div class="space-y-3">
                    <div 
                      v-for="item in currentOrder.items" 
                      :key="item.id"
                      class="flex gap-3 bg-surface-50 rounded-xl p-3"
                    >
                      <div class="w-16 h-16 rounded-lg overflow-hidden bg-surface-200 shrink-0">
                        <img 
                          v-if="item.productImage"
                          :src="item.productImage"
                          :alt="item.productName"
                          class="w-full h-full object-cover"
                        />
                      </div>
                      <div class="flex-1 min-w-0">
                        <h5 class="font-medium text-surface-900 text-sm line-clamp-1">{{ item.productName }}</h5>
                        <p class="text-xs text-surface-500">Qty: {{ item.quantity }}</p>
                        <p class="text-sm font-bold text-primary-700 mt-1">{{ formatPrice(item.subtotal) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Shipping Address -->
                <div>
                  <h4 class="font-semibold text-surface-900 mb-3">Shipping Address</h4>
                  <div class="bg-surface-50 rounded-xl p-4">
                    <p class="text-surface-900 font-medium">{{ currentOrder.shippingName }}</p>
                    <p class="text-surface-600 text-sm">{{ currentOrder.shippingAddress }}</p>
                    <p class="text-surface-600 text-sm">
                      {{ currentOrder.shippingCity }}, {{ currentOrder.shippingState }} - {{ currentOrder.shippingPostal }}
                    </p>
                    <p class="text-surface-600 text-sm mt-2">📞 {{ currentOrder.shippingPhone }}</p>
                    <p class="text-surface-600 text-sm">✉️ {{ currentOrder.shippingEmail }}</p>
                  </div>
                </div>
                
                <!-- Order Total -->
                <div class="border-t border-surface-200 pt-4">
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-surface-600">Subtotal</span>
                    <span>{{ formatPrice(currentOrder.subtotal) }}</span>
                  </div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-surface-600">Shipping</span>
                    <span v-if="currentOrder.shippingFee === 0" class="text-green-600">FREE</span>
                    <span v-else>{{ formatPrice(currentOrder.shippingFee) }}</span>
                  </div>
                  <div class="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-surface-200">
                    <span>Total</span>
                    <span class="text-primary-700">{{ formatPrice(currentOrder.total) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
}
</style>
