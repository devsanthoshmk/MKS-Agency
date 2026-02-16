<script setup>
import { ref, computed, defineProps, defineEmits, onMounted, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: null },
  isCreating: { type: Boolean, default: false },
  isSaving: { type: Boolean, default: false },
  isUploading: { type: Boolean, default: false },
  uploadProgress: { type: Number, default: 0 },
  saveError: { type: String, default: '' },
  saveSuccess: { type: String, default: '' },
  categories: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel', 'upload-images'])

const editingProduct = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeSection = ref('basic')
const isDragging = ref(false)

// Scroll to a section inside the modal
function scrollToSection(sectionId) {
  activeSection.value = sectionId
  const el = document.getElementById(sectionId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Category Search Select
const isCatDropdownOpen = ref(false)
const catSearch = ref('')
const catDropdownRef = ref(null)

const filteredCategories = computed(() => {
  const allCats = props.categories.filter(c => c !== 'all')
  if (!catSearch.value) return allCats
  const query = catSearch.value.toLowerCase()
  return allCats.filter(c => c.toLowerCase().includes(query))
})

const showCreateOption = computed(() => {
  if (!catSearch.value) return false
  return !filteredCategories.value.some(c => c.toLowerCase() === catSearch.value.toLowerCase())
})

function selectCategory(cat) {
  if (!editingProduct.value) return
  editingProduct.value = { ...editingProduct.value, category: cat }
  catSearch.value = cat
  isCatDropdownOpen.value = false
}

function handleCatBlur() {
  // Delay blur to allow click on dropdown
  setTimeout(() => {
    isCatDropdownOpen.value = false
  }, 200)
}

function handleCatInput(e) {
  const val = e.target.value
  editingProduct.value = { ...editingProduct.value, category: val }
  isCatDropdownOpen.value = true
}

// Initialize catSearch from current category
watch(() => editingProduct.value?.category, (newVal) => {
  if (newVal !== catSearch.value) {
    catSearch.value = newVal || ''
  }
}, { immediate: true })

// Tags Search & Management
const isTagDropdownOpen = ref(false)
const tagSearch = ref('')
const tagDropdownRef = ref(null)

const filteredTags = computed(() => {
  if (!tagSearch.value) return props.tags
  const query = tagSearch.value.toLowerCase()
  return props.tags.filter(t => t.toLowerCase().includes(query) && !editingProduct.value?.tags?.includes(t))
})

const showCreateTagOption = computed(() => {
  if (!tagSearch.value) return false
  const exists = props.tags.some(t => t.toLowerCase() === tagSearch.value.toLowerCase()) ||
                 editingProduct.value?.tags?.some(t => t.toLowerCase() === tagSearch.value.toLowerCase())
  return !exists
})

function addTag(tag) {
  if (!editingProduct.value) return
  if (!editingProduct.value.tags) editingProduct.value.tags = []
  if (!editingProduct.value.tags.includes(tag)) {
    editingProduct.value.tags = [...editingProduct.value.tags, tag]
  }
  tagSearch.value = ''
  isTagDropdownOpen.value = false
}

function removeTag(index) {
  if (!editingProduct.value?.tags) return
  const newTags = [...editingProduct.value.tags]
  newTags.splice(index, 1)
  editingProduct.value = { ...editingProduct.value, tags: newTags }
}

function handleTagBlur() {
  setTimeout(() => {
    isTagDropdownOpen.value = false
  }, 200)
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Image handling
async function handleFileUpload(event) {
  const files = event.target.files
  if (!files?.length || !editingProduct.value) return
  emit('upload-images', files)
  event.target.value = ''
}

async function handleDrop(event) {
  event.preventDefault()
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (!files?.length || !editingProduct.value) return
  emit('upload-images', files)
}

function handleDragOver(e) { e.preventDefault(); isDragging.value = true }
function handleDragLeave(e) { e.preventDefault(); isDragging.value = false }

function removeImage(index) {
  if (!editingProduct.value) return
  const images = [...editingProduct.value.images]
  images.splice(index, 1)
  editingProduct.value = { ...editingProduct.value, images }
}

// Reordering logic
const dragSrcIndex = ref(null)
const dragOverIndex = ref(null)

function onImageDragStart(index) { dragSrcIndex.value = index }
function onImageDragOver(e, index) { e.preventDefault(); dragOverIndex.value = index }
function onImageDragLeave() { dragOverIndex.value = null }
function onImageDragEnd() { dragSrcIndex.value = null; dragOverIndex.value = null }

function onImageDrop(index) {
  if (dragSrcIndex.value === null || dragSrcIndex.value === index) {
    dragSrcIndex.value = null
    dragOverIndex.value = null
    return
  }
  reorderImage(dragSrcIndex.value, index)
  dragSrcIndex.value = null
  dragOverIndex.value = null
}

function reorderImage(from, to) {
  if (!editingProduct.value?.images) return
  const imgs = [...editingProduct.value.images]
  const [moved] = imgs.splice(from, 1)
  imgs.splice(to, 0, moved)
  editingProduct.value = { ...editingProduct.value, images: imgs }
}

function moveImage(index, direction) {
  const target = index + direction
  if (!editingProduct.value?.images || target < 0 || target >= editingProduct.value.images.length) return
  reorderImage(index, target)
}

// Touch support
let touchDragIndex = null
let touchClone = null
let touchMoveHandler = null
let touchEndHandler = null

function onTouchStart(e, index) {
  const touch = e.touches[0]
  touchDragIndex = index
  dragSrcIndex.value = index

  const target = e.currentTarget
  touchClone = target.cloneNode(true)
  touchClone.classList.add('upload-thumb--ghost')
  touchClone.style.position = 'fixed'
  touchClone.style.width = target.offsetWidth + 'px'
  touchClone.style.height = target.offsetHeight + 'px'
  touchClone.style.pointerEvents = 'none'
  touchClone.style.zIndex = '9999'
  touchClone.style.left = touch.clientX - target.offsetWidth / 2 + 'px'
  touchClone.style.top = touch.clientY - target.offsetHeight / 2 + 'px'
  document.body.appendChild(touchClone)

  touchMoveHandler = (ev) => onTouchMove(ev)
  touchEndHandler = (ev) => onTouchEnd(ev)
  document.addEventListener('touchmove', touchMoveHandler, { passive: false })
  document.addEventListener('touchend', touchEndHandler)
}

function onTouchMove(e) {
  e.preventDefault()
  const touch = e.touches[0]
  if (touchClone) {
    touchClone.style.left = touch.clientX - touchClone.offsetWidth / 2 + 'px'
    touchClone.style.top = touch.clientY - touchClone.offsetHeight / 2 + 'px'
  }
  const elBelow = document.elementFromPoint(touch.clientX, touch.clientY)
  if (elBelow) {
    const thumb = elBelow.closest('.upload-thumb')
    if (thumb) {
      const idx = Number(thumb.dataset.idx)
      if (!isNaN(idx)) dragOverIndex.value = idx
    } else {
      dragOverIndex.value = null
    }
  }
}

function onTouchEnd() {
  if (touchClone) {
    document.body.removeChild(touchClone)
    touchClone = null
  }
  if (touchDragIndex !== null && dragOverIndex.value !== null && touchDragIndex !== dragOverIndex.value) {
    reorderImage(touchDragIndex, dragOverIndex.value)
  }
  touchDragIndex = null
  dragSrcIndex.value = null
  dragOverIndex.value = null
  if (touchMoveHandler) document.removeEventListener('touchmove', touchMoveHandler)
  if (touchEndHandler) document.removeEventListener('touchend', touchEndHandler)
}

defineExpose({
  setUploading: (val) => { isUploading.value = val },
  setUploadProgress: (val) => { uploadProgress.value = val }
})
</script>

<template>
  <div v-if="editingProduct" class="prod-modal-overlay">
    <div class="prod-modal-backdrop" @click="$emit('cancel')"></div>
    
    <div class="prod-modal">
      <!-- Modal Sidebar (Desktop only) -->
      <div class="prod-modal__sidebar">
        <h3 class="prod-modal__sidebar-title">{{ isCreating ? 'Create Product' : 'Edit Product' }}</h3>
        <nav class="prod-modal__nav">
          <button @click="scrollToSection('basic')" class="prod-modal__nav-item" :class="{ 'prod-modal__nav-item--active': activeSection === 'basic' }">Basic Info</button>
          <button @click="scrollToSection('media')" class="prod-modal__nav-item" :class="{ 'prod-modal__nav-item--active': activeSection === 'media' }">Media</button>
          <button @click="scrollToSection('pricing')" class="prod-modal__nav-item" :class="{ 'prod-modal__nav-item--active': activeSection === 'pricing' }">Pricing & Stock</button>
          <button @click="scrollToSection('details')" class="prod-modal__nav-item" :class="{ 'prod-modal__nav-item--active': activeSection === 'details' }">Details & Specs</button>
        </nav>
      </div>

      <!-- Main Content -->
      <div class="prod-modal__main">
        <!-- Mobile Header -->
        <div class="prod-modal__mobile-header">
          <h3>{{ isCreating ? 'Create Product' : 'Edit Product' }}</h3>
          <button @click="$emit('cancel')" class="prod-modal__close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Scrollable Form -->
        <div class="prod-modal__scroll">
          <!-- Messages -->
          <div v-if="saveSuccess" class="prod-msg prod-msg--success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {{ saveSuccess }}
          </div>
          <div v-if="saveError" class="prod-msg prod-msg--error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {{ saveError }}
          </div>

          <!-- Basic Info Section -->
          <section id="basic" class="form-section">
            <h4 class="form-section__title">Basic Information</h4>
            <div class="form-grid">
              <div class="form-field">
                <label class="form-label">Product Name *</label>
                <input v-model="editingProduct.name" type="text" class="form-input" @input="editingProduct.slug = generateSlug(editingProduct.name)" placeholder="Enter product name" />
              </div>
              <div class="form-field">
                <label class="form-label">Slug (URL)</label>
                <input v-model="editingProduct.slug" type="text" class="form-input form-input--mono" placeholder="product-slug" />
              </div>
              <div class="form-field form-field--relative" ref="catDropdownRef">
                <label class="form-label">Category</label>
                <div class="search-select">
                  <input 
                    v-model="catSearch" 
                    type="text" 
                    class="form-input" 
                    placeholder="Search or create category..." 
                    @focus="isCatDropdownOpen = true"
                    @blur="handleCatBlur"
                    @input="handleCatInput"
                  />
                  <div class="search-select__icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                <!-- Dropdown -->
                <div v-if="isCatDropdownOpen" class="cat-dropdown">
                  <div v-if="filteredCategories.length === 0 && !showCreateOption" class="cat-dropdown__empty">
                    No categories found
                  </div>
                  <button 
                    v-for="cat in filteredCategories" 
                    :key="cat" 
                    type="button"
                    class="cat-dropdown__item"
                    @mousedown.prevent="selectCategory(cat)"
                  >
                    {{ cat }}
                  </button>
                  <button 
                    v-if="showCreateOption" 
                    type="button"
                    class="cat-dropdown__item cat-dropdown__item--create"
                    @mousedown.prevent="selectCategory(catSearch)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Create "{{ catSearch }}"
                  </button>
                </div>
              </div>

              <!-- Tags Field -->
              <div class="form-field form-field--relative" ref="tagDropdownRef">
                <label class="form-label">Tags (Plural)</label>
                <div class="tag-input-wrapper">
                  <div v-if="editingProduct.tags?.length" class="tag-list">
                    <span v-for="(tag, idx) in editingProduct.tags" :key="tag" class="product-tag">
                      {{ tag }}
                      <button @click.stop="removeTag(idx)" class="product-tag__remove">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </span>
                  </div>
                  <div class="search-select">
                    <input 
                      v-model="tagSearch" 
                      type="text" 
                      class="form-input form-input--tag" 
                      placeholder="Type tag and press enter..." 
                      @focus="isTagDropdownOpen = true"
                      @blur="handleTagBlur"
                      @keydown.enter.prevent="tagSearch && addTag(tagSearch)"
                    />
                  </div>
                </div>

                <!-- Dropdown -->
                <div v-if="isTagDropdownOpen" class="cat-dropdown">
                  <div v-if="filteredTags.length === 0 && !showCreateTagOption" class="cat-dropdown__empty">
                    No more tags found
                  </div>
                  <button 
                    v-for="tag in filteredTags" 
                    :key="tag" 
                    type="button"
                    class="cat-dropdown__item"
                    @mousedown.prevent="addTag(tag)"
                  >
                    {{ tag }}
                  </button>
                  <button 
                    v-if="showCreateTagOption" 
                    type="button"
                    class="cat-dropdown__item cat-dropdown__item--create"
                    @mousedown.prevent="addTag(tagSearch)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add "{{ tagSearch }}"
                  </button>
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">Short Description</label>
                <input v-model="editingProduct.shortDescription" type="text" class="form-input" placeholder="One-line summary" />
              </div>
              <div class="form-field form-field--full">
                <label class="form-label">Full Description</label>
                <textarea v-model="editingProduct.description" rows="5" class="form-input form-input--textarea" placeholder="Detailed product description..."></textarea>
              </div>
            </div>
          </section>

          <!-- Media Section -->
          <section id="media" class="form-section">
            <h4 class="form-section__title">Media</h4>
            
            <div
              class="upload-zone"
              :class="{ 'upload-zone--active': isDragging }"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
              @drop="handleDrop"
            >
              <input type="file" accept="image/*" multiple class="upload-zone__input" @change="handleFileUpload" :disabled="isUploading" />
              
              <div v-if="isUploading" class="upload-zone__loading">
                <div class="upload-spinner"></div>
                <p>Uploading... {{ uploadProgress }}%</p>
              </div>
              <div v-else class="upload-zone__content">
                <div class="upload-zone__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <p class="upload-zone__text">Drop images here or click to upload</p>
                <p class="upload-zone__hint">Max 5MB per file</p>
              </div>
            </div>

            <!-- Reorder hint -->
            <p v-if="editingProduct.images?.length > 1" class="upload-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l7-7 7 7"/><path d="M5 15l7 7 7-7"/></svg>
              Drag to reorder · First image is the cover
            </p>

            <div v-if="editingProduct.images?.length" class="upload-grid">
              <div
                v-for="(img, idx) in editingProduct.images"
                :key="img"
                :data-idx="idx"
                class="upload-thumb"
                :class="{
                  'upload-thumb--dragging': dragSrcIndex === idx,
                  'upload-thumb--over': dragOverIndex === idx && dragSrcIndex !== idx,
                  'upload-thumb--hero': idx === 0
                }"
                draggable="true"
                @dragstart="onImageDragStart(idx)"
                @dragover="(e) => onImageDragOver(e, idx)"
                @dragleave="onImageDragLeave"
                @drop="onImageDrop(idx)"
                @dragend="onImageDragEnd"
                @touchstart.prevent="onTouchStart($event, idx)"
              >
                <img :src="img" :alt="'Image ' + (idx + 1)" loading="lazy" />

                <!-- Position badge -->
                <span class="upload-thumb__pos" :class="{ 'upload-thumb__pos--hero': idx === 0 }">
                  {{ idx === 0 ? '★' : idx + 1 }}
                </span>

                <!-- Grab handle -->
                <div class="upload-thumb__handle">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                </div>

                <!-- Mobile move arrows -->
                <div class="upload-thumb__arrows">
                  <button
                    class="upload-thumb__arrow"
                    :disabled="idx === 0"
                    @click.stop="moveImage(idx, -1)"
                    title="Move left"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button
                    class="upload-thumb__arrow"
                    :disabled="idx === editingProduct.images.length - 1"
                    @click.stop="moveImage(idx, 1)"
                    title="Move right"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>

                <!-- Remove button -->
                <button @click.stop="removeImage(idx)" class="upload-thumb__remove">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </section>
          
          <!-- Pricing & Stock Section -->
          <section id="pricing" class="form-section">
            <h4 class="form-section__title">Pricing & Inventory</h4>
            <div class="form-grid form-grid--2col">
              <div class="form-field">
                <label class="form-label">Price (₹) *</label>
                <input v-model.number="editingProduct.price" type="number" class="form-input form-input--price" placeholder="0" />
              </div>
              <div class="form-field">
                <label class="form-label">Compare Price (₹)</label>
                <input v-model.number="editingProduct.comparePrice" type="number" class="form-input" placeholder="0" />
              </div>
              <div class="form-field">
                <label class="form-label">Stock Quantity</label>
                <input v-model.number="editingProduct.stock" type="number" class="form-input" placeholder="100" />
              </div>
              <div class="form-field">
                <label class="form-label">Status</label>
                <button
                  class="status-toggle"
                  :class="{ 'status-toggle--active': editingProduct.isActive }"
                  @click="editingProduct.isActive = !editingProduct.isActive"
                >
                  <span class="status-toggle__dot"></span>
                  <span>{{ editingProduct.isActive ? 'Active' : 'Draft' }}</span>
                </button>
              </div>
            </div>
          </section>
           
          <!-- Details -->
          <section id="details" class="form-section form-section--last">
            <h4 class="form-section__title">Specifications</h4>
            <div class="form-grid form-grid--2col">
              <div class="form-field">
                <label class="form-label">Weight / Size</label>
                <input v-model="editingProduct.weight" type="text" class="form-input" placeholder="e.g. 100ml" />
              </div>
              <div class="form-field">
                <label class="form-label">Ingredients</label>
                <input v-model="editingProduct.ingredients" type="text" class="form-input" placeholder="Separate with commas" />
              </div>
              <div class="form-field form-field--full">
                <label class="form-label">Usage Instructions</label>
                <textarea v-model="editingProduct.usage" rows="3" class="form-input form-input--textarea" placeholder="How to use this product..."></textarea>
              </div>
            </div>
          </section>
        </div>

        <!-- Footer Actions -->
        <div class="prod-modal__footer">
          <button class="prod-save-btn" :disabled="isSaving || isUploading" @click="$emit('save')">
            <span v-if="isSaving" class="prod-save-btn__spinner"></span>
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button class="prod-cancel-btn" @click="$emit('cancel')">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ======================== MODAL ======================== */
.prod-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (min-width: 768px) {
  .prod-modal-overlay {
    align-items: center;
    padding: 1.5rem;
  }
}

.prod-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}

.prod-modal {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 95vh;
  background: #111218;
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  animation: modalSlideUp 0.3s ease;
}

@keyframes modalSlideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@media (min-width: 768px) {
  .prod-modal {
    flex-direction: row;
    height: auto;
    max-height: 85vh;
    max-width: 960px;
    border-radius: 20px;
  }
}

/* Modal Sidebar */
.prod-modal__sidebar {
  display: none;
  width: 220px;
  flex-shrink: 0;
  padding: 1.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

@media (min-width: 768px) {
  .prod-modal__sidebar { display: block; }
}

.prod-modal__sidebar-title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  color: #f0f1f3;
  margin: 0 0 1.5rem;
}

.prod-modal__nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.prod-modal__nav-item {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.prod-modal__nav-item:hover {
  color: #d1d5db;
  background: rgba(255, 255, 255, 0.04);
}

.prod-modal__nav-item--active {
  color: #10b981;
  background: rgba(16, 185, 129, 0.08);
}

/* Modal Main */
.prod-modal__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.prod-modal__mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

@media (min-width: 768px) {
  .prod-modal__mobile-header { display: none; }
}

.prod-modal__mobile-header h3 {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
  color: #f0f1f3;
  margin: 0;
}

.prod-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

.prod-modal__close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

/* Scrollable Content */
.prod-modal__scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

@media (min-width: 768px) {
  .prod-modal__scroll { padding: 2rem; }
}

/* Messages */
.prod-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
  border: 1px solid;
}

.prod-msg--success {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.prod-msg--error {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* Form Elements */
.form-section {
  margin-bottom: 2rem;
  scroll-margin-top: 1.5rem;
}

.form-section--last {
  padding-bottom: 5rem;
}

@media (min-width: 768px) {
  .form-section--last { padding-bottom: 1rem; }
}

.form-section__title {
  font-size: 0.72rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 1rem;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.form-grid {
  display: grid;
  gap: 1rem;
}

.form-grid--2col {
  grid-template-columns: repeat(2, 1fr);
}

.form-field--relative {
  position: relative;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.375rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #f0f1f3;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input::placeholder { color: #374151; }
.form-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.12);
}

.form-input--textarea {
  resize: none;
  font-family: inherit;
}

.form-input--mono {
  font-family: 'JetBrains Mono', monospace, monospace;
  font-size: 0.85rem;
}

.form-input--price {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.1rem;
}

/* Category Search Select */
.search-select {
  position: relative;
}

.search-select__icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #4b5563;
  pointer-events: none;
  transition: transform 0.2s;
}

.search-select input:focus + .search-select__icon {
  transform: translateY(-50%) rotate(180deg);
  color: #10b981;
}

.cat-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background: #1a1b22;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  padding: 0.5rem;
}

.cat-dropdown__empty {
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
}

.cat-dropdown__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.65rem 0.875rem;
  border-radius: 8px;
  background: none;
  border: none;
  color: #d1d5db;
  font-size: 0.875rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  font-family: inherit;
}

.cat-dropdown__item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f0f1f3;
}

.cat-dropdown__item--create {
  color: #10b981;
  font-weight: 600;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 0.25rem;
  padding-top: 0.75rem;
  border-radius: 0 0 8px 8px;
}

.cat-dropdown__item--create:hover {
  background: rgba(16, 185, 129, 0.08);
  color: #34d399;
}

.cat-dropdown__item--create svg {
  flex-shrink: 0;
}

/* Tag Styles */
.tag-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.product-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10b981;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.product-tag__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.2);
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
}

.product-tag__remove:hover {
  background: #10b981;
  color: #111218;
}

.form-input--tag {
  border: none !important;
  background: transparent !important;
  padding: 0.25rem 0.5rem !important;
  box-shadow: none !important;
}

.form-input--tag:focus {
  border: none !important;
  box-shadow: none !important;
}

/* Status Toggle */
.status-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: 46px;
  padding: 0 1rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.status-toggle--active {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-toggle__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4b5563;
  transition: background 0.2s;
}

.status-toggle--active .status-toggle__dot {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

/* Upload Zone */
.upload-zone {
  position: relative;
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.02);
}

.upload-zone--active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.upload-zone__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.upload-zone__loading,
.upload-zone__content {
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(16, 185, 129, 0.2);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-bottom: 0.5rem;
}

@keyframes spin { to { transform: rotate(360deg); } }

.upload-zone__loading p {
  color: #d1d5db;
  font-weight: 600;
  margin: 0;
}

.upload-zone__icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.upload-zone__text {
  font-weight: 700;
  color: #d1d5db;
  margin: 0;
  font-size: 0.9rem;
}

.upload-zone__hint {
  font-size: 0.75rem;
  color: #4b5563;
  margin: 0.25rem 0 0;
}

/* Reorder hint */
.upload-hint {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.72rem;
  color: #6b7280;
  margin: 0.75rem 0 0;
  font-weight: 500;
}

.upload-hint svg {
  color: #4b5563;
  flex-shrink: 0;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 0.75rem;
}

@media (min-width: 480px) {
  .upload-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 768px) {
  .upload-grid { grid-template-columns: repeat(4, 1fr); }
}

.upload-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.06);
  cursor: grab;
  transition: transform 0.2s ease, border-color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
}

.upload-thumb:active { cursor: grabbing; }

.upload-thumb--hero {
  border-color: rgba(251, 191, 36, 0.35);
  box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.1), 0 4px 12px rgba(251, 191, 36, 0.08);
}

.upload-thumb--dragging {
  opacity: 0.35;
  transform: scale(0.95);
}

.upload-thumb--over {
  border-color: #10b981;
  transform: scale(1.03);
}

.upload-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-thumb__pos {
  position: absolute;
  top: 0.375rem;
  left: 0.375rem;
  min-width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  color: #d1d5db;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0 0.25rem;
  z-index: 3;
}

.upload-thumb__pos--hero {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.upload-thumb__handle {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.5);
  color: #9ca3af;
  opacity: 0;
  transition: opacity 0.2s;
}

.upload-thumb:hover .upload-thumb__handle { opacity: 1; }

.upload-thumb__arrows {
  position: absolute;
  bottom: 0.375rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}

.upload-thumb:hover .upload-thumb__arrows { opacity: 1; }

.upload-thumb__arrow {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.65);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.upload-thumb__remove {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.9);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.upload-thumb:hover .upload-thumb__remove { opacity: 1; }

/* Ghost for touch */
.upload-thumb--ghost {
  opacity: 0.8;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  border-color: #10b981;
}

/* Modal Footer */
.prod-modal__footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: row-reverse;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .prod-modal__footer { padding: 1.25rem 2rem; }
}

.prod-save-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

@media (min-width: 768px) { .prod-save-btn { flex: none; min-width: 140px; } }

.prod-save-btn:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  transform: translateY(-1px);
}

.prod-save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.prod-save-btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.prod-cancel-btn {
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.04);
  color: #9ca3af;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.prod-cancel-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}
</style>
