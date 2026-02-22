<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  analytics: {
    type: Object,
    required: true
  }
})

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price || 0)
}

const statsCards = [
  { key: 'totalOrders', label: 'Total Orders', accent: '#6366f1', icon: 'M16.5 9.4L7.55 4.24 M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12' },
  { key: 'pendingVerification', label: 'Pending', accent: '#f59e0b', icon: 'M12 22c5.522 0 10-4.477 10-10S17.522 2 12 2 2 6.477 2 12s4.478 10 10 10z M12 6v6l4 2' },
  { key: 'ordersToday', label: "Today's Orders", accent: '#8b5cf6', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { key: 'verifiedRevenue', label: 'Revenue', accent: '#10b981', icon: 'M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6', isPrice: true },
]

const orderStatuses = [
  { key: 'paymentVerified', label: 'Verified',   color: '#10b981' },
  { key: 'processing',      label: 'Processing', color: '#3b82f6' },
  { key: 'shipped',         label: 'Shipped',    color: '#8b5cf6' },
  { key: 'delivered',       label: 'Delivered',  color: '#22c55e' },
  { key: 'cancelled',       label: 'Cancelled',  color: '#ef4444' },
]

const timelineCards = [
  { key: 'ordersToday', label: 'Today', icon: 'M12 22c5.522 0 10-4.477 10-10S17.522 2 12 2 2 6.477 2 12s4.478 10 10 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42' },
  { key: 'ordersWeek',  label: 'This Week', icon: 'M3 4h18v18H3V4z M16 2v4 M8 2v4 M3 10h18' },
  { key: 'ordersMonth', label: 'This Month', icon: 'M3 4h18v18H3V4z M16 2v4 M8 2v4 M3 10h18 M8 14h.01 M12 14h.01 M16 14h.01' },
]
</script>

<template>
  <div class="analytics-dashboard animate-fade-in">

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
      <div
        v-for="(stat, index) in statsCards"
        :key="stat.key"
        class="group relative bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-[2rem] p-6 lg:p-8 overflow-hidden transition-all duration-500 hover:border-slate-300 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)]"
        :style="{ animationDelay: `${index * 80}ms` }"
      >
        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" :style="`background: radial-gradient(circle at 100% 100%, ${stat.accent}15, transparent 60%)`"></div>
        <div class="flex items-center gap-4 mb-5">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110" :style="`background: ${stat.accent}15; color: ${stat.accent}; border-color: ${stat.accent}30;`">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path :d="stat.icon"/></svg>
          </div>
          <span class="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest">{{ stat.label }}</span>
        </div>
        <div class="relative z-10">
          <p class="font-outfit font-extrabold text-3xl md:text-4xl tracking-tight" :class="stat.isPrice ? 'text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-emerald-700' : 'text-slate-800'">
            {{ stat.isPrice ? formatPrice(analytics[stat.key]) : (analytics[stat.key] || 0) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Details Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

      <!-- Order Pipeline -->
      <div class="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-[2rem] p-6 md:p-8 flex flex-col group hover:border-slate-300 hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] transition-all">
        <div class="flex items-center gap-3 mb-8">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]"></span>
          <h4 class="font-outfit font-bold text-lg text-slate-800 tracking-tight">Order Pipeline</h4>
        </div>
        <div class="space-y-3 flex-1">
          <div v-for="s in orderStatuses" :key="s.key" class="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 group/item">
            <div class="flex items-center gap-3">
              <span class="w-2 h-2 rounded-full ring-2 ring-offset-2 ring-offset-white transition-all group-hover/item:scale-110" :style="`background: ${s.color}; ring-color: ${s.color}40`"></span>
              <span class="text-sm font-semibold text-slate-600 tracking-wide">{{ s.label }}</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="font-bold text-sm text-slate-800">{{ analytics[s.key] || 0 }}</span>
              <div class="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden shadow-inner hidden sm:block">
                <div class="h-full rounded-full transition-all duration-1000 ease-out" 
                     :style="`width: ${analytics.totalOrders ? Math.max(((analytics[s.key] || 0) / analytics.totalOrders) * 100, 2) : 2}%; background: ${s.color}`">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div class="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-[2rem] p-6 md:p-8 flex flex-col group hover:border-slate-300 hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none transition-all group-hover:bg-purple-500/20"></div>
        <div class="flex items-center gap-3 mb-8 relative z-10">
          <span class="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]"></span>
          <h4 class="font-outfit font-bold text-lg text-slate-800 tracking-tight">Timeline Analytics</h4>
        </div>
        <div class="space-y-4 flex-1 relative z-10">
          <div v-for="tc in timelineCards" :key="tc.key" class="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 hover:bg-white transition-colors">
            <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path :d="tc.icon"/></svg>
            </div>
            <div>
              <span class="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest block">{{ tc.label }}</span>
              <span class="font-outfit font-bold text-lg text-slate-800 block mt-0.5">{{ analytics[tc.key] || 0 }} orders</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue Summary -->
      <div class="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-[2rem] p-6 md:p-8 flex flex-col relative overflow-hidden group hover:border-emerald-300 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-500">
        <div class="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-emerald-500/15 transition-colors duration-700"></div>
        
        <div class="flex items-center gap-3 mb-8 relative z-10">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></span>
          <h4 class="font-outfit font-bold text-lg text-slate-800 tracking-tight">Revenue Summary</h4>
        </div>
        
        <div class="flex-1 flex flex-col justify-center relative z-10">
          <div class="text-center p-6 rounded-3xl bg-emerald-50/80 border border-emerald-100 mb-6 backdrop-blur-sm shadow-sm transition-transform duration-500 group-hover:scale-[1.02]">
            <span class="text-xs font-bold text-emerald-700/70 uppercase tracking-widest block mb-2">Verified Revenue</span>
            <span class="font-outfit font-black text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-emerald-800">{{ formatPrice(analytics.verifiedRevenue) }}</span>
          </div>
          
          <div class="flex items-center my-2 opacity-50 px-10">
            <div class="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          </div>
          
          <div class="text-center p-6">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Completed Revenue</span>
            <span class="font-outfit font-bold text-2xl text-slate-700">{{ formatPrice(analytics.completedRevenue) }}</span>
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

.stats-card {
  animation: cardPop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes cardPop {
  from { opacity: 0; transform: scale(0.96) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
