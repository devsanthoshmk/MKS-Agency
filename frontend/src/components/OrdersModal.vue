<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUI } from '../composables/useUI'
import { useOrders } from '../composables/useOrders'
import { useAuth } from '../composables/useAuth'

const { activeModal, closeModal } = useUI()
const {
  orders,
  currentOrder,
  isLoading,
  loadOrders,
  getStatusInfo,
  formatPrice,
  formatDate
} = useOrders()
const { isAuthenticated } = useAuth()

const isOpen = computed(() => activeModal.value === 'orders')

onMounted(() => {
  if (isAuthenticated.value) loadOrders()
})

function handleClose() {
  closeModal()
  currentOrder.value = null
}

function selectOrder(order) {
  currentOrder.value = order
}

function goBackToList() {
  currentOrder.value = null
}

// Returns tailwind classes for the pill badge (uses UPPERCASE backend statuses)
function getStatusPillClasses(status) {
  switch (status) {
    case 'DELIVERED':             return 'bg-emerald-100 text-emerald-800'
    case 'SHIPPED':               return 'bg-sky-100 text-sky-800'
    case 'PROCESSING':            return 'bg-amber-100 text-amber-800'
    case 'PENDING_VERIFICATION':  return 'bg-orange-100 text-orange-800'
    case 'PAYMENT_VERIFIED':      return 'bg-teal-100 text-teal-800'
    case 'CANCELLED':             return 'bg-red-100 text-red-800'
    case 'FAILED':                return 'bg-red-100 text-red-800'
    default:                      return 'bg-surface-100 text-surface-700'
  }
}

// Dot color for status indicator (uses UPPERCASE backend statuses)
function getStatusDotClass(status) {
  switch (status) {
    case 'DELIVERED':             return 'bg-emerald-500'
    case 'SHIPPED':               return 'bg-sky-500'
    case 'PROCESSING':            return 'bg-amber-500'
    case 'PENDING_VERIFICATION':  return 'bg-orange-500'
    case 'PAYMENT_VERIFIED':      return 'bg-teal-500'
    case 'CANCELLED':             return 'bg-red-500'
    case 'FAILED':                return 'bg-red-500'
    default:                      return 'bg-surface-400'
  }
}

// Timeline steps for visual display (labels shown to the user)
const timelineSteps = ['pending', 'processing', 'shipped', 'delivered']

// Maps backend status to the timeline step index (0-3)
// PENDING_VERIFICATION → 0 (Pending)
// PAYMENT_VERIFIED / PROCESSING → 1 (Processing)
// SHIPPED → 2
// DELIVERED → 3
const statusToTimelineIndex = {
  'PENDING_VERIFICATION': 0,
  'PAYMENT_VERIFIED': 1,
  'PROCESSING': 1,
  'SHIPPED': 2,
  'DELIVERED': 3,
}

function getStepState(step, currentStatus) {
  if (currentStatus === 'CANCELLED' || currentStatus === 'FAILED') return 'cancelled'
  const currentIndex = statusToTimelineIndex[currentStatus] ?? -1
  const stepIndex = timelineSteps.indexOf(step)
  if (stepIndex < currentIndex) return 'done'
  if (stepIndex === currentIndex) return 'active'
  return 'upcoming'
}
</script>

<template>
  <transition name="modal-fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-surface-900/60 backdrop-blur-sm"
        @click="handleClose"
      />

      <!-- Shell -->
      <div
        class="relative w-full max-w-6xl h-[92vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-modal-slide-up ring-1 ring-surface-200"
      >
        <!-- ── TOP BAR ─────────────────────────────────── -->
        <header class="shrink-0 flex items-center justify-between px-8 py-5 border-b border-surface-100 bg-white/80 backdrop-blur-md z-10">
          <div class="flex items-center gap-4">
            <!-- Back button (mobile: detail → list) -->
            <button
              v-if="currentOrder"
              class="md:hidden w-9 h-9 rounded-full bg-surface-50 hover:bg-surface-100 flex items-center justify-center text-surface-600 transition-colors mr-1"
              @click="goBackToList"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 class="text-xl font-display font-bold text-surface-900 leading-tight">My Orders</h2>
              <p class="text-xs text-surface-400 mt-0.5 hidden sm:block">Track and manage your purchases</p>
            </div>
          </div>
          <button
            class="w-10 h-10 rounded-full bg-surface-50 hover:bg-surface-100 flex items-center justify-center text-surface-500 hover:text-surface-900 transition-all duration-200 group"
            @click="handleClose"
          >
            <svg class="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <!-- ── BODY (sidebar + detail) ──────────────────── -->
        <div class="flex flex-1 overflow-hidden">

          <!-- LEFT: Orders List -->
          <aside
            class="w-full md:w-[320px] lg:w-[360px] border-r border-surface-100 flex flex-col shrink-0 overflow-hidden transition-all duration-300"
            :class="currentOrder ? 'hidden md:flex' : 'flex'"
          >
            <!-- Loading skeletons -->
            <div v-if="isLoading" class="p-4 space-y-3 overflow-y-auto">
              <div v-for="i in 4" :key="i" class="animate-pulse flex gap-4 p-4 rounded-2xl bg-surface-50">
                <div class="w-10 h-10 rounded-xl bg-surface-200 shrink-0"></div>
                <div class="flex-1 space-y-2 pt-1">
                  <div class="h-3 bg-surface-200 rounded-full w-3/4"></div>
                  <div class="h-3 bg-surface-200 rounded-full w-1/2"></div>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="orders.length === 0"
              class="flex-1 flex flex-col items-center justify-center p-8 text-center"
            >
              <div class="w-20 h-20 rounded-2xl bg-surface-50 flex items-center justify-center mb-5 border border-surface-100">
                <svg class="w-9 h-9 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p class="font-bold text-surface-800 mb-1">No orders yet</p>
              <p class="text-sm text-surface-400">Your purchase history will show up here.</p>
            </div>

            <!-- Order list items -->
            <ul v-else class="flex-1 overflow-y-auto divide-y divide-surface-50 py-2">
              <li v-for="order in orders" :key="order.id">
                <button
                  class="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-surface-50 transition-colors duration-150 relative group"
                  :class="currentOrder?.id === order.id ? 'bg-primary-50/60' : ''"
                  @click="selectOrder(order)"
                >
                  <!-- Left accent bar -->
                  <div
                    class="absolute left-0 top-4 bottom-4 w-0.5 rounded-full transition-all duration-300"
                    :class="currentOrder?.id === order.id ? 'bg-primary-500 opacity-100' : 'opacity-0 bg-primary-500 group-hover:opacity-30'"
                  ></div>

                  <!-- Icon -->
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    :class="currentOrder?.id === order.id ? 'bg-primary-100' : 'bg-surface-100 group-hover:bg-surface-200'"
                  >
                    <svg class="w-5 h-5" :class="currentOrder?.id === order.id ? 'text-primary-600' : 'text-surface-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                      <span class="font-bold text-sm text-surface-900 font-mono tracking-tight">{{ order.orderNumber }}</span>
                      <span
                        class="text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0"
                        :class="getStatusPillClasses(order.status)"
                      >{{ getStatusInfo(order.status).label }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-surface-400">{{ formatDate(order.createdAt) }} · {{ order.items.length }} item{{ order.items.length > 1 ? 's' : '' }}</span>
                      <span class="text-sm font-bold text-surface-800">{{ formatPrice(order.total) }}</span>
                    </div>
                  </div>
                </button>
              </li>
            </ul>
          </aside>

          <!-- RIGHT: Detail Panel -->
          <main
            class="flex-1 overflow-y-auto custom-scrollbar"
            :class="currentOrder ? 'flex flex-col' : 'hidden md:flex md:flex-col'"
          >
            <!-- Empty prompt (desktop) -->
            <div
              v-if="!currentOrder"
              class="flex-1 flex flex-col items-center justify-center text-center p-10"
            >
              <div class="w-24 h-24 rounded-3xl bg-surface-50 border-2 border-dashed border-surface-200 flex items-center justify-center mb-6">
                <svg class="w-10 h-10 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 class="text-xl font-display font-bold text-surface-800 mb-2">Select an Order</h3>
              <p class="text-sm text-surface-400 max-w-xs">Choose any order from the list on the left to view its full details.</p>
            </div>

            <!-- Order Detail Content -->
            <div v-else class="p-6 md:p-10 space-y-8 animate-fade-in">

              <!-- ── ORDER HEADER ── -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p class="text-xs font-bold uppercase tracking-widest text-surface-400 mb-1">Order</p>
                  <h3 class="text-3xl font-display font-medium text-surface-900">{{ currentOrder.orderNumber }}</h3>
                  <p class="text-sm text-surface-400 mt-1">Placed on {{ formatDate(currentOrder.createdAt) }}</p>
                </div>
                <span
                  class="self-start sm:self-center flex items-center gap-2.5 px-5 py-2.5 rounded-full font-bold text-sm shadow-sm"
                  :class="getStatusPillClasses(currentOrder.status)"
                >
                  <span class="w-2 h-2 rounded-full" :class="getStatusDotClass(currentOrder.status)"></span>
                  {{ getStatusInfo(currentOrder.status).label }}
                </span>
              </div>

              <!-- ── STATUS TIMELINE ── -->
              <div
                v-if="currentOrder.status !== 'CANCELLED' && currentOrder.status !== 'FAILED'"
                class="bg-surface-50/80 rounded-2xl p-6 border border-surface-100"
              >
                <h4 class="text-xs font-bold text-surface-500 uppercase tracking-widest mb-6">Tracking Progress</h4>
                <div class="relative flex justify-between items-start">
                  <!-- Background line -->
                  <div class="absolute top-4 left-0 right-0 h-0.5 bg-surface-200 z-0"></div>

                  <template v-for="(step, i) in timelineSteps" :key="step">
                    <div class="relative z-10 flex flex-col items-center gap-2 w-1/4">
                      <!-- Dot -->
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white transition-all duration-500"
                        :class="{
                          'bg-primary-600 ring-primary-100': getStepState(step, currentOrder.status) === 'active',
                          'bg-emerald-500 ring-emerald-50':  getStepState(step, currentOrder.status) === 'done',
                          'bg-surface-200 ring-surface-50':  getStepState(step, currentOrder.status) === 'upcoming',
                        }"
                      >
                        <svg v-if="getStepState(step, currentOrder.status) === 'done'" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
                        <div v-else-if="getStepState(step, currentOrder.status) === 'active'" class="w-2.5 h-2.5 rounded-full bg-white"></div>
                        <div v-else class="w-2 h-2 rounded-full bg-surface-400"></div>
                      </div>
                      <!-- Label -->
                      <span
                        class="text-[11px] font-bold uppercase tracking-wide text-center capitalize"
                        :class="{
                          'text-primary-700': getStepState(step, currentOrder.status) === 'active',
                          'text-emerald-700': getStepState(step, currentOrder.status) === 'done',
                          'text-surface-400': getStepState(step, currentOrder.status) === 'upcoming',
                        }"
                      >{{ step }}</span>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Cancelled Banner -->
              <div v-else class="flex items-center gap-4 p-5 rounded-2xl bg-red-50 border border-red-100">
                <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <div>
                  <p class="font-bold text-red-800">Order Cancelled</p>
                  <p class="text-sm text-red-600">{{ getStatusInfo(currentOrder.status).description }}</p>
                </div>
              </div>

              <!-- ── ITEMS ORDERED ── -->
              <div>
                <h4 class="text-xs font-bold text-surface-500 uppercase tracking-widest mb-4">Items Ordered</h4>
                <div class="space-y-3">
                  <div
                    v-for="item in currentOrder.items"
                    :key="item.id"
                    class="flex gap-4 bg-white rounded-2xl p-4 border border-surface-100 hover:border-surface-200 transition-colors shadow-sm"
                  >
                    <div class="w-20 h-20 rounded-xl overflow-hidden bg-surface-50 shrink-0 border border-surface-100">
                      <img
                        v-if="item.productImage"
                        :src="item.productImage"
                        :alt="item.productName"
                        class="w-full h-full object-cover"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-surface-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col justify-center">
                      <h5 class="font-bold text-surface-900 text-sm line-clamp-2 mb-2">{{ item.productName }}</h5>
                      <div class="flex items-center justify-between">
                        <span class="text-xs font-medium text-surface-500 bg-surface-50 border border-surface-100 px-3 py-1 rounded-full">Qty: {{ item.quantity }}</span>
                        <span class="font-display font-bold text-primary-700">{{ formatPrice(item.subtotal) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ── BOTTOM GRID: Shipping + Summary ── -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <!-- Delivery Details -->
                <div class="bg-surface-50 rounded-2xl p-6 border border-surface-100 space-y-4">
                  <h4 class="text-xs font-bold text-surface-500 uppercase tracking-widest mb-4">Delivery Details</h4>
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-full bg-white border border-surface-200 flex items-center justify-center shrink-0">
                      <svg class="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </div>
                    <div>
                      <p class="font-bold text-surface-900 text-sm">{{ currentOrder.shippingName }}</p>
                      <p class="text-sm text-surface-500 mt-0.5 leading-relaxed">{{ currentOrder.shippingAddress }}<br/>{{ currentOrder.shippingCity }}, {{ currentOrder.shippingState }} {{ currentOrder.shippingPostal }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 border-t border-surface-200 pt-4">
                    <div class="w-8 h-8 rounded-full bg-white border border-surface-200 flex items-center justify-center shrink-0">
                      <svg class="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </div>
                    <span class="text-sm text-surface-600">{{ currentOrder.shippingPhone }}</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-white border border-surface-200 flex items-center justify-center shrink-0">
                      <svg class="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </div>
                    <span class="text-sm text-surface-600">{{ currentOrder.shippingEmail }}</span>
                  </div>
                </div>

                <!-- Payment Summary -->
                <div class="bg-surface-50 rounded-2xl p-6 border border-surface-100">
                  <h4 class="text-xs font-bold text-surface-500 uppercase tracking-widest mb-5">Payment Summary</h4>
                  <div class="space-y-3">
                    <div class="flex justify-between text-sm">
                      <span class="text-surface-500">Subtotal</span>
                      <span class="font-medium text-surface-900">{{ formatPrice(currentOrder.subtotal) }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-surface-500">Shipping</span>
                      <span v-if="currentOrder.shippingFee === 0" class="font-bold text-emerald-600">Free</span>
                      <span v-else class="font-medium text-surface-900">{{ formatPrice(currentOrder.shippingFee) }}</span>
                    </div>
                    <div class="pt-4 mt-1 border-t-2 border-dashed border-surface-200 flex justify-between items-center">
                      <span class="font-bold text-surface-900">Total Paid</span>
                      <span class="text-2xl font-display font-bold text-primary-700">{{ formatPrice(currentOrder.total) }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </main>

        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* Modal entrance */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.35s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.animate-modal-slide-up {
  animation: modalSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(32px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Fade-in for detail panel */
.animate-fade-in {
  animation: fadeIn 0.3s ease forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Subtle scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); }
</style>
