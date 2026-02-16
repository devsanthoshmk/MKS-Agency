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
  { key: 'totalOrders', label: 'Total Orders', accent: '#6366f1', icon: 'package' },
  { key: 'pendingVerification', label: 'Pending', accent: '#f59e0b', icon: 'clock' },
  { key: 'ordersToday', label: "Today's Orders", accent: '#8b5cf6', icon: 'zap' },
  { key: 'verifiedRevenue', label: 'Revenue', accent: '#10b981', icon: 'trending-up', isPrice: true },
]

const orderStatuses = [
  { key: 'paymentVerified', label: 'Verified',   color: '#10b981' },
  { key: 'processing',      label: 'Processing', color: '#3b82f6' },
  { key: 'shipped',         label: 'Shipped',    color: '#8b5cf6' },
  { key: 'delivered',       label: 'Delivered',  color: '#22c55e' },
  { key: 'cancelled',       label: 'Cancelled',  color: '#ef4444' },
]

const timelineCards = [
  { key: 'ordersToday', label: 'Today', icon: 'sun' },
  { key: 'ordersWeek',  label: 'This Week', icon: 'calendar' },
  { key: 'ordersMonth', label: 'This Month', icon: 'calendar-range' },
]
</script>

<template>
  <div class="analytics">

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div
        v-for="(stat, index) in statsCards"
        :key="stat.key"
        class="stat-card"
        :style="{ '--accent': stat.accent, animationDelay: `${index * 80}ms` }"
      >
        <div class="stat-card__header">
          <div class="stat-card__icon">
            <!-- Package -->
            <svg v-if="stat.icon === 'package'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            <!-- Clock -->
            <svg v-else-if="stat.icon === 'clock'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <!-- Zap -->
            <svg v-else-if="stat.icon === 'zap'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <!-- Trending Up -->
            <svg v-else-if="stat.icon === 'trending-up'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <span class="stat-card__label">{{ stat.label }}</span>
        </div>
        <p class="stat-card__value">
          {{ stat.isPrice ? formatPrice(analytics[stat.key]) : (analytics[stat.key] || 0) }}
        </p>
        <div class="stat-card__glow"></div>
      </div>
    </div>

    <!-- Three Column Section -->
    <div class="sections-grid">

      <!-- Order Status Breakdown -->
      <div class="section-card">
        <div class="section-card__header">
          <span class="section-card__dot" style="background: #3b82f6;"></span>
          <h4 class="section-card__title">Order Pipeline</h4>
        </div>
        <div class="status-list">
          <div v-for="s in orderStatuses" :key="s.key" class="status-row">
            <div class="status-row__left">
              <span class="status-row__dot" :style="{ background: s.color }"></span>
              <span class="status-row__label">{{ s.label }}</span>
            </div>
            <div class="status-row__right">
              <span class="status-row__value">{{ analytics[s.key] || 0 }}</span>
              <div class="status-row__bar">
                <div
                  class="status-row__fill"
                  :style="{
                    width: analytics.totalOrders ? `${Math.max(((analytics[s.key] || 0) / analytics.totalOrders) * 100, 2)}%` : '2%',
                    background: s.color
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Stats -->
      <div class="section-card">
        <div class="section-card__header">
          <span class="section-card__dot" style="background: #8b5cf6;"></span>
          <h4 class="section-card__title">Timeline</h4>
        </div>
        <div class="timeline-stack">
          <div v-for="tc in timelineCards" :key="tc.key" class="timeline-item">
            <div class="timeline-item__icon">
              <svg v-if="tc.icon === 'sun'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              <svg v-else-if="tc.icon === 'calendar'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/></svg>
            </div>
            <div class="timeline-item__info">
              <span class="timeline-item__label">{{ tc.label }}</span>
              <span class="timeline-item__value">{{ analytics[tc.key] || 0 }} orders</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue Stats -->
      <div class="section-card section-card--revenue">
        <div class="section-card__header">
          <span class="section-card__dot" style="background: #10b981;"></span>
          <h4 class="section-card__title">Revenue</h4>
        </div>
        <div class="revenue-stack">
          <div class="revenue-block">
            <span class="revenue-block__label">Verified Revenue</span>
            <span class="revenue-block__value">{{ formatPrice(analytics.verifiedRevenue) }}</span>
          </div>
          <div class="revenue-divider"></div>
          <div class="revenue-block">
            <span class="revenue-block__label">Completed Revenue</span>
            <span class="revenue-block__value revenue-block__value--highlight">{{ formatPrice(analytics.completedRevenue) }}</span>
          </div>
        </div>
        <div class="revenue-glow"></div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.analytics {
  animation: fadeUp 0.4s ease;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ----- STATS GRID ----- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
}

.stat-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.25rem;
  overflow: hidden;
  transition: all 0.25s ease;
  animation: cardPop 0.4s ease both;
}

@keyframes cardPop {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.stat-card__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.875rem;
}

.stat-card__icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  flex-shrink: 0;
}

.stat-card__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-card__value {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #f0f1f3;
  margin: 0;
  line-height: 1.2;
}

@media (min-width: 640px) {
  .stat-card__value {
    font-size: 1.75rem;
  }
}

.stat-card__glow {
  position: absolute;
  bottom: -24px;
  right: -24px;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.06;
  pointer-events: none;
  transition: opacity 0.3s;
}

.stat-card:hover .stat-card__glow {
  opacity: 0.12;
}


/* ----- SECTIONS GRID ----- */
.sections-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .sections-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.section-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
}

.section-card--revenue {
  position: relative;
  overflow: hidden;
}

.section-card__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.section-card__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.section-card__title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  color: #f0f1f3;
  margin: 0;
}

/* ----- ORDER STATUS LIST ----- */
.status-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.625rem;
  border-radius: 10px;
  transition: background 0.2s;
}

.status-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.status-row__left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-row__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-row__label {
  font-size: 0.85rem;
  color: #d1d5db;
}

.status-row__right {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.status-row__value {
  font-weight: 700;
  font-size: 0.85rem;
  color: #f0f1f3;
  min-width: 20px;
  text-align: right;
}

.status-row__bar {
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}

.status-row__fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}


/* ----- TIMELINE ----- */
.timeline-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.timeline-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
}

.timeline-item__icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.1);
  color: #a78bfa;
  flex-shrink: 0;
}

.timeline-item__info {
  display: flex;
  flex-direction: column;
}

.timeline-item__label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-item__value {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.15rem;
  color: #f0f1f3;
  margin-top: 0.125rem;
}


/* ----- REVENUE ----- */
.revenue-stack {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.revenue-block {
  text-align: center;
  padding: 0.75rem 0;
}

.revenue-block__label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #9ca3af;
  display: block;
  margin-bottom: 0.375rem;
}

.revenue-block__value {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #f0f1f3;
  display: block;
  letter-spacing: -0.02em;
}

.revenue-block__value--highlight {
  color: #10b981;
}

.revenue-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.revenue-glow {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 160px;
  height: 80px;
  border-radius: 50%;
  background: #10b981;
  opacity: 0.08;
  filter: blur(40px);
  pointer-events: none;
}
</style>
