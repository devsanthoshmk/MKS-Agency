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
  { value: 'PENDING_VERIFICATION', label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
  { value: 'PAYMENT_VERIFIED', label: 'Verified', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' },
  { value: 'PROCESSING', label: 'Processing', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
  { value: 'SHIPPED', label: 'Shipped', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.2)' },
  { value: 'DELIVERED', label: 'Delivered', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)' },
  { value: 'CANCELLED', label: 'Cancelled', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
  { value: 'FAILED', label: 'Failed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' }
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
    year: 'numeric'
  })
}

function getStatusInfo(status) {
  return statusOptions.find(s => s.value === status) || { label: status, color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' }
}

function selectOrder(order) {
  emit('select-order', order)
}
</script>

<template>
  <div class="orders-mgr">
    <!-- Toolbar -->
    <div class="orders-toolbar">
      <!-- Search -->
      <div class="orders-search">
        <svg class="orders-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, email, order #..."
          class="orders-search__input"
        />
      </div>

      <!-- Status Filter -->
      <div class="orders-filter">
        <select v-model="statusFilter" class="orders-select">
          <option value="all">All Statuses</option>
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Refresh -->
      <button class="orders-refresh" @click="emit('refresh')" :disabled="isLoading" title="Refresh">
        <svg :class="{ 'spin': isLoading }" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
      </button>
    </div>

    <!-- Count -->
    <p class="orders-count">{{ filteredOrders.length }} order{{ filteredOrders.length !== 1 ? 's' : '' }} found</p>

    <!-- Empty State -->
    <div v-if="filteredOrders.length === 0" class="orders-empty">
      <div class="orders-empty__icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      </div>
      <h3 class="orders-empty__title">No orders found</h3>
      <p class="orders-empty__desc">Try adjusting your search or filters</p>
    </div>

    <div v-else>
      <!-- Mobile Card View -->
      <div class="orders-cards">
        <div
          v-for="order in filteredOrders"
          :key="order._id || order.id"
          class="order-card"
          @click="selectOrder(order)"
        >
          <div class="order-card__top">
            <div>
              <span class="order-card__number">#{{ order.orderNumber }}</span>
              <span class="order-card__total">{{ formatPrice(order.total) }}</span>
            </div>
            <span
              class="order-badge"
              :style="{ color: getStatusInfo(order.status).color, background: getStatusInfo(order.status).bg, borderColor: getStatusInfo(order.status).border }"
            >
              {{ getStatusInfo(order.status).label }}
            </span>
          </div>
          <div class="order-card__customer">
            <div class="order-card__avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <p class="order-card__name">{{ order.shippingName }}</p>
              <p class="order-card__date">{{ formatDate(order.createdAt) }}</p>
            </div>
          </div>
          <button class="order-card__action">
            <span>Manage</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <!-- Desktop Table View -->
      <div class="orders-table-wrap">
        <table class="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th class="th-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in filteredOrders"
              :key="order._id || order.id"
              @click="selectOrder(order)"
              class="orders-table__row"
            >
              <td>
                <span class="td-order-num">#{{ order.orderNumber }}</span>
              </td>
              <td>
                <div class="td-customer">
                  <div class="td-customer__avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div>
                    <p class="td-customer__name">{{ order.shippingName }}</p>
                    <p class="td-customer__email">{{ order.shippingEmail }}</p>
                  </div>
                </div>
              </td>
              <td>
                <span class="td-total">{{ formatPrice(order.total) }}</span>
              </td>
              <td>
                <span
                  class="order-badge"
                  :style="{ color: getStatusInfo(order.status).color, background: getStatusInfo(order.status).bg, borderColor: getStatusInfo(order.status).border }"
                >
                  {{ getStatusInfo(order.status).label }}
                </span>
              </td>
              <td class="td-date">{{ formatDate(order.createdAt) }}</td>
              <td class="th-right">
                <button class="td-manage" @click.stop="selectOrder(order)">
                  Manage
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-mgr {
  animation: fadeUp 0.4s ease;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ----- TOOLBAR ----- */
.orders-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .orders-toolbar {
    flex-direction: row;
    align-items: center;
    padding: 0.75rem 1rem;
  }
}

.orders-search {
  position: relative;
  flex: 1;
}

.orders-search__icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #4b5563;
  pointer-events: none;
}

.orders-search__input {
  width: 100%;
  padding: 0.65rem 0.875rem 0.65rem 2.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #e5e7eb;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.orders-search__input::placeholder {
  color: #4b5563;
}

.orders-search__input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.12);
}

.orders-filter {
  width: 100%;
}

@media (min-width: 768px) {
  .orders-filter {
    width: 180px;
  }
}

.orders-select {
  width: 100%;
  padding: 0.65rem 0.875rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #e5e7eb;
  font-size: 0.875rem;
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.orders-select:focus {
  border-color: #10b981;
}

.orders-select option {
  background: #1a1b22;
  color: #e5e7eb;
}

.orders-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

@media (min-width: 768px) {
  .orders-refresh {
    width: 40px;
    min-width: 40px;
  }
}

.orders-refresh:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ----- COUNT ----- */
.orders-count {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0.25rem;
}

/* ----- EMPTY STATE ----- */
.orders-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  text-align: center;
}

.orders-empty__icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  color: #4b5563;
  margin-bottom: 1.25rem;
}

.orders-empty__title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  color: #f0f1f3;
  margin: 0 0 0.375rem;
}

.orders-empty__desc {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

/* ----- BADGE ----- */
.order-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 1px solid;
  white-space: nowrap;
}

/* ----- MOBILE CARDS ----- */
.orders-cards {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

@media (min-width: 768px) {
  .orders-cards {
    display: none;
  }
}

.order-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.order-card:active {
  transform: scale(0.99);
}

.order-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.order-card__number {
  display: block;
  font-size: 0.72rem;
  font-family: 'JetBrains Mono', monospace, monospace;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.order-card__total {
  display: block;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  color: #f0f1f3;
}

.order-card__customer {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 0.875rem;
}

.order-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;
}

.order-card__name {
  font-weight: 600;
  font-size: 0.875rem;
  color: #e5e7eb;
  margin: 0;
}

.order-card__date {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.125rem 0 0;
}

.order-card__action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.625rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #d1d5db;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.order-card__action:hover {
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
}

/* ----- DESKTOP TABLE ----- */
.orders-table-wrap {
  display: none;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  overflow: hidden;
}

@media (min-width: 768px) {
  .orders-table-wrap {
    display: block;
  }
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.orders-table th {
  padding: 0.875rem 1.25rem;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

.th-right {
  text-align: right !important;
}

.orders-table__row {
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.orders-table__row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.orders-table__row:last-child {
  border-bottom: none;
}

.orders-table td {
  padding: 0.875rem 1.25rem;
  vertical-align: middle;
}

.td-order-num {
  font-weight: 700;
  color: #f0f1f3;
  font-family: 'JetBrains Mono', monospace, monospace;
  font-size: 0.8rem;
}

.td-customer {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.td-customer__avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;
}

.td-customer__name {
  font-weight: 600;
  color: #e5e7eb;
  margin: 0;
  font-size: 0.85rem;
}

.td-customer__email {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.125rem 0 0;
}

.td-total {
  font-weight: 700;
  color: #f0f1f3;
}

.td-date {
  color: #6b7280;
}

.td-manage {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: #10b981;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
}

.orders-table__row:hover .td-manage {
  opacity: 1;
}

.td-manage:hover {
  color: #34d399;
}
</style>
