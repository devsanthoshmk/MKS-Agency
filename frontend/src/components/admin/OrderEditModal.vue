<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  order: { type: Object, default: null },
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'save'])

const localOrder = ref(null)
const activeTab = ref('details')
const isSaving = ref(false)

const statusOptions = [
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification', color: '#f59e0b' },
  { value: 'PAYMENT_VERIFIED', label: 'Payment Verified', color: '#10b981' },
  { value: 'PROCESSING', label: 'Processing', color: '#3b82f6' },
  { value: 'SHIPPED', label: 'Shipped', color: '#8b5cf6' },
  { value: 'DELIVERED', label: 'Delivered', color: '#22c55e' },
  { value: 'CANCELLED', label: 'Cancelled', color: '#ef4444' },
  { value: 'FAILED', label: 'Failed', color: '#ef4444' }
]

const tabs = [
  { key: 'details', label: 'Details', icon: 'info' },
  { key: 'items', label: 'Items', icon: 'package' },
  { key: 'shipping', label: 'Shipping', icon: 'truck' }
]

watch(() => props.order, (newOrder) => {
  if (newOrder) {
    localOrder.value = JSON.parse(JSON.stringify(newOrder))
    activeTab.value = 'details'
  }
}, { immediate: true })

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(price || 0)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function getStatusColor(status) {
  return statusOptions.find(s => s.value === status)?.color || '#6b7280'
}

async function saveChanges() {
  if (!localOrder.value) return
  isSaving.value = true
  try {
    emit('save', localOrder.value)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show && localOrder" class="modal-overlay">
      <div class="modal-backdrop" @click="emit('close')"></div>

      <div class="modal">
        <!-- Header -->
        <div class="modal__header">
          <div class="modal__header-left">
            <div class="modal__order-badge">
              <span class="modal__order-hash">#</span>{{ localOrder.orderNumber }}
            </div>
            <span class="modal__total">{{ formatPrice(localOrder.total) }}</span>
          </div>
          <button @click="emit('close')" class="modal__close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="modal__tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['modal__tab', { 'modal__tab--active': activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            <!-- Info icon -->
            <svg v-if="tab.icon === 'info'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <!-- Package icon -->
            <svg v-else-if="tab.icon === 'package'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            <!-- Truck icon -->
            <svg v-else-if="tab.icon === 'truck'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            
            <span class="modal__tab-label">{{ tab.label }}</span>
          </button>
        </div>

        <!-- Body -->
        <div class="modal__body">

          <!-- ---------- Details Tab ---------- -->
          <div v-show="activeTab === 'details'" class="tab-content">
            <!-- Status -->
            <div class="detail-card">
              <h4 class="detail-card__title">Order Status</h4>
              <div class="status-select-wrap">
                <span class="status-dot" :style="{ background: getStatusColor(localOrder.status) }"></span>
                <select v-model="localOrder.status" class="status-select">
                  <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Customer -->
            <div class="detail-card">
              <h4 class="detail-card__title">Customer</h4>
              <div class="detail-rows">
                <div class="detail-row">
                  <span class="detail-row__label">Name</span>
                  <span class="detail-row__value">{{ localOrder.shippingName }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-row__label">Email</span>
                  <span class="detail-row__value">{{ localOrder.shippingEmail }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-row__label">Phone</span>
                  <span class="detail-row__value">{{ localOrder.shippingPhone }}</span>
                </div>
              </div>
            </div>

            <!-- Payment -->
            <div class="detail-card">
              <h4 class="detail-card__title">Payment</h4>
              <div class="detail-rows">
                <div class="detail-row">
                  <span class="detail-row__label">Method</span>
                  <span class="detail-row__value">{{ localOrder.paymentMethod || 'UPI' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-row__label">UTR / Ref</span>
                  <span class="detail-row__value detail-row__value--mono">{{ localOrder.utrNumber || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-row__label">Created</span>
                  <span class="detail-row__value">{{ formatDate(localOrder.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="detail-card">
              <h4 class="detail-card__title">Internal Notes</h4>
              <textarea
                v-model="localOrder.adminNotes"
                class="notes-input"
                rows="3"
                placeholder="Add internal notes..."
              ></textarea>
            </div>
          </div>

          <!-- ---------- Items Tab ---------- -->
          <div v-show="activeTab === 'items'" class="tab-content">
            <div v-if="localOrder.items?.length" class="items-list">
              <div v-for="(item, index) in localOrder.items" :key="index" class="item-card">
                <div class="item-card__img">
                  <img v-if="item.image" :src="item.image" :alt="item.name" />
                  <div v-else class="item-card__no-img">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                </div>
                <div class="item-card__info">
                  <p class="item-card__name">{{ item.name }}</p>
                  <p class="item-card__meta">Qty: {{ item.quantity }} × {{ formatPrice(item.price) }}</p>
                </div>
                <span class="item-card__total">{{ formatPrice(item.price * item.quantity) }}</span>
              </div>
            </div>
            <div v-else class="items-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              <p>No items in this order</p>
            </div>

            <!-- Order Summary -->
            <div class="order-summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>{{ formatPrice(localOrder.subtotal || localOrder.total) }}</span>
              </div>
              <div v-if="localOrder.shippingFee" class="summary-row">
                <span>Shipping</span>
                <span>{{ formatPrice(localOrder.shippingFee) }}</span>
              </div>
              <div class="summary-row summary-row--total">
                <span>Total</span>
                <span>{{ formatPrice(localOrder.total) }}</span>
              </div>
            </div>
          </div>

          <!-- ---------- Shipping Tab ---------- -->
          <div v-show="activeTab === 'shipping'" class="tab-content">
            <div class="detail-card">
              <h4 class="detail-card__title">Shipping Address</h4>
              <div class="address-block">
                <p class="address-block__name">{{ localOrder.shippingName }}</p>
                <p>{{ localOrder.shippingAddress }}</p>
                <p>{{ localOrder.shippingCity }}, {{ localOrder.shippingState }} {{ localOrder.shippingPincode }}</p>
                <p v-if="localOrder.shippingPhone">📞 {{ localOrder.shippingPhone }}</p>
              </div>
            </div>

            <div class="detail-card">
              <h4 class="detail-card__title">Tracking</h4>
              <div class="form-field-modal">
                <label class="form-label-sm">Tracking Number</label>
                <input v-model="localOrder.trackingNumber" type="text" class="form-input-modal" placeholder="Enter tracking number" />
              </div>
              <div class="form-field-modal">
                <label class="form-label-sm">Courier Service</label>
                <input v-model="localOrder.courierService" type="text" class="form-input-modal" placeholder="e.g. India Post, BlueDart" />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal__footer">
          <button class="modal__save" :disabled="isSaving" @click="saveChanges">
            <span v-if="isSaving" class="modal__save-spinner"></span>
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button class="modal__cancel" @click="emit('close')">Cancel</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ----- Modal Transitions ----- */
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(20px);
}

/* ----- Overlay ----- */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (min-width: 768px) {
  .modal-overlay {
    align-items: center;
    padding: 1.5rem;
  }
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}

/* ----- Modal ----- */
.modal {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 92vh;
  background: #111218;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .modal {
    height: auto;
    max-height: 85vh;
    max-width: 560px;
    border-radius: 20px;
  }
}

/* ----- Header ----- */
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.modal__header-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.modal__order-badge {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  color: #f0f1f3;
}

.modal__order-hash {
  color: #4b5563;
}

.modal__total {
  font-weight: 700;
  font-size: 0.85rem;
  color: #10b981;
  padding: 0.2rem 0.625rem;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 999px;
}

.modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

.modal__close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

/* ----- Tabs ----- */
.modal__tabs {
  display: flex;
  gap: 0;
  padding: 0 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.modal__tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.875rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.modal__tab:hover {
  color: #d1d5db;
}

.modal__tab--active {
  color: #10b981;
  border-bottom-color: #10b981;
}

.modal__tab-label {
  display: none;
}

@media (min-width: 400px) {
  .modal__tab-label { display: inline; }
}

/* ----- Body ----- */
.modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Detail Cards */
.detail-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
}

.detail-card__title {
  font-size: 0.68rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 0.75rem;
}

.detail-rows {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-row__label {
  font-size: 0.85rem;
  color: #6b7280;
}

.detail-row__value {
  font-weight: 600;
  color: #e5e7eb;
  font-size: 0.85rem;
  text-align: right;
}

.detail-row__value--mono {
  font-family: 'JetBrains Mono', monospace, monospace;
  font-size: 0.8rem;
}

/* Status Select */
.status-select-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.2s;
}

.status-select {
  flex: 1;
  padding: 0.65rem 0.875rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #e5e7eb;
  font-size: 0.875rem;
  outline: none;
  cursor: pointer;
  appearance: none;
  box-sizing: border-box;
}

.status-select:focus {
  border-color: #10b981;
}

.status-select option {
  background: #1a1b22;
  color: #e5e7eb;
}

/* Notes Input */
.notes-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #f0f1f3;
  font-size: 0.875rem;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.notes-input::placeholder { color: #374151; }
.notes-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.12);
}

/* Items */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.item-card__img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.04);
}

.item-card__img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-card__no-img {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
}

.item-card__info {
  flex: 1;
  min-width: 0;
}

.item-card__name {
  font-weight: 600;
  color: #e5e7eb;
  font-size: 0.875rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-card__meta {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.125rem 0 0;
}

.item-card__total {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  color: #f0f1f3;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.items-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 2rem;
  color: #4b5563;
  text-align: center;
  gap: 0.5rem;
}

.items-empty p {
  margin: 0;
  font-size: 0.85rem;
}

/* Order Summary */
.order-summary {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  font-size: 0.85rem;
  color: #9ca3af;
}

.summary-row--total {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-weight: 700;
  font-size: 1rem;
  color: #f0f1f3;
}

/* Address */
.address-block {
  font-size: 0.85rem;
  line-height: 1.6;
  color: #d1d5db;
}

.address-block p {
  margin: 0;
}

.address-block__name {
  font-weight: 700;
  color: #f0f1f3;
  margin-bottom: 0.25rem !important;
}

/* Form */
.form-field-modal {
  margin-top: 0.75rem;
}

.form-label-sm {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.375rem;
}

.form-input-modal {
  width: 100%;
  padding: 0.65rem 0.875rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #f0f1f3;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input-modal::placeholder { color: #374151; }
.form-input-modal:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.12);
}

/* ----- Footer ----- */
.modal__footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(17, 18, 24, 0.95);
}

.modal__save {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.modal__save:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
}

.modal__save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal__save-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.modal__cancel {
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #9ca3af;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.modal__cancel:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}
</style>
