<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, watch } from 'vue'
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
const searchQuery = ref('')
const categoryFilter = ref('all')
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

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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
}

function cancelEdit() {
  editingProduct.value = null
  isCreatingProduct.value = false
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
</script>

<template>
  <div class="products-mgr">
    <!-- Toolbar -->
    <div class="prod-toolbar">
      <div class="prod-search">
        <svg class="prod-search__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="searchQuery" type="text" placeholder="Search products..." class="prod-search__input" />
      </div>
      <div class="prod-toolbar__actions">
        <select v-model="categoryFilter" class="prod-select">
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat === 'all' ? 'All Categories' : cat }}</option>
        </select>
        <button class="prod-add-btn" @click="createNewProduct">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span class="prod-add-btn__text">Add Product</span>
        </button>
      </div>
    </div>

    <!-- Stats -->
    <p class="prod-count">Showing {{ filteredProducts.length }} of {{ products.length }} products</p>

    <!-- Product Grid -->
    <div class="prod-grid">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="prod-card"
      >
        <!-- Image -->
        <div class="prod-card__img" @click="previewProduct(product)" style="cursor: pointer;">
          <img v-if="product.images?.[0]" :src="product.images[0]" :alt="product.name" />
          <div v-else class="prod-card__no-img">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>

          <!-- Preview overlay -->
          <div class="prod-card__preview-overlay">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Preview</span>
          </div>

          <!-- Badges -->
          <div class="prod-card__badges">
            <span :class="['prod-badge', product.stock > 0 ? 'prod-badge--stock' : 'prod-badge--oos']">
              {{ product.stock > 0 ? `${product.stock} in stock` : 'Out of stock' }}
            </span>
            <span v-if="!product.isActive" class="prod-badge prod-badge--draft">Draft</span>
          </div>
        </div>

        <!-- Content -->
        <div class="prod-card__body">
          <span class="prod-card__category">{{ product.category }}</span>
          <h4 class="prod-card__name" :title="product.name">{{ product.name }}</h4>

          <div class="prod-card__footer">
            <div class="prod-card__pricing">
              <span class="prod-card__price">{{ formatPrice(product.price) }}</span>
              <span v-if="product.comparePrice" class="prod-card__compare">{{ formatPrice(product.comparePrice) }}</span>
            </div>
            <div class="prod-card__actions">
              <button class="prod-icon-btn prod-icon-btn--preview" @click="previewProduct(product)" title="Preview as customer">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="prod-icon-btn" @click="editProduct(product)" title="Edit">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="prod-icon-btn prod-icon-btn--danger" @click="deleteProduct(product.id || product.productId)" :disabled="isSaving" title="Delete">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredProducts.length === 0" class="prod-empty">
        <div class="prod-empty__icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <p class="prod-empty__text">No products found</p>
        <button class="prod-empty__clear" @click="categoryFilter = 'all'; searchQuery = ''">Clear filters</button>
      </div>
    </div>

    <!-- Product Edit/Create Modal -->
    <ProductEditModal
      v-model="editingProduct"
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
    />
  </div>
</template>

<style scoped>
.products-mgr {
  animation: fadeUp 0.4s ease;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ----- TOOLBAR ----- */
.prod-toolbar {
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
  .prod-toolbar {
    flex-direction: row;
    align-items: center;
    padding: 0.75rem 1rem;
  }
}

.prod-search {
  position: relative;
  flex: 1;
}

.prod-search__icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #4b5563;
  pointer-events: none;
}

.prod-search__input {
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

.prod-search__input::placeholder { color: #4b5563; }
.prod-search__input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.12);
}

.prod-toolbar__actions {
  display: flex;
  gap: 0.5rem;
}

.prod-select {
  flex: 1;
  min-width: 0;
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

@media (min-width: 768px) {
  .prod-select { width: 180px; flex: none; }
}

.prod-select option {
  background: #1a1b22;
  color: #e5e7eb;
}

.prod-add-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.65rem 1rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.prod-add-btn:hover {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
  transform: translateY(-1px);
}

.prod-add-btn:active {
  transform: scale(0.97);
}

.prod-add-btn__text {
  display: none;
}

@media (min-width: 640px) {
  .prod-add-btn__text { display: inline; }
}

/* ----- COUNT ----- */
.prod-count {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0.25rem;
}

/* ----- PRODUCT GRID ----- */
.prod-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  padding-bottom: 5rem;
}

@media (min-width: 640px) { .prod-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .prod-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1280px) { .prod-grid { grid-template-columns: repeat(4, 1fr); } }

@media (min-width: 768px) {
  .prod-grid { padding-bottom: 0; }
}

.prod-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.25s ease;
}

.prod-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.prod-card__img {
  position: relative;
  aspect-ratio: 4/3;
  background: rgba(255, 255, 255, 0.02);
  overflow: hidden;
}

.prod-card__img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.prod-card:hover .prod-card__img img {
  transform: scale(1.05);
}

.prod-card__no-img {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
}

.prod-card__badges {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
}

.prod-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  backdrop-filter: blur(8px);
}

.prod-badge--stock {
  background: rgba(16, 185, 129, 0.85);
  color: white;
}

.prod-badge--oos {
  background: rgba(239, 68, 68, 0.85);
  color: white;
}

.prod-badge--draft {
  background: rgba(107, 114, 128, 0.85);
  color: white;
}

.prod-card__body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.prod-card__category {
  font-size: 0.68rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.25rem;
}

.prod-card__name {
  font-weight: 700;
  font-size: 0.95rem;
  color: #f0f1f3;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prod-card__footer {
  margin-top: auto;
  padding-top: 0.875rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prod-card__pricing {
  display: flex;
  flex-direction: column;
}

.prod-card__price {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  color: #10b981;
}

.prod-card__compare {
  font-size: 0.75rem;
  color: #4b5563;
  text-decoration: line-through;
}

.prod-card__actions {
  display: flex;
  gap: 0.375rem;
}

.prod-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

.prod-icon-btn:hover {
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
}

.prod-icon-btn--danger:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.prod-icon-btn--preview:hover {
  background: rgba(99, 102, 241, 0.08);
  color: #818cf8;
  border-color: rgba(99, 102, 241, 0.2);
}

/* Preview overlay on image hover */
.prod-card__preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  color: white;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
  z-index: 2;
}

.prod-card__img:hover .prod-card__preview-overlay {
  opacity: 1;
}

/* ----- EMPTY STATE ----- */
.prod-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  text-align: center;
}

.prod-empty__icon {
  color: #374151;
  margin-bottom: 1rem;
}

.prod-empty__text {
  font-size: 1rem;
  color: #9ca3af;
  margin: 0 0 0.75rem;
}

.prod-empty__clear {
  background: none;
  border: none;
  color: #10b981;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
}

.prod-empty__clear:hover {
  color: #34d399;
}


</style>
