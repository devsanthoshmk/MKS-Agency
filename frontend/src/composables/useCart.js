/**
 * Cart Composable
 * Handles shopping cart state with localStorage persistence
 */

import { ref, computed, watch } from 'vue'
import { useUI } from '@/composables/useUI'

const CART_STORAGE_KEY = 'mks_cart'

// Cart items: [{ product, quantity }]
const items = ref([])

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
function saveCart() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.value))
    } catch (e) {
        console.warn('Cart save failed:', e)
    }
}

// Watch for changes and save
watch(items, saveCart, { deep: true })

// Initialize on import
initCart()

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

// Add item to cart
function addItem(product, quantity = 1) {
    const existingIndex = items.value.findIndex(
        item => item.product.id === product.id
    )

    if (existingIndex >= 0) {
        // Update quantity
        items.value[existingIndex].quantity += quantity
    } else {
        // Add new item
        items.value.push({
            product: {
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                comparePrice: product.comparePrice,
                images: product.images,
                stock: product.stock
            },
            quantity
        })
    }

    // Open cart panel (without hash navigation for quick add actions)
    const { openModal } = useUI()
    openModal('cart')
}

// Remove item from cart
function removeItem(productId) {
    const index = items.value.findIndex(item => item.product.id === productId)
    if (index >= 0) {
        items.value.splice(index, 1)
    }
}

// Update item quantity
function updateQuantity(productId, quantity) {
    const item = items.value.find(item => item.product.id === productId)
    if (item) {
        if (quantity <= 0) {
            removeItem(productId)
        } else {
            item.quantity = Math.min(quantity, item.product.stock || 99)
        }
    }
}

// Increment quantity
function incrementQuantity(productId) {
    const item = items.value.find(item => item.product.id === productId)
    if (item && item.quantity < (item.product.stock || 99)) {
        item.quantity++
    }
}

// Decrement quantity
function decrementQuantity(productId) {
    const item = items.value.find(item => item.product.id === productId)
    if (item) {
        if (item.quantity > 1) {
            item.quantity--
        } else {
            removeItem(productId)
        }
    }
}

// Clear cart
function clearCart() {
    items.value = []
}

// Check if product is in cart
function isInCart(productId) {
    return items.value.some(item => item.product.id === productId)
}

// Get cart item
function getCartItem(productId) {
    return items.value.find(item => item.product.id === productId)
}

// Toggle cart panel (use router hash)
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
    // Only navigate if hash exists, otherwise just close the modal
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
        productImage: item.product.images?.[0] || null,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
    }))
}


export function useCart() {
    // Total items count
    const isOpen = getIsOpen()

    return {
        // State
        items,
        isOpen,

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
        getCheckoutItems
    }
}
