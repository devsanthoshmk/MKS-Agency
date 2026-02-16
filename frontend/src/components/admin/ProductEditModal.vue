<script setup>
import { ref, reactive, computed, defineProps, defineEmits, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: null },
  isCreating: { type: Boolean, default: false },
  isSaving: { type: Boolean, default: false },
  isUploading: { type: Boolean, default: false },
  uploadProgress: { type: Number, default: 0 },
  saveError: { type: String, default: '' },
  saveSuccess: { type: String, default: '' },
  imageNotice: { type: String, default: '' },
  categories: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel', 'upload-images', 'download-and-upload-images', 'update:imageNotice'])

// ─── JSON Import/Export ─────────────────────────────────
const isJsonMenuOpen = ref(false)
const isJsonDialogOpen = ref(false)
const jsonDialogMode = ref('paste') // 'paste' | 'view'
const jsonTextarea = ref('')
const jsonError = ref('')
const jsonSuccess = ref('')
const isJsonProcessing = ref(false)
const jsonTextareaRef = ref(null)

// Fields to export (clean product data, no internal IDs)
const JSON_EXPORT_FIELDS = [
  'name', 'slug', 'category', 'tags', 'shortDescription', 'description',
  'price', 'comparePrice', 'stock', 'isActive', 'images',
  'weight', 'ingredients', 'usage', 'benefits',
  'metaTitle', 'metaDescription'
]

function toggleJsonMenu() {
  isJsonMenuOpen.value = !isJsonMenuOpen.value
}

function closeJsonMenu() {
  setTimeout(() => { isJsonMenuOpen.value = false }, 150)
}

function getExportableProduct() {
  if (!editingProduct.value) return {}
  const product = editingProduct.value
  const exported = {}
  for (const key of JSON_EXPORT_FIELDS) {
    if (product[key] !== undefined && product[key] !== null && product[key] !== '') {
      // Skip empty arrays
      if (Array.isArray(product[key]) && product[key].length === 0) continue
      exported[key] = product[key]
    }
  }
  return exported
}

async function copyAsJson() {
  isJsonMenuOpen.value = false
  jsonError.value = ''
  jsonSuccess.value = ''
  try {
    const data = getExportableProduct()
    const jsonString = JSON.stringify(data, null, 2)
    await navigator.clipboard.writeText(jsonString)
    jsonSuccess.value = 'Product data copied to clipboard!'
    setTimeout(() => { jsonSuccess.value = '' }, 3000)
  } catch (err) {
    // Fallback for clipboard API failure
    try {
      const data = getExportableProduct()
      const jsonString = JSON.stringify(data, null, 2)
      jsonTextarea.value = jsonString
      jsonDialogMode.value = 'view'
      isJsonDialogOpen.value = true
      await nextTick()
      if (jsonTextareaRef.value) {
        jsonTextareaRef.value.select()
      }
    } catch (fallbackErr) {
      jsonError.value = 'Failed to copy: ' + (fallbackErr.message || 'Unknown error')
      setTimeout(() => { jsonError.value = '' }, 4000)
    }
  }
}

// ─── AI Prompt Builder ─────────────────────────────────
const AI_PROMPT_TEMPLATE = `## **You are a product data research, completion, and validation assistant.**

### **Your objective**

* **Create a complete, accurate product data record that follows the given data structure exactly.**
* **Use the partial product information provided to intelligently fill in all missing details.**
* **Always research the web to ensure the latest and most accurate information.**
* **Present everything to the user in clear, human-readable language (no technical terms).**

---

## **Critical behavior rules (strict)**

### **GENERAL**

* **Always perform a web search for the latest and reliable product information before generating values.**
* **Generate ALL product details in ONE pass.**
* **Show the full product information to the user in a clean, readable format (plain language).**
* **Do NOT mention technical terms like “JSON”, “schema”, “fields”, or “data types” to the user.**
* **Do NOT ask multiple confirmation questions per item—ask once at the end.**

---

## **USER REVIEW FLOW (MANDATORY)**

### **Step 1: Generate & Show**

* Generate the **entire product information at once**.

* Present it as a **nicely formatted product summary**, for example:

  * Product name
  * Category
  * Price
  * Description
  * Benefits
  * Usage
  * SEO title & description
  * etc.

* After showing everything, ask:

> **“Review this product information. Tell me what you want changed, or say ‘Confirm’ if everything looks correct.”**

---

### **Step 2: Edit Loop**

* If the user requests changes:

  * Apply **only the requested changes**
  * Show the **updated full product information again**
  * Ask for confirmation again

* Repeat this loop until the user explicitly confirms.

---

### **Step 3: Final Output**

* **ONLY after the user confirms**, output:

  * **ONLY the raw structured data**
  * **No explanations**
  * **No formatting**
  * **No surrounding text**
  * **No markdown**
  * **No human-readable labels**

---

## **Validation & enforcement rules**

* Internally enforce all constraints:

  * Required values
  * Character limits
  * Minimums and maximums
  * Patterns and formats
  * No extra properties
* If user edits violate constraints:

  * Briefly explain the issue in plain language
  * Ask them to correct it
  * Do NOT proceed until fixed

---

## **Images (strict rule)**

* Search the web for official, high-quality, e-commerce-ready product images (2–3).
* If valid image URLs cannot be confidently verified:

  * **Do NOT guess or fabricate**
  * **Do NOT ask the user for images**
  * Leave images empty and continue

---

## **Internal data order (do NOT expose this list to user)**

1. name
2. category
3. tags
4. shortDescription
5. description
6. price
7. comparePrice
8. stock
9. isActive
10. images
11. weight
12. ingredients
13. usage
14. benefits
15. metaTitle
16. metaDescription

---

## **Start instructions**

* Analyze the provided partial product information.
* Research the product online for the latest details.
* Generate the **entire completed product information**.
* Show it in **clear, readable language**.
* Ask for confirmation or changes.

---

## **Data structure (internal use only)**

*(Keep your existing schema here exactly as is — do NOT show or explain it to the user.)*

{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": [
    "name",
    "category",
    "tags",
    "shortDescription",
    "description",
    "price",
    "comparePrice",
    "stock",
    "isActive",
    "weight",
    "ingredients",
    "usage",
    "benefits",
    "metaTitle",
    "metaDescription"
  ],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "slug": {
      "type": "string",
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "category": {
      "type": "string"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "uniqueItems": true
    },
    "shortDescription": {
      "type": "string",
      "maxLength": 255
    },
    "description": {
      "type": "string"
    },
    "price": {
      "type": "number",
      "minimum": 0
    },
    "comparePrice": {
      "type": "number",
      "minimum": 0
    },
    "stock": {
      "type": "integer",
      "minimum": 0
    },
    "isActive": {
      "type": "boolean"
    },
    "images": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uri"
      },
      "minItems": 1
    },
    "weight": {
      "type": "string"
    },
    "ingredients": {
      "type": "string"
    },
    "usage": {
      "type": "string"
    },
    "benefits": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "metaTitle": {
      "type": "string",
      "maxLength": 60
    },
    "metaDescription": {
      "type": "string",
      "maxLength": 160
    }
  },
  "additionalProperties": false
}

---

## **Initial product information**
`

function buildAiPrompt() {
  const productJson = JSON.stringify(getExportableProduct(), null, 2)
  return AI_PROMPT_TEMPLATE + productJson
}

// FUTURE: openChatGptWithPrompt — reserved for Chrome extension integration.
// Will open chatgpt.com with the AI prompt pre-filled via URL query param.
// function openChatGptWithPrompt() {
//   isJsonMenuOpen.value = false
//   const prompt = buildAiPrompt()
//   const encoded = encodeURIComponent(prompt)
//   window.open(`https://chatgpt.com/?prompt=${encoded}`, '_blank')
// }

async function copyAiPrompt() {
  isJsonMenuOpen.value = false
  jsonError.value = ''
  jsonSuccess.value = ''
  try {
    const prompt = buildAiPrompt()
    await navigator.clipboard.writeText(prompt)
    jsonSuccess.value = 'AI prompt copied to clipboard!'
    setTimeout(() => { jsonSuccess.value = '' }, 3000)
  } catch (err) {
    jsonError.value = 'Failed to copy prompt: ' + (err.message || 'Unknown error')
    setTimeout(() => { jsonError.value = '' }, 4000)
  }
}

function openPasteDialog() {
  isJsonMenuOpen.value = false
  jsonTextarea.value = ''
  jsonError.value = ''
  jsonSuccess.value = ''
  jsonDialogMode.value = 'paste'
  isJsonDialogOpen.value = true
  nextTick(() => {
    if (jsonTextareaRef.value) jsonTextareaRef.value.focus()
  })
}

function closeJsonDialog() {
  isJsonDialogOpen.value = false
  jsonTextarea.value = ''
  jsonError.value = ''
  isJsonProcessing.value = false
}

/**
 * Extracts the deployment hostname from the VITE_CONVEX_URL.
 * e.g. 'https://woozy-otter-565.convex.cloud' → 'woozy-otter-565.convex.cloud'
 */
const ownConvexHost = (() => {
  try {
    const raw = import.meta.env.VITE_CONVEX_URL || ''
    return raw ? new URL(raw).hostname : ''
  } catch {
    return ''
  }
})()

/**
 * Check if a URL belongs to the CURRENT Convex deployment's storage.
 * This ensures that dev-mode URLs are not reused in prod and vice-versa.
 */
function isOwnConvexUrl(url) {
  if (!url || typeof url !== 'string' || !ownConvexHost) return false
  try {
    const parsed = new URL(url)
    return parsed.hostname === ownConvexHost
  } catch {
    return false
  }
}

/**
 * Check if a URL belongs to ANY Convex deployment (any .convex.cloud/.site).
 * Used to identify Convex URLs from other deployments (e.g. dev URL in prod).
 */
function isAnyConvexUrl(url) {
  if (!url || typeof url !== 'string') return false
  return url.includes('.convex.cloud') || url.includes('convex.site') || url.includes('convex.dev')
}

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

async function applyJsonData() {
  jsonError.value = ''
  jsonSuccess.value = ''
  isJsonProcessing.value = true

  try {
    const rawText = jsonTextarea.value.trim()
    if (!rawText) {
      jsonError.value = 'Please paste JSON data first'
      isJsonProcessing.value = false
      return
    }

    let parsed
    try {
      parsed = JSON.parse(rawText)
    } catch (parseErr) {
      jsonError.value = 'Invalid JSON: ' + parseErr.message
      isJsonProcessing.value = false
      return
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      jsonError.value = 'JSON must be an object with product fields'
      isJsonProcessing.value = false
      return
    }

    // Validate types for known fields
    const typeErrors = []
    if (parsed.name !== undefined && typeof parsed.name !== 'string') typeErrors.push('"name" must be a string')
    if (parsed.slug !== undefined && typeof parsed.slug !== 'string') typeErrors.push('"slug" must be a string')
    if (parsed.category !== undefined && typeof parsed.category !== 'string') typeErrors.push('"category" must be a string')
    if (parsed.description !== undefined && typeof parsed.description !== 'string') typeErrors.push('"description" must be a string')
    if (parsed.shortDescription !== undefined && typeof parsed.shortDescription !== 'string') typeErrors.push('"shortDescription" must be a string')
    if (parsed.price !== undefined && typeof parsed.price !== 'number') typeErrors.push('"price" must be a number')
    if (parsed.comparePrice !== undefined && parsed.comparePrice !== null && typeof parsed.comparePrice !== 'number') typeErrors.push('"comparePrice" must be a number')
    if (parsed.stock !== undefined && typeof parsed.stock !== 'number') typeErrors.push('"stock" must be a number')
    if (parsed.isActive !== undefined && typeof parsed.isActive !== 'boolean') typeErrors.push('"isActive" must be boolean')
    if (parsed.tags !== undefined && !Array.isArray(parsed.tags)) typeErrors.push('"tags" must be an array')
    if (parsed.images !== undefined && !Array.isArray(parsed.images)) typeErrors.push('"images" must be an array')
    if (parsed.benefits !== undefined && !Array.isArray(parsed.benefits)) typeErrors.push('"benefits" must be an array')
    if (parsed.weight !== undefined && typeof parsed.weight !== 'string') typeErrors.push('"weight" must be a string')
    if (parsed.ingredients !== undefined && typeof parsed.ingredients !== 'string') typeErrors.push('"ingredients" must be a string')
    if (parsed.usage !== undefined && typeof parsed.usage !== 'string') typeErrors.push('"usage" must be a string')

    if (typeErrors.length > 0) {
      jsonError.value = 'Validation errors:\n' + typeErrors.join('\n')
      isJsonProcessing.value = false
      return
    }

    // Separate images into categories:
    // 1. ownConvexImages: URLs from THIS Convex deployment → reuse as-is
    // 2. otherConvexImages: URLs from ANOTHER Convex deployment → need download + re-upload
    // 3. externalImageUrls: Non-Convex URLs → need download + upload
    let ownConvexImages = []
    let externalImageUrls = []
    let totalValidImages = 0

    if (parsed.images && Array.isArray(parsed.images)) {
      for (const imgUrl of parsed.images) {
        if (!isValidImageUrl(imgUrl)) continue
        totalValidImages++
        if (isOwnConvexUrl(imgUrl)) {
          ownConvexImages.push(imgUrl)
        } else {
          // Both other-Convex URLs and external URLs need download + upload
          externalImageUrls.push(imgUrl)
        }
      }
    }

    // Apply all non-image fields immediately
    const currentProduct = { ...editingProduct.value }
    for (const key of JSON_EXPORT_FIELDS) {
      if (key === 'images') continue // Handle separately
      if (parsed[key] !== undefined) {
        currentProduct[key] = parsed[key]
      }
    }

    // Replace images if JSON provides them; otherwise keep existing
    if (parsed.images !== undefined) {
      // Start with own Convex images (reused directly)
      currentProduct.images = [...ownConvexImages]
    }
    editingProduct.value = currentProduct

    // Build persistent image notice and handle the next steps
    const fieldCount = Object.keys(parsed).length
    isJsonDialogOpen.value = false
    isJsonProcessing.value = false

    if (parsed.images !== undefined && totalValidImages === 0) {
      // JSON had images field but no valid URLs → user must upload manually
      jsonSuccess.value = `Applied ${fieldCount} fields.`
      setTimeout(() => { jsonSuccess.value = '' }, 3000)
      emit('update:imageNotice', '⚠️ No valid image URLs found in JSON. Please upload images manually.')
    } else if (ownConvexImages.length > 0 && externalImageUrls.length === 0) {
      // All images are from this Convex deployment → reused, nothing to download
      jsonSuccess.value = `Applied ${fieldCount} fields.`
      setTimeout(() => { jsonSuccess.value = '' }, 3000)
      emit('update:imageNotice', `✅ ${ownConvexImages.length} image(s) reused from storage — no re-upload needed.`)
    } else if (externalImageUrls.length > 0 && ownConvexImages.length > 0) {
      // Mix: some reused, some need download
      jsonSuccess.value = `Applied ${fieldCount} fields. Downloading ${externalImageUrls.length} external image(s)...`
      emit('update:imageNotice', `✅ ${ownConvexImages.length} image(s) reused. ⬇️ Downloading ${externalImageUrls.length} external image(s)...`)
      emit('download-and-upload-images', externalImageUrls)
    } else if (externalImageUrls.length > 0) {
      // All images are external → need download
      jsonSuccess.value = `Applied ${fieldCount} fields. Downloading ${externalImageUrls.length} image(s) from URL...`
      emit('update:imageNotice', `⬇️ Downloading ${externalImageUrls.length} image(s) from URL and uploading to storage...`)
      emit('download-and-upload-images', externalImageUrls)
    } else if (parsed.images === undefined) {
      // JSON didn't mention images at all — keep existing, no notice needed
      jsonSuccess.value = `Applied ${fieldCount} fields! Images unchanged.`
      setTimeout(() => { jsonSuccess.value = '' }, 3000)
    } else {
      jsonSuccess.value = `Applied ${fieldCount} fields!`
      setTimeout(() => { jsonSuccess.value = '' }, 3000)
    }

    // Sync catSearch if category changed
    if (parsed.category) {
      catSearch.value = parsed.category
    }
  } catch (err) {
    jsonError.value = 'Unexpected error: ' + (err.message || 'Unknown error')
    isJsonProcessing.value = false
  }
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      jsonTextarea.value = text
    }
  } catch {
    // Clipboard read may not be allowed — user has to paste manually
  }
}

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

// ─── Form Validation ─────────────────────────────────
const validationErrors = reactive({
  name: '',
  slug: '',
  price: '',
  stock: '',
  category: '',
  images: ''
})
const hasAttemptedSubmit = ref(false)

function clearValidation() {
  validationErrors.name = ''
  validationErrors.slug = ''
  validationErrors.price = ''
  validationErrors.stock = ''
  validationErrors.category = ''
  validationErrors.images = ''
  hasAttemptedSubmit.value = false
}

function validateForm() {
  hasAttemptedSubmit.value = true
  let isValid = true
  const p = editingProduct.value

  // Name — required
  if (!p?.name?.trim()) {
    validationErrors.name = 'Product name is required'
    isValid = false
  } else {
    validationErrors.name = ''
  }

  // Slug — required
  if (!p?.slug?.trim()) {
    validationErrors.slug = 'URL slug is required'
    isValid = false
  } else {
    validationErrors.slug = ''
  }

  // Price — required and must be > 0
  if (p?.price === undefined || p?.price === null || p?.price === '' || isNaN(Number(p.price))) {
    validationErrors.price = 'Price is required'
    isValid = false
  } else if (Number(p.price) <= 0) {
    validationErrors.price = 'Price must be greater than 0'
    isValid = false
  } else {
    validationErrors.price = ''
  }

  // Stock — required
  if (p?.stock === undefined || p?.stock === null || p?.stock === '' || isNaN(Number(p.stock))) {
    validationErrors.stock = 'Stock quantity is required'
    isValid = false
  } else if (Number(p.stock) < 0) {
    validationErrors.stock = 'Stock cannot be negative'
    isValid = false
  } else {
    validationErrors.stock = ''
  }

  // Category — recommended
  if (!p?.category?.trim()) {
    validationErrors.category = 'Category is recommended'
    isValid = false
  } else {
    validationErrors.category = ''
  }

  // Images — at least one recommended
  if (!p?.images?.length) {
    validationErrors.images = 'At least one image is recommended'
    // Not blocking save for images — just a warning
  } else {
    validationErrors.images = ''
  }

  return isValid
}

function handleSave() {
  const isValid = validateForm()
  if (!isValid) {
    // Scroll to the first error section
    if (validationErrors.name || validationErrors.slug || validationErrors.category) {
      scrollToSection('basic')
    } else if (validationErrors.images) {
      scrollToSection('media')
    } else if (validationErrors.price || validationErrors.stock) {
      scrollToSection('pricing')
    }
    return
  }
  emit('save')
}

// Real-time validation handlers (for @input in template)
function onNameInput() {
  editingProduct.value.slug = generateSlug(editingProduct.value.name)
  if (hasAttemptedSubmit.value) {
    validationErrors.name = editingProduct.value.name?.trim() ? '' : 'Product name is required'
  }
}

function onSlugInput() {
  if (hasAttemptedSubmit.value) {
    validationErrors.slug = editingProduct.value.slug?.trim() ? '' : 'URL slug is required'
  }
}

function onPriceInput() {
  if (hasAttemptedSubmit.value) {
    validationErrors.price = (editingProduct.value.price > 0) ? '' : 'Price must be greater than 0'
  }
}

function onStockInput() {
  if (hasAttemptedSubmit.value) {
    validationErrors.stock = (editingProduct.value.stock !== undefined && editingProduct.value.stock !== null && editingProduct.value.stock >= 0) ? '' : 'Stock quantity is required'
  }
}

// Clear validation when product changes (e.g. modal re-opens)
watch(() => props.modelValue, () => {
  clearValidation()
})

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
          <div class="prod-modal__mobile-actions">
            <!-- AI Menu Button (Mobile) -->
            <div class="json-menu-wrapper">
              <button 
                @click="toggleJsonMenu" 
                @blur="closeJsonMenu"
                class="json-menu-trigger"
                title="AI Tools & JSON Import/Export"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22"/><path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93"/><path d="M17 10h1a2 2 0 0 1 0 4h-1"/><path d="M7 10H6a2 2 0 0 0 0 4h1"/><circle cx="12" cy="6" r="1"/></svg>
              </button>
              <!-- Dropdown -->
              <div v-if="isJsonMenuOpen" class="json-menu-dropdown json-menu-dropdown--ai">
                <!-- FUTURE: "Fill with ChatGPT" button — reserved for Chrome extension integration. -->
                <button @mousedown.prevent="copyAiPrompt" class="json-menu-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span>Copy AI Prompt</span>
                </button>
                <div class="json-menu-divider"></div>
                <button @mousedown.prevent="copyAsJson" class="json-menu-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span>Copy JSON</span>
                </button>
                <button @mousedown.prevent="openPasteDialog" class="json-menu-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                  <span>Paste JSON Data</span>
                </button>
              </div>
            </div>
            <button @click="$emit('cancel')" class="prod-modal__close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Desktop AI Menu (embedded in Basic Info header below) -->
        <!-- This container is kept but hidden; the desktop button is now inside the section header -->
        <div class="prod-modal__desktop-json" style="display:none !important;">
          <div class="json-menu-wrapper">
            <button 
              @click="toggleJsonMenu" 
              @blur="closeJsonMenu"
              class="json-menu-trigger json-menu-trigger--desktop json-menu-trigger--ai"
              title="AI Tools & JSON Import/Export"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22"/><path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93"/><path d="M17 10h1a2 2 0 0 1 0 4h-1"/><path d="M7 10H6a2 2 0 0 0 0 4h1"/><circle cx="12" cy="6" r="1"/></svg>
              <span>AI</span>
            </button>
            <div v-if="isJsonMenuOpen" class="json-menu-dropdown json-menu-dropdown--ai">
              <!-- FUTURE: "Fill with ChatGPT" button — reserved for Chrome extension integration. -->
              <button @mousedown.prevent="copyAiPrompt" class="json-menu-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>Copy AI Prompt</span>
              </button>
              <div class="json-menu-divider"></div>
              <button @mousedown.prevent="copyAsJson" class="json-menu-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>Copy JSON</span>
              </button>
              <button @mousedown.prevent="openPasteDialog" class="json-menu-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                <span>Paste JSON Data</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Scrollable Form -->
        <div class="prod-modal__scroll">
          <!-- Messages -->
          <div v-if="jsonSuccess" class="prod-msg prod-msg--success prod-msg--json">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {{ jsonSuccess }}
          </div>
          <!-- Persistent image notice from JSON paste -->
          <div v-if="imageNotice" class="prod-msg prod-msg--notice" :class="{ 'prod-msg--warn': imageNotice.startsWith('⚠️') }">
            <svg v-if="imageNotice.startsWith('⚠️')" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>{{ imageNotice }}</span>
            <button class="prod-msg__dismiss" @click="emit('update:imageNotice', '')" title="Dismiss">&times;</button>
          </div>
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
            <div class="form-section__header">
              <h4 class="form-section__title">Basic Information</h4>
              <!-- Desktop AI Menu (inline with section title) -->
              <div class="prod-modal__desktop-ai">
                <div class="json-menu-wrapper">
                  <button 
                    @click="toggleJsonMenu" 
                    @blur="closeJsonMenu"
                    class="json-menu-trigger json-menu-trigger--desktop json-menu-trigger--ai"
                    title="AI Tools & JSON Import/Export"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22"/><path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93"/><path d="M17 10h1a2 2 0 0 1 0 4h-1"/><path d="M7 10H6a2 2 0 0 0 0 4h1"/><circle cx="12" cy="6" r="1"/></svg>
                    <span>AI</span>
                  </button>
                  <div v-if="isJsonMenuOpen" class="json-menu-dropdown json-menu-dropdown--ai">
                    <!-- FUTURE: "Fill with ChatGPT" button — reserved for Chrome extension integration. -->
                    <button @mousedown.prevent="copyAiPrompt" class="json-menu-item">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      <span>Copy AI Prompt</span>
                    </button>
                    <div class="json-menu-divider"></div>
                    <button @mousedown.prevent="copyAsJson" class="json-menu-item">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      <span>Copy JSON</span>
                    </button>
                    <button @mousedown.prevent="openPasteDialog" class="json-menu-item">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                      <span>Paste JSON Data</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-field" :class="{ 'form-field--error': validationErrors.name }">
                <label class="form-label">Product Name <span class="form-required">*</span></label>
                <input v-model="editingProduct.name" type="text" class="form-input" :class="{ 'form-input--invalid': validationErrors.name }" @input="onNameInput" placeholder="Enter product name" required />
                <span v-if="validationErrors.name" class="form-error">{{ validationErrors.name }}</span>
              </div>
              <div class="form-field" :class="{ 'form-field--error': validationErrors.slug }">
                <label class="form-label">Slug (URL) <span class="form-required">*</span></label>
                <input v-model="editingProduct.slug" type="text" class="form-input form-input--mono" :class="{ 'form-input--invalid': validationErrors.slug }" @input="onSlugInput" placeholder="product-slug" required />
                <span v-if="validationErrors.slug" class="form-error">{{ validationErrors.slug }}</span>
              </div>
              <div class="form-field form-field--relative" :class="{ 'form-field--error': validationErrors.category }" ref="catDropdownRef">
                <label class="form-label">Category <span class="form-required">*</span></label>
                <div class="search-select">
                  <input 
                    v-model="catSearch" 
                    type="text" 
                    class="form-input" 
                    :class="{ 'form-input--invalid': validationErrors.category }"
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
                <span v-if="validationErrors.category" class="form-error">{{ validationErrors.category }}</span>
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
                <label class="form-label">Short Description <span class="form-optional">(optional)</span></label>
                <input v-model="editingProduct.shortDescription" type="text" class="form-input" placeholder="One-line summary" />
              </div>
              <div class="form-field form-field--full">
                <label class="form-label">Full Description <span class="form-optional">(optional)</span></label>
                <textarea v-model="editingProduct.description" rows="5" class="form-input form-input--textarea" placeholder="Detailed product description..."></textarea>
              </div>
            </div>
          </section>

          <!-- Media Section -->
          <section id="media" class="form-section">
            <h4 class="form-section__title">Media <span v-if="validationErrors.images" class="form-section__warn">{{ validationErrors.images }}</span></h4>
            
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
              <div class="form-field" :class="{ 'form-field--error': validationErrors.price }">
                <label class="form-label">Price (₹) <span class="form-required">*</span></label>
                <input v-model.number="editingProduct.price" type="number" class="form-input form-input--price" :class="{ 'form-input--invalid': validationErrors.price }" placeholder="0" required min="1" @input="onPriceInput" />
                <span v-if="validationErrors.price" class="form-error">{{ validationErrors.price }}</span>
              </div>
              <div class="form-field">
                <label class="form-label">Compare Price (₹) <span class="form-optional">(optional)</span></label>
                <input v-model.number="editingProduct.comparePrice" type="number" class="form-input" placeholder="0" />
              </div>
              <div class="form-field" :class="{ 'form-field--error': validationErrors.stock }">
                <label class="form-label">Stock Quantity <span class="form-required">*</span></label>
                <input v-model.number="editingProduct.stock" type="number" class="form-input" :class="{ 'form-input--invalid': validationErrors.stock }" placeholder="100" required min="0" @input="onStockInput" />
                <span v-if="validationErrors.stock" class="form-error">{{ validationErrors.stock }}</span>
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
                <label class="form-label">Weight / Size <span class="form-optional">(optional)</span></label>
                <input v-model="editingProduct.weight" type="text" class="form-input" placeholder="e.g. 100ml" />
              </div>
              <div class="form-field">
                <label class="form-label">Ingredients <span class="form-optional">(optional)</span></label>
                <input v-model="editingProduct.ingredients" type="text" class="form-input" placeholder="Separate with commas" />
              </div>
              <div class="form-field form-field--full">
                <label class="form-label">Usage Instructions <span class="form-optional">(optional)</span></label>
                <textarea v-model="editingProduct.usage" rows="3" class="form-input form-input--textarea" placeholder="How to use this product..."></textarea>
              </div>
            </div>
          </section>
        </div>

        <!-- Footer Actions -->
        <div class="prod-modal__footer">
          <button class="prod-save-btn" :disabled="isSaving || isUploading" @click="handleSave">
            <span v-if="isSaving" class="prod-save-btn__spinner"></span>
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button class="prod-cancel-btn" @click="$emit('cancel')">Cancel</button>
        </div>
      </div>
    </div>

    <!-- JSON Paste/View Dialog -->
    <Teleport to="body">
      <div v-if="isJsonDialogOpen" class="json-dialog-overlay" @click.self="closeJsonDialog">
        <div class="json-dialog">
          <div class="json-dialog__header">
            <h4 class="json-dialog__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {{ jsonDialogMode === 'paste' ? 'Import Product JSON' : 'Product JSON' }}
            </h4>
            <button @click="closeJsonDialog" class="json-dialog__close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="json-dialog__body">
            <p v-if="jsonDialogMode === 'paste'" class="json-dialog__hint">
              Paste a valid product JSON below. External image URLs will be automatically downloaded and uploaded to storage.
            </p>
            <p v-else class="json-dialog__hint">
              Copy the JSON below. You can use Ctrl+A then Ctrl+C.
            </p>

            <div v-if="jsonDialogMode === 'paste'" class="json-dialog__actions-row">
              <button @click="pasteFromClipboard" class="json-dialog__paste-btn" :disabled="isJsonProcessing">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                Paste from Clipboard
              </button>
            </div>

            <textarea
              ref="jsonTextareaRef"
              v-model="jsonTextarea"
              class="json-dialog__textarea"
              :class="{ 'json-dialog__textarea--error': jsonError }"
              :readonly="jsonDialogMode === 'view' || isJsonProcessing"
              placeholder='{
  "name": "Product Name",
  "price": 499,
  "category": "skincare",
  "images": ["https://example.com/img.jpg"],
  ...
}'
              spellcheck="false"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
            ></textarea>

            <div v-if="jsonError" class="json-dialog__error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <pre>{{ jsonError }}</pre>
            </div>
          </div>

          <div class="json-dialog__footer">
            <button @click="closeJsonDialog" class="json-dialog__cancel-btn">Cancel</button>
            <button 
              v-if="jsonDialogMode === 'paste'"
              @click="applyJsonData" 
              class="json-dialog__apply-btn"
              :disabled="isJsonProcessing || !jsonTextarea.trim()"
            >
              <span v-if="isJsonProcessing" class="prod-save-btn__spinner"></span>
              {{ isJsonProcessing ? 'Processing...' : 'Apply Data' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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

.prod-modal__mobile-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Desktop JSON button area */
.prod-modal__desktop-json {
  display: none;
  justify-content: flex-end;
  padding: 1rem 2rem 0;
}

@media (min-width: 768px) {
  .prod-modal__desktop-json { display: flex; }
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

.form-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.form-section__header .form-section__title {
  flex: 1;
}

/* Desktop AI button (inline with Basic Info heading) */
.prod-modal__desktop-ai {
  display: none;
}

@media (min-width: 768px) {
  .prod-modal__desktop-ai {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }
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

/* ─── Required / Optional / Validation ─────────────── */
.form-required {
  color: #ef4444;
  font-weight: 700;
  font-size: 0.75rem;
  margin-left: 2px;
}

.form-optional {
  color: #4b5563;
  font-weight: 400;
  font-size: 0.68rem;
  text-transform: none;
  letter-spacing: normal;
}

.form-field--error .form-label {
  color: #f87171;
}

.form-input--invalid,
.form-input--invalid:focus {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15) !important;
}

.form-error {
  display: block;
  font-size: 0.72rem;
  color: #f87171;
  margin-top: 0.35rem;
  font-weight: 500;
  animation: shake 0.35s ease;
}

.form-section__warn {
  font-size: 0.72rem;
  font-weight: 500;
  color: #fbbf24;
  text-transform: none;
  letter-spacing: normal;
  margin-left: 0.5rem;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
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

/* JSON success message animation */
.prod-msg--json {
  animation: jsonPulse 0.3s ease;
}

@keyframes jsonPulse {
  0% { transform: translateY(-4px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

/* Persistent image notice from JSON paste */
.prod-msg--notice {
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: #93c5fd;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: jsonPulse 0.3s ease;
}

.prod-msg--notice.prod-msg--warn {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.3);
  color: #fbbf24;
}

.prod-msg__dismiss {
  margin-left: auto;
  background: none;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.6;
  padding: 0 0.25rem;
  line-height: 1;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.prod-msg__dismiss:hover {
  opacity: 1;
}

/* ======================== JSON MENU ======================== */
.json-menu-wrapper {
  position: relative;
}

.json-menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

.json-menu-trigger:hover {
  background: rgba(99, 102, 241, 0.08);
  color: #818cf8;
  border-color: rgba(99, 102, 241, 0.2);
}

.json-menu-trigger--desktop {
  width: auto;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.02em;
}

.json-menu-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 190px;
  background: #1a1b22;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.6);
  padding: 0.375rem;
  z-index: 200;
  animation: dropdownFade 0.15s ease;
}

@keyframes dropdownFade {
  from { opacity: 0; transform: translateY(-4px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.json-menu-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  background: none;
  border: none;
  color: #d1d5db;
  font-size: 0.84rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  font-family: inherit;
}

.json-menu-item:hover {
  background: rgba(99, 102, 241, 0.08);
  color: #a5b4fc;
}

.json-menu-item svg {
  flex-shrink: 0;
  color: #6b7280;
  transition: color 0.15s;
}

.json-menu-item:hover svg {
  color: #818cf8;
}

/* AI trigger accent styling */
.json-menu-trigger--ai {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
  border-color: rgba(139, 92, 246, 0.25);
  color: #a78bfa;
}

.json-menu-trigger--ai:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(168, 85, 247, 0.18));
  border-color: rgba(139, 92, 246, 0.4);
  color: #c4b5fd;
}

/* AI dropdown wider to fit tooltip */
.json-menu-dropdown--ai {
  min-width: 220px;
}

/* AI menu item highlight */
.json-menu-item--ai {
  color: #c4b5fd;
}

.json-menu-item--ai svg {
  color: #a78bfa;
}

.json-menu-item--ai:hover {
  background: rgba(139, 92, 246, 0.12);
  color: #ddd6fe;
}

.json-menu-item--ai:hover svg {
  color: #c4b5fd;
}

/* Divider between AI and JSON sections */
.json-menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 0.25rem 0.5rem;
}

/* AI tooltip on hover */
.ai-menu-item-wrapper {
  position: relative;
}

.ai-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: #1e1f2b;
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 0.875rem 1rem;
  box-shadow: 0 16px 40px -6px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(139, 92, 246, 0.08);
  z-index: 9999;
  animation: tooltipFadeIn 0.2s ease;
}

.ai-menu-item-wrapper:hover .ai-tooltip {
  display: block;
}

@keyframes tooltipFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.ai-tooltip p {
  margin: 0 0 0.5rem 0;
  font-size: 0.78rem;
  color: #c4b5fd;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.ai-tooltip ol {
  margin: 0;
  padding-left: 1.1rem;
  list-style: decimal;
}

.ai-tooltip ol li {
  font-size: 0.74rem;
  color: #9ca3af;
  line-height: 1.55;
  margin-bottom: 0.25rem;
}

.ai-tooltip ol li:last-child {
  margin-bottom: 0;
}

.ai-tooltip ol li strong {
  color: #d1d5db;
  font-weight: 600;
}

/* Mobile: show tooltip below instead of above */
@media (max-width: 640px) {
  .ai-tooltip {
    bottom: auto;
    top: calc(100% + 8px);
    right: -10px;
    width: 260px;
  }
}

/* ======================== JSON DIALOG ======================== */
.json-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  animation: overlayFadeIn 0.2s ease;
}

@media (min-width: 640px) {
  .json-dialog-overlay {
    align-items: center;
    padding: 1.5rem;
  }
}

@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.json-dialog {
  width: 100%;
  max-height: 90vh;
  background: #12131a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px 18px 0 0;
  display: flex;
  flex-direction: column;
  animation: dialogSlideUp 0.25s ease;
  overflow: hidden;
}

@media (min-width: 640px) {
  .json-dialog {
    max-width: 600px;
    max-height: 80vh;
    border-radius: 18px;
  }
}

@keyframes dialogSlideUp {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.json-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.json-dialog__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: #f0f1f3;
  margin: 0;
}

.json-dialog__title svg {
  color: #818cf8;
}

.json-dialog__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.json-dialog__close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.json-dialog__body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.json-dialog__hint {
  font-size: 0.82rem;
  color: #6b7280;
  margin: 0 0 0.75rem;
  line-height: 1.5;
}

.json-dialog__actions-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.json-dialog__paste-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.45rem 0.75rem;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.json-dialog__paste-btn:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.35);
}

.json-dialog__paste-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.json-dialog__textarea {
  width: 100%;
  min-height: 240px;
  max-height: 45vh;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #e5e7eb;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.82rem;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  tab-size: 2;
}

.json-dialog__textarea::placeholder {
  color: #374151;
}

.json-dialog__textarea:focus {
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12);
}

.json-dialog__textarea--error {
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
}

.json-dialog__error {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 10px;
  color: #f87171;
  font-size: 0.8rem;
  line-height: 1.5;
}

.json-dialog__error svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.json-dialog__error pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: inherit;
}

.json-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.json-dialog__cancel-btn {
  padding: 0.65rem 1.25rem;
  background: rgba(255, 255, 255, 0.04);
  color: #9ca3af;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.json-dialog__cancel-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

.json-dialog__apply-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.5rem;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.json-dialog__apply-btn:hover:not(:disabled) {
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
  transform: translateY(-1px);
}

.json-dialog__apply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
