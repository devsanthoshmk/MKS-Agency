/**
 * Cart Composable
 * Handles shopping cart state with localStorage persistence and backend sync
 */

import { ref, computed, watch } from 'vue'
import { useUI } from '@/composables/useUI'
import { useAuth } from '@/composables/useAuth'

const CART_STORAGE_KEY = 'mks_cart'

// Cart items: [{ product, quantity }]
const items = ref([])
const isSyncing = ref(false)

// Initialize from localStorage
function initCart() {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (stored) {
            items.value = JSON.parse(stored)
        }
    } catch (e) {
        console.warn('Cart load failed:', e)
        items.value = []
    }
}

// Save to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.value))
    } catch (e) {
        console.warn('Cart save failed:', e)
    }
}

// Watch for changes and save locally
watch(items, saveToLocalStorage, { deep: true })

// Initialize on import, but don't overwrite if already loaded
if (items.value.length === 0) {
    initCart()
}

const itemCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
})

// Subtotal
const subtotal = computed(() => {
    return items.value.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity)
    }, 0)
})

// Total savings (from compare prices)
const savings = computed(() => {
    return items.value.reduce((sum, item) => {
        if (item.product.comparePrice) {
            return sum + ((item.product.comparePrice - item.product.price) * item.quantity)
        }
        return sum
    }, 0)
})

// Sync local cart with server
async function syncCart() {
    const { isAuthenticated, apiRequest } = useAuth()

    if (!isAuthenticated.value || isSyncing.value) return

    isSyncing.value = true
    try {
        // 1. First, fetch current cart from server
        console.log('Fetching server cart...')
        const data = await apiRequest('/api/cart')
        const serverCart = data.cart || []

        // 2. Get local items that are NOT already on the server
        // These are items added while offline or before login
        const serverProductIds = new Set(serverCart.map(item => item.product?.id || item.productId))
        const localOnlyItems = items.value.filter(item => !serverProductIds.has(item.product.id))

        // 3. Only push genuinely new local items to server
        if (localOnlyItems.length > 0) {
            console.log('Syncing new local items to server...', localOnlyItems.length)
            await Promise.all(localOnlyItems.map(item =>
                apiRequest('/api/cart/add', {
                    method: 'POST',
                    body: JSON.stringify({
                        product: item.product,
                        quantity: item.quantity
                    })
                })
            ))

            // Re-fetch cart after adding new items
            const updatedData = await apiRequest('/api/cart')
            if (updatedData.cart) {
                items.value = updatedData.cart
            }
        } else {
            // No new local items, just use server cart
            items.value = serverCart
        }

        // 4. Clear localStorage to prevent re-syncing the same items
        // The server is now the source of truth
        localStorage.removeItem(CART_STORAGE_KEY)
    } catch (e) {
        console.error('Cart sync failed:', e)
    } finally {
        isSyncing.value = false
    }
}

// Add item to cart
async function addItem(product, quantity = 1) {
    const { isAuthenticated, apiRequest } = useAuth()

    // Optimistic update
    const existingIndex = items.value.findIndex(
        item => item.product.id === product.id
    )

    if (existingIndex >= 0) {
        items.value[existingIndex].quantity += quantity
    } else {
        items.value.push({
            product: {
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                comparePrice: product.comparePrice,
                images: product.images, // Normalize to array if needed
                image: product.image,   // Or single image string
                stock: product.stock,
                category: product.category
            },
            quantity
        })
    }

    // Sync with backend if logged in
    if (isAuthenticated.value) {
        try {
            await apiRequest('/api/cart/add', {
                method: 'POST',
                body: JSON.stringify({
                    product: { ...product, images: undefined, image: product.images?.[0] || product.image },
                    quantity
                })
            })
        } catch (e) {
            console.error('Failed to add item to server cart:', e)
        }
    }

    // Open cart panel
    const { openModal } = useUI()
    openModal('cart')
}

// Remove item from cart
async function removeItem(productId) {
    const { isAuthenticated, apiRequest } = useAuth()

    // Optimistic update
    const index = items.value.findIndex(item => item.product.id === productId)
    if (index >= 0) {
        items.value.splice(index, 1)
    }

    // Sync with backend
    if (isAuthenticated.value) {
        try {
            await apiRequest('/api/cart/remove', {
                method: 'POST',
                body: JSON.stringify({ productId })
            })
        } catch (e) {
            console.error('Failed to remove item from server cart:', e)
        }
    }
}

// Update item quantity
async function updateQuantity(productId, quantity) {
    const { isAuthenticated, apiRequest } = useAuth()

    const item = items.value.find(item => item.product.id === productId)
    if (item) {
        if (quantity <= 0) {
            await removeItem(productId)
        } else {
            // Optimistic update
            const oldQuantity = item.quantity
            item.quantity = Math.min(quantity, item.product.stock || 99)

            // Sync with backend
            if (isAuthenticated.value && item.quantity !== oldQuantity) {
                try {
                    await apiRequest('/api/cart/update', {
                        method: 'POST',
                        body: JSON.stringify({ productId, quantity: item.quantity })
                    })
                } catch (e) {
                    console.error('Failed to update server cart quantity:', e)
                }
            }
        }
    }
}

// Increment quantity
async function incrementQuantity(productId) {
    const item = items.value.find(item => item.product.id === productId)
    if (item && item.quantity < (item.product.stock || 99)) {
        await updateQuantity(productId, item.quantity + 1)
    }
}

// Decrement quantity
async function decrementQuantity(productId) {
    const item = items.value.find(item => item.product.id === productId)
    if (item) {
        await updateQuantity(productId, item.quantity - 1)
    }
}

// Clear cart
async function clearCart() {
    const { isAuthenticated, apiRequest } = useAuth()

    // Optimistic update
    items.value = []

    // Sync with backend
    if (isAuthenticated.value) {
        try {
            await apiRequest('/api/cart/clear', { method: 'POST' })
        } catch (e) {
            console.error('Failed to clear server cart:', e)
        }
    }
}

// Check if product is in cart
function isInCart(productId) {
    return items.value.some(item => item.product.id === productId)
}

// Get cart item
function getCartItem(productId) {
    return items.value.find(item => item.product.id === productId)
}

// Toggle cart panel
function toggleCart() {
    const { activeModal } = useUI()
    const router = window.__vueRouter
    if (activeModal.value === 'cart') {
        router?.push({ hash: '' })
    } else {
        router?.push({ hash: '#cart' })
    }
}

function openCart() {
    const router = window.__vueRouter
    router?.push({ hash: '#cart' })
}

function closeCart() {
    const router = window.__vueRouter
    if (router?.currentRoute?.value?.hash === '#cart') {
        router.push({ hash: '' })
    } else {
        const { closeModalWithoutNavigation } = useUI()
        closeModalWithoutNavigation()
    }
}

// Computed isOpen based on activeModal
function getIsOpen() {
    const { activeModal } = useUI()
    return computed(() => activeModal.value === 'cart')
}

// Get items for checkout/order
function getCheckoutItems() {
    return items.value.map(item => ({
        productId: item.product.id,
        productSlug: item.product.slug,
        productName: item.product.name,
        productPrice: item.product.price,
        productImage: item.product.images?.[0] || item.product.image || null,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
    }))
}

export function useCart() {
    const { isAuthenticated } = useAuth()
    const isOpen = getIsOpen()

    // Watch for login to trigger sync
    watch(isAuthenticated, (newVal) => {
        if (newVal) {
            syncCart()
        }
    }, { immediate: true })

    return {
        // State
        items,
        isOpen,
        isSyncing,

        // Computed
        itemCount,
        subtotal,
        savings,

        // Methods
        addItem,
        removeItem,
        updateQuantity,
        incrementQuantity,
        decrementQuantity,
        clearCart,
        isInCart,
        getCartItem,
        toggleCart,
        openCart,
        closeCart,
        getCheckoutItems,
        syncCart
    }
}
