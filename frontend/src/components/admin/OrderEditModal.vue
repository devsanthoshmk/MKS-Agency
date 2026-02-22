<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  order: Object,
  show: Boolean
})

const emit = defineEmits(['close', 'save', 'update-status'])

const editingOrder = ref(null)

const statusOptions = [
  { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
  { value: 'PAYMENT_VERIFIED', label: 'Payment Verified' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'FAILED', label: 'Failed' }
]

watch(() => props.order, (newVal) => {
  if (newVal) {
    const clone = JSON.parse(JSON.stringify(newVal))
    // Normalize item field names so v-model binds work consistently
    if (clone.items) {
      clone.items = clone.items.map(item => ({
        ...item,
        name: item.productName || item.name || '',
        price: Number(item.productPrice ?? item.price ?? 0),
        image: item.productImage || item.image || '',
        quantity: Number(item.quantity) || 1,
      }))
    }
    // Normalize shipping fields
    if (clone.shippingFee !== undefined && clone.shippingCost === undefined) {
      clone.shippingCost = clone.shippingFee
    }
    if (clone.shippingPostal !== undefined && clone.shippingZip === undefined) {
      clone.shippingZip = clone.shippingPostal
    }
    if (!clone.discount) clone.discount = 0
    if (!clone.shippingCost) clone.shippingCost = 0
    editingOrder.value = clone
  } else {
    editingOrder.value = null
  }
})

// Auto-calculate subtotal and total from items
const calculatedSubtotal = computed(() => {
  if (!editingOrder.value?.items) return 0
  return editingOrder.value.items.reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0)
  }, 0)
})

const calculatedTotal = computed(() => {
  const sub = calculatedSubtotal.value
  const discount = Number(editingOrder.value?.discount) || 0
  const shipping = Number(editingOrder.value?.shippingCost) || 0
  return sub - discount + shipping
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

function save() {
  // Write calculated values back before emitting
  if (editingOrder.value) {
    editingOrder.value.subtotal = calculatedSubtotal.value
    editingOrder.value.total = calculatedTotal.value
    // Write back normalized fields to DB field names
    editingOrder.value.shippingFee = editingOrder.value.shippingCost
    editingOrder.value.shippingPostal = editingOrder.value.shippingZip
    if (editingOrder.value.items) {
      editingOrder.value.items = editingOrder.value.items.map(item => ({
        ...item,
        productName: item.name,
        productPrice: Number(item.price) || 0,
        productImage: item.image || undefined,
      }))
    }
  }
  emit('save', editingOrder.value)
}

function updateStatus(status) {
   emit('update-status', { orderId: editingOrder.value._id || editingOrder.value.id, status })
}

function removeItem(index) {
  editingOrder.value.items.splice(index, 1)
}

</script>

<template>
  <Transition name="modal">
    <div v-if="show && editingOrder" class="modal-backdrop" @click="emit('close')">
      <div class="modal-container scroll-hidden" @click.stop>
        
        <div class="modal-header">
          <div class="flex items-center gap-4">
             <div class="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
             </div>
             <div>
                <h3 class="text-xl font-outfit font-extrabold text-slate-800 tracking-tight">Order #{{ editingOrder.orderNumber }}</h3>
                <p class="text-sm text-slate-500 font-medium">{{ formatDate(editingOrder.createdAt) }}</p>
             </div>
          </div>
          <button class="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shadow-sm" @click="emit('close')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <!-- Left Column: Order Info -->
            <div class="space-y-6 flex flex-col">
              
              <!-- Quick Status Update -->
              <div class="glass-card rounded-2xl p-5 border border-slate-200 shadow-sm relative z-20">
                <h4 class="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-4">Pipeline Status</h4>
                <div class="relative">
                  <select v-model="editingOrder.status" @change="updateStatus(editingOrder.status)" class="w-full appearance-none bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl px-4 py-3.5 text-slate-800 font-bold outline-none transition-all hover:bg-white cursor-pointer shadow-sm">
                    <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

               <!-- Customer Details (Editable) -->
              <div class="glass-card rounded-2xl p-5 border border-slate-200 shadow-sm">
                <h4 class="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-4">Customer</h4>
                
                <div class="space-y-3 relative z-10">
                  <!-- Name & Email -->
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-2 text-slate-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                    <div class="flex-1 min-w-0 space-y-1.5">
                      <input v-model="editingOrder.shippingName" type="text" class="edit-field font-bold" placeholder="Full Name" />
                      <input v-model="editingOrder.shippingEmail" type="email" class="edit-field text-emerald-600" placeholder="Email Address" />
                    </div>
                  </div>
                  
                  <!-- Phone -->
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-2 text-slate-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                    <input v-model="editingOrder.shippingPhone" type="tel" class="edit-field flex-1" placeholder="Phone Number" />
                  </div>

                  <!-- Address -->
                  <div class="flex items-start gap-3">
                     <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-2 text-slate-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                     <div class="flex-1 space-y-1.5">
                        <input v-model="editingOrder.shippingAddress" type="text" class="edit-field" placeholder="Street Address" />
                        <div class="grid grid-cols-2 gap-1.5">
                          <input v-model="editingOrder.shippingCity" type="text" class="edit-field" placeholder="City" />
                          <input v-model="editingOrder.shippingState" type="text" class="edit-field" placeholder="State" />
                        </div>
                        <div class="grid grid-cols-2 gap-1.5">
                          <input v-model="editingOrder.shippingZip" type="text" class="edit-field" placeholder="Postal Code" />
                          <input v-model="editingOrder.shippingCountry" type="text" class="edit-field" placeholder="Country" />
                        </div>
                     </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Right Column: Line Items & Totals -->
            <div class="space-y-6 flex flex-col relative z-10">
              
              <!-- Items (Editable) -->
               <div class="glass-card rounded-2xl p-5 border border-slate-200 shadow-sm flex-1 flex flex-col relative">
                 <h4 class="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-4">Order Items ({{ editingOrder.items?.length || 0 }})</h4>
                 
                 <div class="space-y-4 pr-2 max-h-[300px] overflow-y-auto custom-scrollbar flex-1 relative z-20">
                    <div v-for="(item, idx) in editingOrder.items" :key="item._id || idx" class="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors shadow-sm group">
                      <!-- Image -->
                      <div class="w-14 h-14 rounded-lg bg-white overflow-hidden shrink-0 border border-slate-200">
                        <img v-if="item.image" :src="item.image" :alt="item.name" class="w-full h-full object-cover" />
                        <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                      </div>
                      <!-- Details -->
                      <div class="flex-1 min-w-0 flex flex-col justify-center gap-1">
                        <input v-model="item.name" type="text" class="font-bold text-slate-800 text-sm bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 outline-none w-full transition-colors py-0.5" placeholder="Product Name" />
                        <div class="flex items-center gap-2 mt-0.5">
                           <div class="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 shadow-sm">
                              <span class="text-[0.65rem] text-slate-400 font-bold">QTY</span>
                              <input v-model.number="item.quantity" type="number" min="1" class="text-xs font-bold text-slate-800 bg-transparent w-7 outline-none text-center" />
                           </div>
                           <span class="text-slate-300">×</span>
                           <div class="flex items-center">
                              <span class="text-xs font-bold text-emerald-600">₹</span>
                              <input v-model.number="item.price" type="number" min="0" step="1" class="font-outfit font-black text-emerald-600 text-sm bg-transparent border-b border-transparent hover:border-emerald-200 focus:border-emerald-500 outline-none text-right w-16 transition-colors" placeholder="0" />
                           </div>
                           <span class="text-xs text-slate-400 ml-auto font-bold">= {{ formatPrice((item.price || 0) * (item.quantity || 0)) }}</span>
                        </div>
                      </div>
                      <!-- Remove button -->
                      <button @click="removeItem(idx)" class="w-6 h-6 rounded-full bg-transparent hover:bg-rose-50 flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0 self-center" title="Remove item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                 </div>

                 <!-- Totals Footer (Auto-calculated) -->
                 <div class="mt-6 pt-5 border-t border-slate-200 space-y-3 relative z-20">
                   <div class="flex justify-between text-sm">
                     <span class="text-slate-500 font-bold">Subtotal</span>
                     <span class="text-slate-700 font-bold">{{ formatPrice(calculatedSubtotal) }}</span>
                   </div>
                   <div class="flex justify-between text-sm items-center">
                     <span class="text-slate-500 font-bold">Discount</span>
                     <div class="flex items-center">
                       <span class="text-xs font-bold text-emerald-500 mr-0.5">-₹</span>
                       <input v-model.number="editingOrder.discount" type="number" min="0" class="text-emerald-500 font-bold bg-transparent border-b border-transparent hover:border-emerald-200 focus:border-emerald-500 outline-none text-right w-20 transition-colors text-sm" />
                     </div>
                   </div>
                   <div class="flex justify-between text-sm items-center">
                     <span class="text-slate-500 font-bold">Shipping</span>
                     <div class="flex items-center">
                       <span class="text-xs font-bold text-slate-500 mr-0.5">₹</span>
                       <input v-model.number="editingOrder.shippingCost" type="number" min="0" class="text-slate-700 font-bold bg-transparent border-b border-transparent hover:border-slate-200 focus:border-emerald-500 outline-none text-right w-20 transition-colors text-sm" />
                     </div>
                   </div>
                    <div class="flex justify-between items-center pt-3 border-t border-slate-200 mt-3">
                     <span class="text-slate-800 font-black">Total</span>
                     <span class="font-outfit text-2xl font-black text-slate-800 drop-shadow-sm">{{ formatPrice(calculatedTotal) }}</span>
                   </div>
                 </div>
               </div>
            </div>
          </div>
          
           <!-- Courier Tracking (Optional Full-width) -->
           <div class="glass-card rounded-2xl p-5 border border-emerald-200 mt-6 bg-emerald-50 shadow-sm relative z-20">
               <h4 class="text-sm font-extrabold text-emerald-700 uppercase tracking-widest mb-4">Courier & Tracking</h4>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-emerald-600 mb-2 pl-1">Courier Partner</label>
                    <input v-model="editingOrder.courierName" type="text" placeholder="e.g., BlueDart, Delhivery" class="w-full bg-white border border-emerald-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-4 py-3 text-slate-800 font-medium text-sm outline-none transition-all placeholder:text-slate-300 shadow-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-emerald-600 mb-2 pl-1">Tracking Number</label>
                    <input v-model="editingOrder.trackingNumber" type="text" placeholder="AWB Number" class="w-full bg-white border border-emerald-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-4 py-3 text-slate-800 font-medium text-sm outline-none transition-all placeholder:text-slate-300 shadow-sm" />
                  </div>
               </div>
           </div>

        </div>

        <div class="modal-footer">
          <button class="px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-sm transition-colors shadow-sm" @click="emit('close')">Cancel</button>
          <button class="px-8 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-sm shadow-sm hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all w-full sm:w-auto relative overflow-hidden group" @click="save">
            <div class="absolute inset-0 bg-emerald-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span class="relative">Save Details</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Reusable edit field style */
.edit-field {
  width: 100%;
  background: rgba(248, 250, 252, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 0.5rem;
  padding: 0.4rem 0.65rem;
  font-size: 0.8125rem;
  color: #1e293b;
  font-weight: 500;
  outline: none;
  transition: all 0.2s ease;
}
.edit-field::placeholder { color: #94a3b8; }
.edit-field:hover { background: #ffffff; border-color: #cbd5e1; }
.edit-field:focus { background: #ffffff; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.08); }

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal-container {
  background: #ffffff;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.modal-container::before {
   content: '';
   position: absolute;
   top: 0;
   left: 0;
   right: 0;
   height: 200px;
   background: radial-gradient(ellipse at top, rgba(16, 185, 129, 0.05), transparent 70%);
   pointer-events: none;
   z-index: 0;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 10;
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
  background: #ffffff;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(10px);
}

.glass-card {
  background: #ffffff;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container {
  opacity: 0;
  transform: scale(0.96) translateY(20px);
}

.modal-leave-to .modal-container {
  opacity: 0;
  transform: scale(0.96) translateY(-20px);
}

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
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
