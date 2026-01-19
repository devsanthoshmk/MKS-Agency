<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

// API URL for production/development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

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
  editingProduct.value = { ...product }
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
    const updatedProducts = isCreatingProduct.value ? [...props.products, editingProduct.value] : props.products.map(p => p.id === editingProduct.value.id ? editingProduct.value : p)
    const response = await fetch(`${API_URL}/api/admin/products`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.adminToken}` }, body: JSON.stringify({ products: updatedProducts }) })
    if (response.ok) {
      saveSuccess.value = 'Product saved!'
      emit('refresh')
      setTimeout(() => { editingProduct.value = null; isCreatingProduct.value = false }, 1000)
    } else {
      const data = await response.json()
      saveError.value = data.error || 'Failed to save'
    }
  } catch (e) {
    saveError.value = 'Network error'
  } finally {
    isSaving.value = false
  }
}

async function deleteProduct(productId) {
  if (!confirm('Delete this product?')) return
  isSaving.value = true
  try {
    const response = await fetch(`${API_URL}/api/admin/products`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.adminToken}` }, body: JSON.stringify({ products: props.products.filter(p => p.id !== productId) }) })
    if (response.ok) emit('refresh')
  } catch (e) { console.error(e) }
  finally { isSaving.value = false }
}

function handleImageInput(event) {
  if (event.target.value && editingProduct.value) editingProduct.value.images = event.target.value.split('\n').filter(Boolean)
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
          <div><label class="text-sm font-medium text-surface-700">Images (one URL per line)</label><textarea :value="editingProduct.images?.join('\n')" @input="handleImageInput" rows="2" class="input mt-1 resize-none font-mono text-sm" /></div>
          <div><label class="text-sm font-medium text-surface-700">Usage</label><textarea v-model="editingProduct.usage" rows="2" class="input mt-1 resize-none" /></div>
          <div><label class="text-sm font-medium text-surface-700">Ingredients</label><input v-model="editingProduct.ingredients" type="text" class="input mt-1" /></div>
          <div class="flex items-center gap-2"><input v-model="editingProduct.isActive" type="checkbox" id="isActive" class="w-4 h-4" /><label for="isActive" class="text-sm">Active</label></div>
        </div>
        <div class="flex gap-3">
          <button class="flex-1 btn btn-primary" :disabled="isSaving" @click="saveProduct">{{ isSaving ? 'Saving...' : 'Save' }}</button>
          <button class="btn btn-secondary" @click="cancelEdit">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
