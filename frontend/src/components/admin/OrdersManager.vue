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
const dateSort = ref('newest') // newest, oldest

// Status options for Light Theme
const statusOptions = [
  { value: 'PENDING_VERIFICATION', label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { value: 'PAYMENT_VERIFIED', label: 'Verified', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { value: 'PROCESSING', label: 'Processing', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { value: 'SHIPPED', label: 'Shipped', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { value: 'DELIVERED', label: 'Delivered', color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10', border: 'border-[#d4af37]/30' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  { value: 'FAILED', label: 'Failed', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' }
]

// Filtered and Sorted orders
const filteredOrders = computed(() => {
  let result = [...props.orders]

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

  // Sort by date
  result.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    if (dateSort.value === 'newest') return dateB - dateA
    return dateA - dateB
  })

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
  return statusOptions.find(s => s.value === status) || { label: status, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' }
}

function selectOrder(order) {
  emit('select-order', order)
}
</script>

<template>
  <div class="h-full flex flex-col mx-auto animate-fade-in relative z-10 w-full overflow-hidden max-w-[1600px]">
    
    <!-- Header & Controls -->
    <div class="mb-8 flex-shrink-0">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h2 class="text-3xl font-outfit font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            Order Registry
            <div class="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold font-inter text-emerald-600 tracking-widest shadow-sm">
              {{ props.orders.length }}
            </div>
          </h2>
          <p class="text-slate-500 text-[0.85rem] mt-2 max-w-md leading-relaxed tracking-wide">Monitor fulfillment pipelines, verify payments, and manage customer dispatch logistics.</p>
        </div>
        <div>
          <button @click="emit('refresh')" class="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 hover:border-emerald-200 flex items-center justify-center gap-2 transition-all duration-300 group shadow-sm" :disabled="isLoading">
            <svg :class="{ 'animate-spin text-emerald-500': isLoading, 'group-hover:rotate-180': !isLoading }" class="transition-all duration-700 ease-out text-slate-400 group-hover:text-emerald-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/></svg>
            <span class="text-sm font-semibold tracking-wide">Sync State</span>
          </button>
        </div>
      </div>

      <!-- Toolbar Light Panel -->
      <div class="bg-white/80 backdrop-blur-2xl rounded-3xl p-2 border border-slate-200/80 flex flex-col lg:flex-row shadow-[0_4px_25px_rgba(0,0,0,0.03)] relative overflow-hidden z-20">
        
        <!-- Search Input -->
        <div class="relative w-full lg:flex-1 group p-2">
          <svg class="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by tracing ID, client name, or email..."
            class="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-slate-800 text-[0.95rem] outline-none transition-all placeholder:text-slate-400 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>

        <div class="w-full lg:w-px h-px lg:h-12 bg-slate-200 mx-2 lg:my-auto"></div>

        <div class="flex flex-row w-full lg:w-auto p-2 gap-2">
          <!-- Status Filter -->
          <div class="relative w-1/2 lg:w-48 group">
            <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-hover:text-emerald-600 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <select v-model="statusFilter" class="w-full appearance-none bg-transparent border border-transparent rounded-2xl pl-4 pr-10 py-3 text-slate-600 text-[0.9rem] font-bold outline-none transition-all hover:bg-slate-50 focus:bg-white focus:border-emerald-500 cursor-pointer">
              <option value="all">All Pipelines</option>
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          
           <!-- Sort Dropdown -->
          <div class="relative w-1/2 lg:w-44 group border-l border-slate-200 pl-2">
            <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-hover:text-emerald-600 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            </div>
            <select v-model="dateSort" class="w-full appearance-none bg-transparent border border-transparent rounded-2xl pl-4 pr-10 py-3 text-slate-600 text-[0.9rem] font-bold outline-none transition-all hover:bg-slate-50 focus:bg-white focus:border-emerald-500 cursor-pointer">
               <option value="newest">Latest Dispatches</option>
               <option value="oldest">Oldest Dispatches</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 min-h-0 relative z-10 transition-all duration-500">
      
      <!-- Loading State -->
      <Transition name="fade">
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-md z-30 rounded-[2rem] border border-slate-200 overflow-hidden shadow-lg">
           <div class="flex flex-col items-center gap-6 relative z-10">
              <div class="relative w-16 h-16 flex items-center justify-center">
                <div class="absolute inset-0 border-[3px] border-emerald-100 rounded-full"></div>
                <div class="absolute inset-0 border-[3px] border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                <div class="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"></div>
              </div>
              <p class="text-emerald-600 font-bold tracking-widest text-xs uppercase animate-pulse">Synchronizing Grid...</p>
           </div>
        </div>
      </Transition>

      <!-- Empty State -->
      <Transition name="fade">
        <div v-if="!isLoading && filteredOrders.length === 0" class="bg-white/90 backdrop-blur-xl rounded-[2rem] h-full flex flex-col items-center justify-center p-12 text-center border border-slate-200 shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] relative overflow-hidden">
          
          <div class="w-24 h-24 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-8 relative">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="relative z-10"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </div>
          <h3 class="text-2xl font-outfit font-bold text-slate-800 mb-3">No active traces found</h3>
          <p class="text-slate-500 max-w-sm text-[0.95rem] leading-relaxed mb-8">We couldn't locate any order dispatches matching your current filter optics.</p>
          <button v-if="searchQuery || statusFilter !== 'all'" @click="searchQuery = ''; statusFilter = 'all'" class="px-8 py-3.5 rounded-2xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-bold text-sm tracking-wide transition-all border border-slate-200 hover:border-emerald-300 shadow-sm group">
            <span class="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="group-hover:rotate-90 transition-transform duration-300"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Clear Optics
            </span>
          </button>
        </div>
      </Transition>

      <!-- Orders List container -->
      <div v-show="!isLoading && filteredOrders.length > 0" class="h-full overflow-hidden flex flex-col bg-white border border-slate-200/80 rounded-[2rem] shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] relative">
        
        <!-- Table Header Dropdown (Hidden on Mobile) -->
        <div class="hidden lg:block relative z-20 shrink-0 border-b border-slate-100 bg-slate-50/50">
          <details class="group">
            <summary class="flex items-center justify-center lg:justify-start gap-2 px-8 py-4 cursor-pointer list-none text-[0.65rem] font-extrabold text-slate-500 uppercase tracking-widest hover:text-emerald-600 transition-colors outline-none select-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="group-open:-rotate-180 transition-transform duration-300 text-slate-400 group-hover:text-emerald-400"><path d="m6 9 6 6 6-6"/></svg>
              <span>Toggle Grid Columns</span>
            </summary>
            <div class="grid grid-cols-[1.5fr,2.5fr,1.5fr,1fr,1.5fr] gap-6 px-8 pb-6 pt-2 text-[0.7rem] font-bold text-slate-400 uppercase tracking-[0.1em]">
              <div>Trace Details</div>
              <div>Recipient & Location</div>
              <div>Status Signal</div>
              <div>Value</div>
              <div class="text-right">Dispatch Date</div>
            </div>
          </details>
        </div>

        <!-- Scrollable List -->
        <div class="flex-1 overflow-y-auto custom-scrollbar relative z-10 w-full p-4 lg:p-0">
          <!-- We use flex container wrapped properly to avoid bottom layout bugs -->
          <div class="flex flex-col w-full m-0 p-0 justify-start h-max pb-8">
            <TransitionGroup name="list" tag="div" appear class="space-y-3 lg:space-y-0 flex-1 h-full w-full">
              <!-- Order Item -->
              <div 
                v-for="order in filteredOrders" 
                :key="order._id || order.id"
                @click="selectOrder(order)"
                class="group relative bg-slate-50 lg:bg-transparent rounded-2xl lg:rounded-none border border-slate-200 lg:border-x-0 lg:border-t-0 lg:border-b-slate-100 p-5 lg:px-8 lg:py-4 cursor-pointer hover:bg-slate-50/70 transition-colors duration-300 lg:grid lg:grid-cols-[1.5fr,2.5fr,1.5fr,1fr,1.5fr] lg:gap-6 lg:items-center overflow-hidden w-full flex-shrink-0"
              >
                <!-- 1. Order ID (Mobile Top Row) -->
                 <div class="flex justify-between items-start lg:block mb-4 lg:mb-0 relative z-10 w-full">
                    <div class="flex items-center gap-4">
                      <!-- Mobile Tag Icon -->
                      <div class="lg:hidden w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                         <svg class="text-emerald-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                      </div>
                      <div class="min-w-0">
                        <div class="font-jetbrains text-[13px] font-bold text-slate-800 tracking-widest mb-1 transition-colors">
                          <span class="group-hover:text-emerald-600 transition-colors truncate">#{{ order.orderNumber }}</span>
                        </div>
                        <div class="lg:hidden text-lg font-outfit font-extrabold text-slate-900 tracking-wide">
                          {{ formatPrice(order.total) }}
                        </div>
                      </div>
                    </div>
                    <!-- Mobile Badge -->
                    <div class="lg:hidden pt-1 shrink-0 ml-2">
                      <span 
                        class="px-2.5 py-1.5 rounded-full text-[0.6rem] font-bold uppercase tracking-widest border whitespace-nowrap"
                        :class="[getStatusInfo(order.status).color, getStatusInfo(order.status).bg, getStatusInfo(order.status).border]"
                      >
                        {{ getStatusInfo(order.status).label }}
                      </span>
                    </div>
                 </div>

                <!-- 2. Customer Info -->
                <div class="flex items-center gap-3 mb-5 lg:mb-0 lg:bg-transparent rounded-xl lg:rounded-none relative z-10 min-w-0">
                  <div class="w-9 h-9 hidden lg:flex rounded-full bg-slate-100 border border-slate-200 items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors">
                     <svg class="text-slate-500 group-hover:text-emerald-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-[0.95rem] text-slate-800 truncate tracking-wide">{{ order.shippingName }}</p>
                    <p class="text-[0.75rem] text-slate-500 truncate tracking-wide">{{ order.shippingEmail }}</p>
                  </div>
                </div>

                <!-- 3. Status (Desktop) -->
                <div class="hidden lg:flex items-center relative z-10">
                   <span 
                      class="px-3 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-widest border flex items-center gap-2"
                      :class="[getStatusInfo(order.status).color, getStatusInfo(order.status).bg, getStatusInfo(order.status).border]"
                    >
                     <span class="w-1.5 h-1.5 rounded-full fill-current" :class="[getStatusInfo(order.status).bg.replace('50', '500')]"></span>
                      {{ getStatusInfo(order.status).label }}
                    </span>
                </div>

                <!-- 4. Total (Desktop) -->
                <div class="hidden lg:block relative z-10">
                   <span class="font-outfit font-bold text-[1.1rem] text-slate-800 tracking-wide">{{ formatPrice(order.total) }}</span>
                </div>

                <!-- 5. Date & Action -->
                <div class="flex justify-between items-center lg:justify-end relative z-10 w-full h-full min-h-[40px]">
                  <!-- Mobile Date -->
                  <span class="lg:hidden text-xs text-slate-500 font-medium tracking-wide">{{ formatDate(order.createdAt) }}</span>
                  
                  <!-- Desktop Date Container (Fades out on hover) -->
                  <div class="hidden lg:flex items-center justify-end absolute inset-0 right-4 transition-all duration-300 opacity-100 group-hover:opacity-0 group-hover:-translate-x-4">
                    <span class="text-[0.85rem] text-slate-500 font-medium tracking-wide">
                      {{ formatDate(order.createdAt) }}
                    </span>
                  </div>

                  <!-- Desktop Action Button (Fades in on hover) -->
                  <div class="hidden lg:flex absolute inset-0 right-4 items-center justify-end transition-all duration-300 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0">
                    <button class="flex items-center justify-center gap-1.5 px-5 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 rounded-lg transition-all duration-300 font-bold text-xs tracking-widest uppercase shadow-sm whitespace-nowrap">
                      Inspect
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </button>
                  </div>

                  <!-- Mobile Action Button (Always visible) -->
                  <button class="lg:hidden flex items-center justify-center gap-2 px-6 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-lg font-bold text-xs tracking-widest uppercase shadow-sm">
                    Inspect
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

/* List Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
.list-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
.list-leave-active {
  position: absolute;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.2);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(148, 163, 184, 0.4);
}
</style>
