<script setup>
import { ref, computed, defineProps, defineEmits, onMounted } from 'vue'
import { ConvexClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api.js'

// API URL for production/development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || ''

const props = defineProps({
  products: { type: Array, required: true },
  adminToken: { type: String, required: true }
})

const emit = defineEmits(['refresh'])

const editingProduct = ref(null)
const isCreatingProduct = ref(false)
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const searchQuery = ref('')
const categoryFilter = ref('all')
const isUploading = ref(false)
const uploadProgress = ref(0)
const isDragging = ref(false)

// Initialize Convex client for file uploads AND product mutations
let convexClient = null
onMounted(() => {
  if (CONVEX_URL) {
    convexClient = new ConvexClient(CONVEX_URL)
  }
})


const categories = computed(() => [...new Set(props.products.map(p => p.category).filter(Boolean))].sort())

const filteredProducts = computed(() => {
  let result = props.products
  if (categoryFilter.value !== 'all') result = result.filter(p => p.category === categoryFilter.value)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => p.name?.toLowerCase().includes(query) || p.category?.toLowerCase().includes(query))
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
  editingProduct.value = { id: 'prod_' + Date.now(), slug: '', name: '', description: '', shortDescription: '', price: 0, comparePrice: null, category: '', images: [], stock: 100, isActive: true, tags: [], benefits: [], ingredients: '', usage: '', weight: '' }
  isCreatingProduct.value = true
  saveError.value = ''
  saveSuccess.value = ''
}

function editProduct(product) {
  editingProduct.value = { ...product, images: [...(product.images || [])] }
  isCreatingProduct.value = false
  saveError.value = ''
  saveSuccess.value = ''
}

function cancelEdit() {
  editingProduct.value = null
  isCreatingProduct.value = false
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

    if (isCreatingProduct.value) {
      // Create new product via Convex mutation
      await convexClient.mutation(api.mutations.createProduct, {
        productId: product.id || 'prod_' + Date.now(),
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
      })
    } else {
      // Update existing product via Convex mutation
      await convexClient.mutation(api.mutations.updateProduct, {
        _id: product._id,
        productId: product.id || product.productId,
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
      })
    }

    saveSuccess.value = 'Product saved!'
    emit('refresh')
    setTimeout(() => { editingProduct.value = null; isCreatingProduct.value = false }, 1000)
  } catch (e) {
    console.error('Save product error:', e)
    saveError.value = e.message || 'Failed to save product'
  } finally {
    isSaving.value = false
  }
}


async function deleteProduct(productId) {
  if (!confirm('Delete this product?')) return
  isSaving.value = true
  try {
    if (!convexClient) {
      saveError.value = 'Convex not configured.'
      return
    }

    // Find the product to get its Convex _id
    const product = props.products.find(p => p.id === productId || p.productId === productId)
    if (!product || !product._id) {
      saveError.value = 'Product not found in database'
      return
    }

    await convexClient.mutation(api.mutations.deleteProduct, {
      _id: product._id,
    })
    emit('refresh')
  } catch (e) {
    console.error('Delete product error:', e)
    saveError.value = e.message || 'Failed to delete product'
  } finally {
    isSaving.value = false
  }
}


// Image upload functions
async function uploadImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    saveError.value = 'Please select a valid image file'
    return null
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    saveError.value = 'Image size must be less than 5MB'
    return null
  }

  if (!convexClient) {
    saveError.value = 'Convex not configured. Please check VITE_CONVEX_URL environment variable.'
    return null
  }

  try {
    // Step 1: Get a short-lived upload URL from Convex
    const uploadUrl = await convexClient.mutation(api.files.generateUploadUrl, {})
    
    // Step 2: POST the file to the upload URL
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    
    if (!result.ok) {
      throw new Error(`Upload failed with status ${result.status}`)
    }
    
    const { storageId } = await result.json()
    
    // Step 3: Get the public URL via Convex's storage.getUrl()
    // This returns the correct CDN-backed URL for the uploaded file
    const publicUrl = await convexClient.query(api.files.getFileUrl, { storageId })
    
    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded file')
    }
    
    return publicUrl
  } catch (error) {
    console.error('Upload error:', error)
    saveError.value = 'Failed to upload image'
    return null
  }
}

async function handleFileUpload(event) {
  const files = event.target.files
  if (!files?.length || !editingProduct.value) return
  
  isUploading.value = true
  uploadProgress.value = 0
  saveError.value = ''
  
  const totalFiles = files.length
  let uploadedCount = 0
  
  for (const file of files) {
    const url = await uploadImage(file)
    if (url) {
      editingProduct.value.images = [...(editingProduct.value.images || []), url]
    }
    uploadedCount++
    uploadProgress.value = Math.round((uploadedCount / totalFiles) * 100)
  }
  
  isUploading.value = false
  uploadProgress.value = 0
  
  // Clear file input
  event.target.value = ''
}

function handleDragOver(event) {
  event.preventDefault()
  isDragging.value = true
}

function handleDragLeave(event) {
  event.preventDefault()
  isDragging.value = false
}

async function handleDrop(event) {
  event.preventDefault()
  isDragging.value = false
  
  const files = event.dataTransfer?.files
  if (!files?.length || !editingProduct.value) return
  
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

function removeImage(index) {
  if (!editingProduct.value) return
  editingProduct.value.images = editingProduct.value.images.filter((_, i) => i !== index)
}

function moveImage(index, direction) {
  if (!editingProduct.value || !editingProduct.value.images) return
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= editingProduct.value.images.length) return
  
  const images = [...editingProduct.value.images]
  const [removed] = images.splice(index, 1)
  images.splice(newIndex, 0, removed)
  editingProduct.value.images = images
}
</script>

<template>
  <div class="products-manager">
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <div class="relative flex-1">
        <input v-model="searchQuery" type="text" placeholder="Search products..." class="input w-full pl-10" />
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>
      <select v-model="categoryFilter" class="input w-full sm:w-48">
        <option value="all">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <button class="btn btn-primary" @click="createNewProduct">+ Add Product</button>
    </div>

    <p class="text-sm text-surface-500 mb-4">Showing {{ filteredProducts.length }} of {{ products.length }} products</p>

    <div class="grid gap-4">
      <div v-for="product in filteredProducts" :key="product.id" class="flex items-center gap-4 p-4 bg-surface-50 rounded-xl">
        <div class="w-20 h-20 rounded-lg overflow-hidden bg-surface-200 shrink-0">
          <img v-if="product.images?.[0]" :src="product.images[0]" :alt="product.name" class="w-full h-full object-cover" />
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-medium text-surface-900">{{ product.name }}</h4>
          <p class="text-sm text-surface-500">{{ product.category }}</p>
          <div class="flex items-center gap-3 mt-1">
            <span class="font-bold text-primary-700">{{ formatPrice(product.price) }}</span>
            <span :class="product.stock > 0 ? 'text-green-600' : 'text-red-500'" class="text-xs">{{ product.stock > 0 ? `${product.stock} in stock` : 'Out of stock' }}</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="px-4 py-2 text-sm bg-white border rounded-lg hover:bg-surface-50" @click="editProduct(product)">Edit</button>
          <button class="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg" @click="deleteProduct(product.id)" :disabled="isSaving">Delete</button>
        </div>
      </div>
      <div v-if="filteredProducts.length === 0" class="text-center py-12 text-surface-500">No products found</div>
    </div>

    <div v-if="editingProduct" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" @click="cancelEdit" />
      <div class="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 class="text-lg font-bold mb-4">{{ isCreatingProduct ? 'Create Product' : 'Edit Product' }}</h3>
        <div v-if="saveSuccess" class="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{{ saveSuccess }}</div>
        <div v-if="saveError" class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{{ saveError }}</div>
        <div class="grid gap-4 mb-6">
          <div class="grid sm:grid-cols-2 gap-4">
            <div><label class="text-sm font-medium text-surface-700">Name *</label><input v-model="editingProduct.name" type="text" class="input mt-1" @input="editingProduct.slug = generateSlug(editingProduct.name)" /></div>
            <div><label class="text-sm font-medium text-surface-700">Slug</label><input v-model="editingProduct.slug" type="text" class="input mt-1" /></div>
          </div>
          <div><label class="text-sm font-medium text-surface-700">Short Description</label><input v-model="editingProduct.shortDescription" type="text" class="input mt-1" /></div>
          <div><label class="text-sm font-medium text-surface-700">Full Description</label><textarea v-model="editingProduct.description" rows="3" class="input mt-1 resize-none" /></div>
          <div class="grid sm:grid-cols-3 gap-4">
            <div><label class="text-sm font-medium text-surface-700">Price *</label><input v-model.number="editingProduct.price" type="number" class="input mt-1" /></div>
            <div><label class="text-sm font-medium text-surface-700">Compare Price</label><input v-model.number="editingProduct.comparePrice" type="number" class="input mt-1" /></div>
            <div><label class="text-sm font-medium text-surface-700">Stock</label><input v-model.number="editingProduct.stock" type="number" class="input mt-1" /></div>
          </div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div><label class="text-sm font-medium text-surface-700">Category</label><input v-model="editingProduct.category" type="text" class="input mt-1" /></div>
            <div><label class="text-sm font-medium text-surface-700">Weight/Size</label><input v-model="editingProduct.weight" type="text" class="input mt-1" /></div>
          </div>
          
          <!-- Image Upload Section -->
          <div>
            <label class="text-sm font-medium text-surface-700 block mb-2">Product Images</label>
            
            <!-- Drag & Drop Upload Area -->
            <div 
              class="relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200"
              :class="[
                isDragging ? 'border-primary-500 bg-primary-50' : 'border-surface-300 hover:border-surface-400',
                isUploading ? 'opacity-50 pointer-events-none' : ''
              ]"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
              @drop="handleDrop"
            >
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                @change="handleFileUpload"
                :disabled="isUploading"
              />
              
              <div v-if="isUploading" class="flex flex-col items-center">
                <svg class="w-8 h-8 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="mt-2 text-sm text-surface-600">Uploading... {{ uploadProgress }}%</p>
              </div>
              
              <div v-else class="flex flex-col items-center">
                <svg class="w-10 h-10 text-surface-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm text-surface-600">
                  <span class="text-primary-600 font-medium">Click to upload</span> or drag and drop
                </p>
                <p class="text-xs text-surface-400 mt-1">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
            
            <!-- Image Previews -->
            <div v-if="editingProduct.images?.length" class="mt-4 grid grid-cols-4 gap-3">
              <div 
                v-for="(image, index) in editingProduct.images" 
                :key="index" 
                class="relative group aspect-square rounded-lg overflow-hidden bg-surface-100"
              >
                <img :src="image" :alt="`Product image ${index + 1}`" class="w-full h-full object-cover" />
                
                <!-- Image badges & controls -->
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <!-- Move left -->
                  <button 
                    v-if="index > 0"
                    @click.stop="moveImage(index, -1)" 
                    class="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                    title="Move left"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <!-- Move right -->
                  <button 
                    v-if="index < editingProduct.images.length - 1"
                    @click.stop="moveImage(index, 1)" 
                    class="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                    title="Move right"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  <!-- Delete -->
                  <button 
                    @click.stop="removeImage(index)" 
                    class="p-1.5 bg-red-500/90 text-white rounded-lg hover:bg-red-500 transition-colors"
                    title="Remove image"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <!-- Primary badge -->
                <span v-if="index === 0" class="absolute top-1 left-1 px-1.5 py-0.5 bg-primary-500 text-white text-[10px] font-medium rounded">
                  Primary
                </span>
              </div>
            </div>
            
            <p v-if="editingProduct.images?.length" class="text-xs text-surface-400 mt-2">
              Drag images to reorder. First image will be the primary product image.
            </p>
          </div>
          
          <div><label class="text-sm font-medium text-surface-700">Usage</label><textarea v-model="editingProduct.usage" rows="2" class="input mt-1 resize-none" /></div>
          <div><label class="text-sm font-medium text-surface-700">Ingredients</label><input v-model="editingProduct.ingredients" type="text" class="input mt-1" /></div>
          <div class="flex items-center gap-2"><input v-model="editingProduct.isActive" type="checkbox" id="isActive" class="w-4 h-4" /><label for="isActive" class="text-sm">Active</label></div>
        </div>
        <div class="flex gap-3">
          <button class="flex-1 btn btn-primary" :disabled="isSaving || isUploading" @click="saveProduct">{{ isSaving ? 'Saving...' : 'Save' }}</button>
          <button class="btn btn-secondary" @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
