import re

with open('frontend/src/views/AdminDashboard.vue', 'r') as f:
    content = f.read()

script_match = re.search(r'(<script setup>.*?</script>)', content, re.DOTALL)
if not script_match:
    print("Could not find script block!")
    exit(1)

script_content = script_match.group(1)

new_template_and_style = """
<template>
  <div class="admin-wrapper">
    <!-- Background Elements -->
    <div class="fixed inset-0 pointer-events-none noise-overlay"></div>
    <div class="fixed inset-0 pointer-events-none w-full h-full overflow-hidden z-0">
      <div class="ambient-glow bg-emerald-700/10 blur-[120px] rounded-full absolute -top-40 -right-40 w-96 h-96"></div>
      <div class="ambient-glow bg-emerald-900/10 blur-[120px] rounded-full absolute top-[40%] -left-32 w-[30rem] h-[30rem]"></div>
      <div class="ambient-glow bg-[#d4af37]/5 blur-[150px] rounded-full absolute -bottom-40 right-1/4 w-[25rem] h-[25rem]"></div>
    </div>

    <!-- ========== LOGIN SCREEN ========== -->
    <Transition name="fade-scale" mode="out-in">
    <div v-if="!isAuthenticated" class="login-screen relative z-10">
      <div class="w-full max-w-[420px] mx-auto px-6">
        <!-- Logo -->
        <div class="mb-10 text-center flex flex-col items-center stagger-1">
          <div class="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20 mb-6 border border-white/10 relative group">
            <div class="absolute inset-0 bg-gradient-to-tr from-emerald-600 to-emerald-400 opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <img src="/logo.jpeg" alt="MKS Admin" class="w-full h-full object-cover relative z-10" />
          </div>
          <h1 class="text-3xl font-bold font-outfit text-white tracking-tight">Admin Portal</h1>
          <p class="text-white/50 mt-2 text-sm">Secure access required</p>
        </div>

        <!-- Form Card -->
        <div class="glass-card rounded-[2rem] p-8 md:p-10 shadow-2xl stagger-2">
          <form @submit.prevent="handleLogin" class="space-y-6">
            <div class="space-y-2">
              <label class="text-[0.65rem] font-bold text-white/40 uppercase tracking-[0.1em] ml-1">Passcode</label>
              <div class="relative group">
                <input
                  v-model="passcode"
                  :type="showPasscode ? 'text' : 'password'"
                  class="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl px-5 py-3.5 text-white text-base outline-none transition-all placeholder:text-white/20 hover:bg-white/[0.07] focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(16,185,129,0.1)]"
                  placeholder="Enter your secure passcode"
                  autofocus
                />
                <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/80 transition-colors" @click="showPasscode = !showPasscode" tabindex="-1">
                  <svg v-if="!showPasscode" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
              </div>
              
              <!-- Validation Message -->
              <div v-if="authError" class="flex items-center gap-2 text-rose-400 text-sm mt-2 ml-1 slide-down">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {{ authError }}
              </div>
            </div>

            <button type="submit" class="w-full relative group overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-semibold py-3.5 transition-all hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5" :disabled="isLoading">
              <span class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              <div class="relative flex items-center justify-center gap-2">
                <span v-if="isLoading">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Authenticating...
                </span>
                <template v-else>
                  <span>Unlock Gateway</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </template>
              </div>
            </button>
          </form>

          <button @click="router.push('/')" class="mt-8 w-full flex justify-center items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
            Return to Store
          </button>
        </div>
      </div>
    </div>
    
    <!-- ========== DASHBOARD LAYOUT ========== -->
    <div v-else class="dashboard-layout relative z-10 flex h-screen overflow-hidden">
      
      <!-- Desktop Sidebar -->
      <nav 
        class="sidebar hidden md:flex flex-col w-[80px] hover:w-[240px] transition-all duration-300 ease-out z-50 border-r border-white/5 bg-[#0a0a0c]/80 backdrop-blur-2xl group"
      >
        <div class="p-6 flex items-center gap-4 overflow-hidden mb-4 shrink-0">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shrink-0 flex items-center justify-center p-0.5 shadow-lg shadow-emerald-500/20">
             <img src="/logo.jpeg" alt="Logo" class="w-full h-full rounded-[10px] object-cover" />
          </div>
          <span class="font-outfit font-bold text-lg text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">MKS Admin</span>
        </div>

        <div class="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar pb-6">
          <button
            v-for="(tab) in tabs"
            :key="tab.id"
            @click="setActiveTab(tab.id)"
            class="w-full flex items-center gap-4 px-3 py-3.5 rounded-xl transition-all duration-200 relative group/item"
            :class="activeTab === tab.id ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/50 hover:text-white hover:bg-white/5'"
          >
            <!-- Active Indicator -->
            <div v-if="activeTab === tab.id" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            
            <div class="shrink-0 flex items-center justify-center relative z-10">
              <svg v-if="tab.icon === 'chart-bar'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              <svg v-else-if="tab.icon === 'shopping-bag'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <svg v-else-if="tab.icon === 'cube'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              <svg v-else-if="tab.icon === 'document-text'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <svg v-else-if="tab.icon === 'cog'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <span class="font-medium text-[0.95rem] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-[50ms] relative z-10">{{ tab.label }}</span>
            <div class="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none"></div>
          </button>
        </div>

        <div class="mt-auto px-4 pb-6 pt-4 border-t border-white/5 shrink-0">
          <button @click="handleLogout" class="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 transition-colors group/logout">
            <div class="shrink-0 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <span class="font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Logout</span>
          </button>
        </div>
      </nav>

      <!-- Main Content Area wrapper -->
      <div class="flex-1 flex flex-col relative overflow-hidden bg-transparent">
        
        <!-- Top Bar -->
        <header class="h-[88px] shrink-0 sticky top-0 z-40 px-6 md:px-10 flex items-center justify-between border-b border-white/5 bg-[#0a0a0c]/60 backdrop-blur-2xl">
          <div class="flex items-center gap-4">
             <!-- Mobile logo & toggle -->
            <div class="md:hidden w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center p-0.5 shadow-lg shadow-emerald-500/20 mr-2">
              <img src="/logo.jpeg" alt="Logo" class="w-full h-full rounded-[10px] object-cover" />
            </div>
            <div>
              <h1 class="font-outfit text-2xl md:text-3xl font-bold tracking-tight text-white mb-0.5 slide-in-bottom">
                {{ activeTabLabel }}
              </h1>
              <p class="text-xs md:text-sm font-medium text-emerald-400/80 slide-in-bottom delay-100">
                {{ greeting }} <span class="text-white/30 hidden sm:inline px-2">•</span> <span class="text-white/40 hidden sm:inline">{{ currentDate }}</span>
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-3 slide-in-right">
            <button @click="loadData" class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-emerald-500/30 flex items-center justify-center transition-all group shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]" title="Refresh">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:rotate-180 transition-transform duration-500"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
            <button @click="handleLogout" class="md:hidden w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </header>

        <!-- Dynamic Content Pane -->
        <main class="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar relative p-6 md:p-10 pb-24 md:pb-10 z-10">
          <Transition name="fade-slide" mode="out-in">
            <div v-if="activeTab === 'analytics'" key="analytics" class="h-full">
               <AnalyticsDashboard :analytics="analytics" />
            </div>

            <div v-else-if="activeTab === 'orders'" key="orders" class="h-full">
              <OrdersManager
                :orders="orders"
                :is-loading="isLoadingOrders"
                @refresh="loadOrders"
                @select-order="handleOrderSelect"
              />
            </div>

            <div v-else-if="activeTab === 'products'" key="products" class="h-full">
              <ProductsManager
                :products="products"
                :admin-token="adminToken"
                @refresh="loadProducts"
              />
            </div>

            <div v-else-if="activeTab === 'content'" key="content" class="h-full">
              <ContentManager :admin-token="adminToken" />
            </div>

            <!-- Coming Soon State for Settings -->
            <div v-else-if="activeTab === 'settings'" key="settings" class="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div class="relative mb-8">
                <div class="absolute inset-0 bg-emerald-500/20 blur-[50px] rounded-full"></div>
                <div class="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center relative shadow-2xl">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#emerald-gradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <defs>
                      <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#34d399" />
                        <stop offset="100%" stop-color="#059669" />
                      </linearGradient>
                    </defs>
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
              </div>
              <h2 class="text-3xl font-outfit font-bold text-white mb-4">Platform Settings</h2>
              <p class="text-white/50 max-w-sm mb-8 leading-relaxed">Advanced configuration for localized taxes, global shipping, and detailed store analytics.</p>
              <div class="px-6 py-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] text-sm font-semibold tracking-wide uppercase shadow-[0_0_20px_rgba(212,175,55,0.15)]">Coming Soon</div>
            </div>
          </Transition>
          <!-- Hidden router-view -->
          <router-view v-show="false" />
        </main>
      </div>

      <!-- Mobile Bottom Navigation (Visible only on small screens) -->
      <nav class="md:hidden fixed bottom-6 left-6 right-6 z-50 rounded-2xl bg-[#111218]/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-emerald-900/10 flex justify-between px-2 py-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="setActiveTab(tab.id)"
          class="flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 relative w-full"
          :class="activeTab === tab.id ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'"
        >
          <div class="relative z-10 transition-transform duration-300" :class="activeTab === tab.id ? '-translate-y-1' : ''">
             <svg v-if="tab.icon === 'chart-bar'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              <svg v-else-if="tab.icon === 'shopping-bag'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <svg v-else-if="tab.icon === 'cube'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              <svg v-else-if="tab.icon === 'document-text'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <svg v-else-if="tab.icon === 'cog'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <span class="text-[0.6rem] font-medium tracking-wide transition-opacity duration-300" :class="activeTab === tab.id ? 'opacity-100' : 'opacity-0 absolute'">{{ tab.label }}</span>
          <div v-if="activeTab === tab.id" class="absolute inset-0 bg-emerald-500/10 rounded-xl pointer-events-none fade-in"></div>
        </button>
      </nav>

    </div>
    </Transition>
    
    <!-- Order Edit Modal -->
    <OrderEditModal
      :order="selectedOrder"
      :show="!!selectedOrder"
      @close="closeOrderModal"
      @save="handleOrderSave"
      @update-status="handleOrderStatusUpdate"
    />
  </div>
</template>

<style scoped>
/* ============================================================
   ADMIN DASHBOARD — Premium Next-gen UI
   ============================================================ */

.admin-wrapper {
  background-color: #050505;
  color: #e4e5e9;
  min-height: 100vh;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  overflow: hidden;
  position: relative;
}

/* Base Ambient Lighting & Overlays */
.noise-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  z-index: 1;
}

.ambient-glow {
  will-change: transform, opacity;
  animation: pulse-slow 10s ease-in-out infinite alternate;
}

@keyframes pulse-slow {
  0% { transform: scale(1) translate(0, 0); opacity: 0.6; }
  100% { transform: scale(1.1) translate(-20px, 20px); opacity: 1; }
}

/* Glassmorphism Classes */
.glass-card {
  background: rgba(20, 20, 22, 0.4);
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Login Screen specific */
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stagger-1 { animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.stagger-2 { animation: slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards; opacity: 0; }

@keyframes slideUpFade {
  0% { opacity: 0; transform: translateY(20px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* Dashboard specific */
.sidebar {
  /* Elegant shadow for sidebar */
  box-shadow: 1px 0 0 rgba(255,255,255,0.03), 4px 0 24px rgba(0,0,0,0.4);
}

/* Animations */
.slide-in-bottom { animation: slide-bottom 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.slide-in-right { animation: slide-right 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.slide-down { animation: slide-down 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

@keyframes slide-bottom {
  0% { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes slide-right {
  0% { transform: translateX(10px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
@keyframes slide-down {
  0% { opacity: 0; transform: translateY(-4px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Vue Transitions */
.fade-scale-enter-active, .fade-scale-leave-active,
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-scale-enter-from { opacity: 0; transform: scale(0.96); }
.fade-scale-leave-to { opacity: 0; transform: scale(1.04); }

.fade-slide-enter-from { opacity: 0; transform: translateY(12px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* Utilities */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
"""

with open('frontend/src/views/AdminDashboard_new.vue', 'w') as f:
    f.write(script_content)
    f.write(new_template_and_style)

print("Done generating AdminDashboard_new.vue")
