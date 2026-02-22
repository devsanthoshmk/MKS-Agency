<script setup>
import { defineProps, ref, onMounted } from 'vue'

const props = defineProps({
  adminToken: {
    type: String,
    required: true
  }
})

const isLoading = ref(true)

// Mock layout data - will be driven by API later
const contentSections = ref([
  { id: 'hero', name: 'Global Hero Banner', description: 'Primary landing page engagement unit', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6', status: 'Live', type: 'Hero' },
  { id: 'about', name: 'Brand Story Matrix', description: 'Institutional narrative and core values', icon: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', status: 'Draft', type: 'Text Block' },
  { id: 'products', name: 'Featured Catalog', description: 'Showcase grid for primary merchandise', icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z', status: 'Live', type: 'Grid' },
  { id: 'testimonials', name: 'Client Verification', description: 'Social proof and curated reviews', icon: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z', status: 'Live', type: 'Carousel' },
  { id: 'faq', name: 'Knowledge Base', description: 'Customer support inquiries and FAQ', icon: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01', status: 'Draft', type: 'Accordion' },
  { id: 'contact', name: 'Comms Module', description: 'Global corporate routing information', icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z', status: 'Live', type: 'Form' },
])

const activeEditor = ref(null)
const isSaving = ref(false)
const saveSuccess = ref('')

onMounted(() => {
  // Simulate loading payload
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
})

function selectSection(section) {
  activeEditor.value = JSON.parse(JSON.stringify(section))
}

function closeEditor() {
  activeEditor.value = null
  saveSuccess.value = ''
}

function saveContent() {
  isSaving.value = true
  saveSuccess.value = ''

  setTimeout(() => {
    // Update local mock array
    const index = contentSections.value.findIndex(c => c.id === activeEditor.value.id)
    if (index !== -1) {
      contentSections.value[index] = { ...activeEditor.value }
    }
    
    isSaving.value = false
    saveSuccess.value = 'Configuration successfully deployed to edge'
    
    setTimeout(() => {
      closeEditor()
    }, 1500)
  }, 1200)
}
</script>

<template>
  <div class="content-mgr h-full flex flex-col mx-auto max-w-[1600px] animate-fade-in relative z-10 w-full overflow-hidden">
    
    <!-- Top Configuration Header -->
    <div class="mb-8 flex-shrink-0" v-if="!activeEditor">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 class="text-3xl font-outfit font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
             Content Matrix
             <div class="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold font-inter text-emerald-600 tracking-widest shadow-sm">
               LIVE
             </div>
           </h2>
           <p class="text-slate-500 text-[0.85rem] mt-2 max-w-md leading-relaxed tracking-wide">Orchestrate structural layouts, modify global text arrays, and manage asset pipelines.</p>
        </div>
      </div>
    </div>

    <!-- Main Content List -->
    <Transition name="fade-slide" mode="out-in">
      <div v-if="!activeEditor" class="flex-1 min-h-0 flex flex-col space-y-4 overflow-y-auto custom-scrollbar pb-6 relative">
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] z-20 shadow-sm border border-slate-200">
            <div class="flex flex-col items-center gap-4">
              <div class="relative w-12 h-12 flex items-center justify-center">
                <div class="absolute inset-0 border-[2px] border-emerald-100 rounded-full"></div>
                <div class="absolute inset-0 border-[2px] border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p class="text-emerald-600 font-bold tracking-widest text-[0.65rem] uppercase animate-pulse">Initializing Content Bridge...</p>
           </div>
        </div>

        <div v-for="(section, index) in contentSections" :key="section.id" class="group bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[1.5rem] p-5 lg:p-6 flex flex-col lg:flex-row justify-between lg:items-center gap-6 hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] hover:border-slate-300 transition-all duration-500 cursor-pointer overflow-hidden relative" @click="selectSection(section)">
           <!-- Ambient Background Glow -->
           <div class="absolute inset-0 bg-gradient-to-r from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

           <div class="flex items-start lg:items-center gap-6 relative z-10 w-full lg:w-auto">
             <div class="w-14 h-14 rounded-[1.2rem] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-200 group-hover:bg-emerald-50 transition-all duration-300 shadow-sm flex-shrink-0">
               <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path :d="section.icon"/></svg>
             </div>
             
             <div class="flex-1 min-w-0">
               <div class="flex items-center gap-3 mb-1">
                 <h3 class="text-[1.15rem] font-outfit font-bold text-slate-800 tracking-wide group-hover:text-emerald-600 transition-colors">{{ section.name }}</h3>
                 <span class="px-2.5 py-[0.15rem] rounded-md text-[0.6rem] font-bold uppercase tracking-widest border" :class="section.status === 'Live' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'">
                   {{ section.status }}
                 </span>
               </div>
               <p class="text-[0.85rem] text-slate-500 tracking-wide font-medium truncate">{{ section.description }}</p>
             </div>
           </div>

           <div class="flex items-center justify-between lg:justify-end gap-6 relative z-10 w-full lg:w-auto border-t border-slate-100 lg:border-t-0 pt-4 lg:pt-0">
             <div class="flex flex-col items-start lg:items-end">
               <span class="text-[0.6rem] text-slate-400 uppercase tracking-[0.15em] font-bold mb-1">Structure Type</span>
               <span class="text-[0.85rem] text-slate-700 font-bold tracking-wide">{{ section.type }}</span>
             </div>
             <button class="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 border border-slate-200 group-hover:border-emerald-200 transition-all duration-300">
               <svg class="w-5 h-5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
             </button>
           </div>
        </div>
      </div>

      <!-- Content Editor Workspace -->
      <div v-else class="flex-1 flex flex-col min-h-0 bg-white/90 backdrop-blur-3xl rounded-[2rem] border border-slate-200 relative overflow-hidden shadow-xl animate-slide-up">
        
        <!-- Editor Header -->
        <div class="h-20 lg:h-24 px-6 lg:px-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/50 flex-shrink-0 sticky top-0 z-20">
          <div class="flex items-center gap-4 lg:gap-6 w-full">
            <button @click="closeEditor" class="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 transition-all shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div class="flex-1 min-w-0">
              <h3 class="text-xl lg:text-2xl font-outfit font-extrabold text-slate-800 truncate">{{ activeEditor.name }} <span class="text-slate-300 font-light mx-2">/</span> <span class="text-slate-500 font-inter text-sm lg:text-base tracking-wide">{{ activeEditor.id.toUpperCase() }}</span></h3>
            </div>
            <div class="flex items-center gap-3">
               <div class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                 <span class="w-2 h-2 rounded-full" :class="activeEditor.status === 'Live' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-400'"></span>
                 <select v-model="activeEditor.status" class="bg-transparent text-slate-700 text-xs font-bold uppercase tracking-widest outline-none cursor-pointer appearance-none pr-4 font-inter">
                   <option value="Live">Live Config</option>
                   <option value="Draft">Draft Status</option>
                 </select>
               </div>
               
               <button @click="saveContent" class="h-10 px-6 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs tracking-widest uppercase flex items-center gap-2 shadow-sm hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all relative overflow-hidden" :disabled="isSaving">
                 <div class="absolute inset-0 bg-emerald-500 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                 <div class="relative flex items-center gap-2">
                   <svg v-if="isSaving" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                   <span>{{ isSaving ? 'Executing...' : 'Deploy' }}</span>
                 </div>
               </button>
            </div>
          </div>
        </div>

        <Transition name="fade">
          <div v-if="saveSuccess" class="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg backdrop-blur-xl shrink-0">
             <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
             <span class="text-xs font-bold uppercase tracking-widest">{{ saveSuccess }}</span>
          </div>
        </Transition>

        <!-- Editor Playground (Pseudo-implementation) -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 relative">
          
          <div class="max-w-4xl mx-auto space-y-10">
             
             <!-- Coming Soon Visualizer -->
             <div class="w-full bg-slate-50 border border-emerald-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
               <div class="absolute top-0 right-0 w-80 h-80 bg-emerald-100 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-200/50 transition-colors duration-1000"></div>
               <div class="absolute bottom-0 left-0 w-64 h-64 bg-amber-100 blur-[60px] rounded-full pointer-events-none"></div>
               
               <div class="w-24 h-24 rounded-[2rem] bg-white border border-slate-200 flex items-center justify-center relative shadow-md mb-8">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500">
                     <path d="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  <div class="absolute -right-3 -top-3 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-[0.55rem] font-bold tracking-[0.2em] uppercase shadow-sm">V2 Pipeline</div>
               </div>

               <h4 class="text-3xl font-outfit font-extrabold text-slate-800 mb-3 tracking-tight">Advanced WYSIWYG Engine</h4>
               <p class="text-slate-500 text-[0.95rem] max-w-xl leading-relaxed font-medium">A state-of-the-art visual builder is currently in active development. This will allow complete structural manipulation of the {{ activeEditor.type }} component without altering global source code arrays.</p>
             </div>

             <!-- Mock Field Set -->
             <div class="space-y-6">
                <div class="space-y-3">
                  <label class="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.15em] ml-2">Internal Designation</label>
                  <input type="text" v-model="activeEditor.name" class="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-2xl px-5 py-4 text-slate-800 text-[0.95rem] outline-none transition-all duration-300 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm" placeholder="Section Name">
                </div>

                <div class="space-y-3">
                  <label class="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.15em] ml-2">Operational Context</label>
                  <textarea v-model="activeEditor.description" rows="3" class="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-2xl px-5 py-4 text-slate-800 text-[0.95rem] outline-none transition-all duration-300 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 shadow-sm resize-none custom-scrollbar" placeholder="Describe the purpose of this payload..."></textarea>
                </div>

                <!-- Global Overrides -->
                <div class="bg-slate-50 border border-slate-200 rounded-3xl p-6 lg:p-8 mt-10 shadow-inner">
                   <h5 class="text-sm font-extrabold text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-3">
                     <svg class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                     Global Overrides
                   </h5>
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div class="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                         <span class="text-sm font-bold text-slate-600">Enable Parallax Metrics</span>
                         <div class="w-12 h-6 rounded-full bg-slate-200 relative cursor-pointer border border-slate-300">
                           <div class="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm"></div>
                         </div>
                      </div>
                      <div class="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                         <span class="text-sm font-bold text-slate-600">High-Contrast Mode</span>
                         <div class="w-12 h-6 rounded-full bg-emerald-100 relative cursor-pointer border border-emerald-200">
                           <div class="absolute right-1 top-1 w-4 h-4 rounded-full bg-emerald-500 shadow-sm"></div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </Transition>
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

.animate-slide-up {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(40px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.99);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* Custom Scrollbar */
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
</style>
