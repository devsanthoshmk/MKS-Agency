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
  { key: 'totalOrders', label: 'Total Orders', color: 'surface', icon: '📦' },
  { key: 'pendingVerification', label: 'Pending Verification', color: 'yellow', icon: '⏳' },
  { key: 'ordersToday', label: "Today's Orders", color: 'primary', icon: '📅' },
  { key: 'verifiedRevenue', label: 'Verified Revenue', color: 'green', icon: '💰', isPrice: true },
]
</script>

<template>
  <div class="analytics-dashboard">
    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div
        v-for="stat in statsCards"
        :key="stat.key"
        class="bg-white rounded-xl p-4 shadow-sm border border-surface-100 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-2xl">{{ stat.icon }}</span>
        </div>
        <p class="text-surface-500 text-sm">{{ stat.label }}</p>
        <p :class="[
          'text-2xl font-bold',
          stat.color === 'yellow' ? 'text-yellow-600' :
          stat.color === 'green' ? 'text-green-600' :
          stat.color === 'primary' ? 'text-primary-600' :
          'text-surface-900'
        ]">
          {{ stat.isPrice ? formatPrice(analytics[stat.key]) : (analytics[stat.key] || 0) }}
        </p>
      </div>
    </div>

    <!-- Extended Stats -->
    <div class="grid md:grid-cols-3 gap-4">
      <!-- Order Status Breakdown -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-100">
        <h4 class="font-semibold text-surface-900 mb-3">Order Status</h4>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-surface-600">Payment Verified</span>
            <span class="font-medium text-green-600">{{ analytics.paymentVerified || 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-surface-600">Processing</span>
            <span class="font-medium text-blue-600">{{ analytics.processing || 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-surface-600">Shipped</span>
            <span class="font-medium text-primary-600">{{ analytics.shipped || 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-surface-600">Delivered</span>
            <span class="font-medium text-green-600">{{ analytics.delivered || 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-surface-600">Cancelled</span>
            <span class="font-medium text-red-600">{{ analytics.cancelled || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Time Period Stats -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-100">
        <h4 class="font-semibold text-surface-900 mb-3">Order Timeline</h4>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-surface-600">Today</span>
            <span class="font-medium">{{ analytics.ordersToday || 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-surface-600">This Week</span>
            <span class="font-medium">{{ analytics.ordersWeek || 0 }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-surface-600">This Month</span>
            <span class="font-medium">{{ analytics.ordersMonth || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Revenue Stats -->
      <div class="bg-white rounded-xl p-4 shadow-sm border border-surface-100">
        <h4 class="font-semibold text-surface-900 mb-3">Revenue</h4>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-surface-600">Verified</span>
            <span class="font-medium text-green-600">{{ formatPrice(analytics.verifiedRevenue) }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-surface-600">Completed</span>
            <span class="font-medium text-green-600">{{ formatPrice(analytics.completedRevenue) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
