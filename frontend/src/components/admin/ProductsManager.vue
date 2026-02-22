<script setup>
import { ref, computed, defineProps, defineEmits, onMounted } from 'vue'
import ProductEditModal from './ProductEditModal.vue'
import { useUI } from '../../composables/useUI'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api.js'

// API URL for production/development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || ''

const props = defineProps({
  products: { type: Array, required: true },
  adminToken: { type: String, required: true }
})

const emit = defineEmits(['refresh'])

// Product preview via customer-facing modal
const { openModal: openUIModal } = useUI()

const editingProduct = ref(null)
const isCreatingProduct = ref(false)
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const imageNotice = ref('')
const searchQuery = ref('')
const categoryFilter = ref('all')
const activeSection = ref('basic')
const isUploading = ref(false)
const uploadProgress = ref(0)


// Initialize Convex client for file uploads AND product mutations
let convexClient = null
onMounted(() => {
  if (CONVEX_URL) {
    convexClient = new ConvexHttpClient(CONVEX_URL)
  }
})

// Categories & Tags
const categories = computed(() => {
  const cats = new Set(props.products.map(p => p.category).filter(Boolean))
  return ['all', ...Array.from(cats).sort()]
})

const allTags = computed(() => {
  const tags = new Set()
  props.products.forEach(p => {
    if (p.tags) p.tags.forEach(t => tags.add(t))
  })
  return Array.from(tags).sort()
})

// Filtered Products
const filteredProducts = computed(() => {
  let result = props.products
  if (categoryFilter.value !== 'all') {
    result = result.filter(p => p.category === categoryFilter.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => 
      p.name?.toLowerCase().includes(query) || 
      p.category?.toLowerCase().includes(query)
    )
  }
  return result
})

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(price)
}

function createNewProduct() {
  editingProduct.value = { 
    id: 'prod_' + Date.now(), 
    slug: '', 
    name: '', 
    description: '', 
    shortDescription: '', 
    price: 0, 
    comparePrice: null, 
    category: '', 
    images: [], 
    stock: 100, 
    isActive: true, 
    tags: [], 
    benefits: [], 
    ingredients: '', 
    usage: '', 
    weight: '' 
  }
  isCreatingProduct.value = true
  activeSection.value = 'basic'
  saveError.value = ''
  saveSuccess.value = ''
  imageNotice.value = ''
}

function editProduct(product) {
  editingProduct.value = { 
    ...product, 
    images: [...(product.images || [])],
    tags: [...(product.tags || [])]
  }
  isCreatingProduct.value = false
  saveError.value = ''
  saveSuccess.value = ''
  imageNotice.value = ''
}

function cancelEdit() {
  editingProduct.value = null
  isCreatingProduct.value = false
  imageNotice.value = ''
}

function previewProduct(product) {
  openUIModal('product', { ...product, _adminPreview: true })
}

async function saveProduct() {
  if (!editingProduct.value) return
  isSaving.value = true
  saveError.value = ''
  saveSuccess.value = ''

  try {
    if (!convexClient) {
      saveError.value = 'Convex not configured. Check VITE_CONVEX_URL.'
      return
    }

    const product = editingProduct.value
    
    // Prepare product data for Convex
    const productData = {
      productId: product.id || product.productId || 'prod_' + Date.now(),
      slug: product.slug,
      name: product.name,
      description: product.description || undefined,
      shortDescription: product.shortDescription || undefined,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
      category: product.category || undefined,
      subcategory: product.subcategory || undefined,
      images: product.images || undefined,
      stock: Number(product.stock) || 0,
      isActive: product.isActive !== false,
      tags: product.tags?.length ? product.tags : undefined,
      benefits: product.benefits?.length ? product.benefits : undefined,
      ingredients: product.ingredients || undefined,
      usage: product.usage || undefined,
      weight: product.weight || undefined,
      metaTitle: product.metaTitle || undefined,
      metaDescription: product.metaDescription || undefined,
    }

    if (isCreatingProduct.value) {
      // Create
      await convexClient.mutation(api.mutations.createProduct, productData)
    } else {
      // Update
      await convexClient.mutation(api.mutations.updateProduct, {
        ...productData,
        _id: product._id
      })
    }

    saveSuccess.value = 'Product saved!'
    emit('refresh')
    // Close modal after success
    setTimeout(() => { 
      // Only close if still on the same screen (user didn't cancel)
      if (editingProduct.value) {
        editingProduct.value = null; 
        isCreatingProduct.value = false 
      }
    }, 1000)
  } catch (e) {
    console.error('Save product error:', e)
    saveError.value = e.message || 'Failed to save product'
  } finally {
    isSaving.value = false
  }
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return
  
  // We need to find the product to get its _id for Convex
  const product = props.products.find(p => p.id === productId || p.productId === productId)
  if (!product || !product._id) {
    alert('Product not found in database')
    return
  }

  try {
    if (!convexClient) {
      alert('Convex not configured.')
      return
    }

    await convexClient.mutation(api.mutations.deleteProduct, {
      _id: product._id,
    })
    emit('refresh')
  } catch (e) {
    console.error('Delete product error:', e)
    alert('Failed to delete product: ' + e.message)
  }
}

// Image Upload Logic
async function uploadImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    saveError.value = 'Please select a valid image file'
    return null
  }
  if (file.size > 5 * 1024 * 1024) {
    saveError.value = 'Image size must be less than 5MB'
    return null
  }
  if (!convexClient) {
    saveError.value = 'Convex not configured.'
    return null
  }

  try {
    const uploadUrl = await convexClient.mutation(api.files.generateUploadUrl, {})
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!result.ok) throw new Error(`Upload failed: ${result.status}`)
    const { storageId } = await result.json()
    const publicUrl = await convexClient.query(api.files.getFileUrl, { storageId })
    return publicUrl
  } catch (error) {
    console.error('Upload error:', error)
    saveError.value = 'Failed to upload image'
    return null
  }
}

async function processFiles(files) {
  if (!editingProduct.value) return
  isUploading.value = true
  uploadProgress.value = 0
  saveError.value = ''
  
  const totalFiles = files.length
  let uploadedCount = 0
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const url = await uploadImage(file)
      if (url) {
        editingProduct.value.images = [...(editingProduct.value.images || []), url]
      }
    }
    uploadedCount++
    uploadProgress.value = Math.round((uploadedCount / totalFiles) * 100)
  }
  
  isUploading.value = false
  uploadProgress.value = 0
}

/**
 * Download external image URLs and re-upload them to Convex storage.
 * Skips URLs that already belong to the current Convex deployment (reuses them).
 * Used by the JSON paste feature when images are from external sources.
 */
async function downloadAndUploadImages(imageUrls) {
  if (!editingProduct.value || !imageUrls?.length) return
  if (!convexClient) {
    saveError.value = 'Convex not configured. Cannot upload images.'
    return
  }

  // Extract own deployment hostname for URL matching
  let ownHost = ''
  try {
    ownHost = CONVEX_URL ? new URL(CONVEX_URL).hostname : ''
  } catch { /* ignore */ }

  isUploading.value = true
  uploadProgress.value = 0
  saveError.value = ''

  const totalUrls = imageUrls.length
  let uploadedCount = 0
  let failedCount = 0
  let reusedCount = 0
  let downloadedCount = 0

  for (const externalUrl of imageUrls) {
    try {
      // Defense in depth: if the URL belongs to this Convex deployment, reuse it
      let urlHost = ''
      try { urlHost = new URL(externalUrl).hostname } catch { /* invalid */ }

      if (ownHost && urlHost === ownHost) {
        // This is our own Convex URL — reuse directly without re-uploading
        if (editingProduct.value) {
          editingProduct.value = {
            ...editingProduct.value,
            images: [...(editingProduct.value.images || []), externalUrl]
          }
        }
        reusedCount++
        uploadedCount++
        uploadProgress.value = Math.round((uploadedCount / totalUrls) * 100)
        continue
      }

      // Download the external image
      const response = await fetch(externalUrl, { mode: 'cors' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const blob = await response.blob()
      
      // Validate it's actually an image
      if (!blob.type.startsWith('image/')) {
        console.warn(`Skipping non-image URL: ${externalUrl} (type: ${blob.type})`)
        failedCount++
        uploadedCount++
        uploadProgress.value = Math.round((uploadedCount / totalUrls) * 100)
        continue
      }

      // Check size (max 5MB)
      if (blob.size > 5 * 1024 * 1024) {
        console.warn(`Image too large (${(blob.size / 1024 / 1024).toFixed(1)}MB): ${externalUrl}`)
        failedCount++
        uploadedCount++
        uploadProgress.value = Math.round((uploadedCount / totalUrls) * 100)
        continue
      }
      
      // Upload to Convex storage
      const uploadUrl = await convexClient.mutation(api.files.generateUploadUrl, {})
      const uploadResult = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob,
      })
      if (!uploadResult.ok) throw new Error(`Upload failed: ${uploadResult.status}`)
      
      const { storageId } = await uploadResult.json()
      const publicUrl = await convexClient.query(api.files.getFileUrl, { storageId })
      
      if (publicUrl && editingProduct.value) {
        // Create a new object reference so Vue triggers prop update in the child modal
        editingProduct.value = {
          ...editingProduct.value,
          images: [...(editingProduct.value.images || []), publicUrl]
        }
      }
      downloadedCount++
    } catch (err) {
      console.error(`Failed to download/upload image from ${externalUrl}:`, err)
      failedCount++
    }
    
    uploadedCount++
    uploadProgress.value = Math.round((uploadedCount / totalUrls) * 100)
  }

  isUploading.value = false
  uploadProgress.value = 0

  // Update persistent image notice with final result
  const parts = []
  if (reusedCount > 0) parts.push(`✅ ${reusedCount} image(s) reused from storage`)
  if (downloadedCount > 0) parts.push(`✅ ${downloadedCount} image(s) downloaded and uploaded`)
  if (failedCount > 0) {
    parts.push(`❌ ${failedCount} image(s) failed`)
    saveError.value = `${failedCount} of ${totalUrls} image(s) failed to download/upload. Check the console for details.`
  }
  if (parts.length > 0) {
    imageNotice.value = parts.join(' · ')
  }
}
</script>

<template>
  <div class="h-full flex flex-col mx-auto animate-fade-in relative z-10 max-w-[1600px] w-full mt-2 lg:mt-0">
    
    <!-- Header & Controls -->
    <div class="mb-8 flex-shrink-0">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
           <h2 class="text-3xl font-outfit font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
             Product Vault
             <div class="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold font-inter text-emerald-600 tracking-widest shadow-sm">
               {{ props.products.length }}
             </div>
           </h2>
           <p class="text-slate-500 text-[0.85rem] mt-2 max-w-md leading-relaxed tracking-wide">Manage inventory logistics, pricing structures, and product configurations.</p>
        </div>
         <div class="flex items-center gap-3">
            <button @click="emit('refresh')" class="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-slate-50 hover:border-emerald-200 flex items-center justify-center gap-2 transition-all duration-300 group shadow-sm" title="Sync Data">
               <svg class="transition-transform duration-700 ease-out text-slate-400 group-hover:text-emerald-500 group-hover:rotate-180" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/></svg>
               <span class="text-sm font-semibold tracking-wide">Sync State</span>
            </button>
        </div>
      </div>

      <!-- Toolbar Light Panel -->
      <div class="bg-white/90 backdrop-blur-2xl rounded-3xl p-2 border border-slate-200 flex flex-col lg:flex-row shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden z-20">
        
        <!-- Search Input -->
        <div class="relative w-full lg:flex-1 group p-2">
          <svg class="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search products by nomenclature or category..."
            class="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-slate-800 text-[0.95rem] outline-none transition-all placeholder:text-slate-400 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>
        
        <div class="w-full lg:w-px h-px lg:h-12 bg-slate-200 mx-2 lg:my-auto"></div>

        <div class="flex flex-row w-full lg:w-auto p-2 gap-2">
          <!-- Category Filter -->
          <div class="relative w-1/2 lg:w-48 group">
             <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-hover:text-emerald-600 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
             </div>
            <select v-model="categoryFilter" class="w-full appearance-none bg-transparent border border-transparent rounded-2xl pl-4 pr-10 py-3 text-slate-600 text-[0.9rem] font-bold outline-none transition-all hover:bg-slate-50 focus:bg-white focus:border-emerald-500 cursor-pointer">
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat === 'all' ? 'All Classes' : cat }}</option>
            </select>
          </div>
          
           <!-- Add Product Button -->
           <button @click="createNewProduct" class="w-1/2 lg:w-auto flex flex-1 items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl font-bold tracking-wide text-[0.9rem] shadow-sm hover:shadow-md hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-300 group/btn whitespace-nowrap">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 group-hover/btn:rotate-90 transition-transform duration-300"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
             <span>Initialize Item</span>
           </button>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 min-h-0 relative z-10 overflow-x-hidden overflow-y-auto custom-scrollbar pb-10">
      
       <!-- Empty State -->
       <Transition name="fade">
        <div v-if="filteredProducts.length === 0" class="bg-white/90 backdrop-blur-xl rounded-[2rem] h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center border border-slate-200 shadow-[0_8px_30px_-5px_rgba(0,0,0,0.06)] relative overflow-hidden">
          
          <div class="w-24 h-24 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-8 relative shadow-sm">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="relative z-10"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          <h3 class="text-2xl font-outfit font-extrabold text-slate-800 mb-3">No products matched</h3>
          <p class="text-slate-500 max-w-sm text-[0.95rem] leading-relaxed mb-8">We couldn't locate any items matching your designated query vector.</p>
          <button v-if="searchQuery || categoryFilter !== 'all'" @click="searchQuery = ''; categoryFilter = 'all'" class="px-8 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 font-bold text-sm tracking-wide transition-all border border-slate-200 hover:border-emerald-300 shadow-sm group">
            <span class="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="group-hover:rotate-90 transition-transform duration-300"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Clear Vectors
            </span>
          </button>
        </div>
      </Transition>

      <!-- Product Grid -->
      <TransitionGroup name="grid" tag="div" v-if="filteredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6 pt-2 relative z-20">
        <div
          v-for="product in filteredProducts"
          :key="product.id || product.productId"
          class="group bg-white backdrop-blur-2xl border border-slate-200 rounded-[2rem] overflow-hidden flex flex-col hover:-translate-y-2 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:border-emerald-300 transition-all duration-500 relative cursor-pointer"
          @click="previewProduct(product)"
        >
          <!-- Hover ambient glow -->
           <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0"></div>

          <!-- Image Container -->
          <div class="relative aspect-[4/3] bg-slate-50 overflow-hidden w-full flex-shrink-0 border-b border-slate-100">
            <img v-if="product.images?.[0]" :src="product.images[0]" :alt="product.name" class="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.05]" />
            <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100/50">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
               <span class="text-[0.65rem] font-bold uppercase tracking-[0.15em]">No Asset</span>
            </div>

            <!-- Preview Overlay on Hover -->
            <div class="absolute inset-0 bg-white/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
               <div class="flex flex-col items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
                  <div class="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-lg border border-slate-100">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
               </div>
            </div>

            <!-- Badges -->
            <div class="absolute top-4 right-4 flex flex-col items-end gap-2 z-20 pointer-events-none">
              <span class="px-3 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-widest shadow-sm backdrop-blur-md border border-white/40" :class="product.stock > 0 ? 'bg-emerald-100/90 text-emerald-700' : 'bg-rose-100/90 text-rose-700'">
                {{ product.stock > 0 ? `${product.stock} units` : 'Depleted' }}
              </span>
              <span v-if="!product.isActive" class="px-3 py-1.5 rounded-full text-[0.65rem] font-bold uppercase tracking-widest bg-slate-100/90 text-slate-600 shadow-sm backdrop-blur-md border border-white/40">
                Draft
              </span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-6 flex flex-col flex-1 relative z-10 pointer-events-none">
             <!-- Interactive area inside card content -->
             <div class="pointer-events-auto flex flex-col h-full flex-1 justify-between">
               <div>
                 <div class="mb-3">
                   <span class="text-[0.65rem] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">{{ product.category || 'Unassigned' }}</span>
                 </div>
                 
                 <h4 class="text-xl font-outfit font-extrabold text-slate-800 leading-tight mb-6 group-hover:text-emerald-700 transition-colors line-clamp-2" :title="product.name">{{ product.name }}</h4>
               </div>
  
               <div class="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
                  <!-- Pricing -->
                  <div class="flex flex-col">
                    <span class="font-outfit font-black text-xl text-slate-800 transition-colors">{{ formatPrice(product.price) }}</span>
                    <span v-if="product.comparePrice" class="text-xs text-slate-400 font-bold line-through align-top">{{ formatPrice(product.comparePrice) }}</span>
                  </div>
  
                  <!-- Actions -->
                  <div class="flex gap-2 relative z-20">
                     <button @click.stop="editProduct(product)" class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 flex items-center justify-center transition-all shadow-sm hover:shadow-md group/edit">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover/edit:-translate-y-0.5 group-hover/edit:-translate-x-0.5 transition-transform"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                     </button>
                     <button @click.stop="deleteProduct(product.id || product.productId)" :disabled="isSaving" class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-rose-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md group/del">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover/del:scale-110 transition-transform"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                     </button>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Product Edit/Create Modal -->
    <ProductEditModal
      v-model="editingProduct"
      v-model:imageNotice="imageNotice"
      :is-creating="isCreatingProduct"
      :is-saving="isSaving"
      :is-uploading="isUploading"
      :upload-progress="uploadProgress"
      :save-error="saveError"
      :save-success="saveSuccess"
      :categories="categories"
      :tags="allTags"
      @save="saveProduct"
      @cancel="cancelEdit"
      @upload-images="processFiles"
      @download-and-upload-images="downloadAndUploadImages"
    />
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.98);
}

/* Grid Transitions */
.grid-move,
.grid-enter-active,
.grid-leave-active {
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.grid-enter-from,
.grid-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
.grid-leave-active {
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
  background-color: rgba(148, 163, 184, 0.3);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(148, 163, 184, 0.5);
}
</style>
