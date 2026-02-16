/**
 * Cart Composable
 * Handles shopping cart state with localStorage persistence and efficient Convex DB sync
 */

import { ref, computed, watch } from 'vue'
import { useUI } from '@/composables/useUI'
import { useAuth } from '@/composables/useAuth'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../convex/_generated/api.js'

const CART_STORAGE_KEY = 'mks_cart'
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || ''

// Singleton Convex Client
let convexClient = null
function getConvexClient() {
    if (!convexClient && CONVEX_URL) {
        convexClient = new ConvexHttpClient(CONVEX_URL)
    }
    return convexClient
}

// Global State
const items = ref([])
const isSyncing = ref(false)
const isInitialized = ref(false)

export function useCart() {
    const { isAuthenticated, convexUserId } = useAuth()
    const { openModal } = useUI()

    // Initialize
    if (!isInitialized.value) {
        initCart()
        isInitialized.value = true
    }

    // Watch for login/logout
    watch(isAuthenticated, async (newVal) => {
        if (newVal && convexUserId.value) {
            await syncCart()
        } else if (!newVal) {
            // On logout, clear items (optional: could keep them as guest cart, but usually better to clear or reload form local storage if we want to support shared device)
            // For now, let's clear to avoid data leak, or re-init from local storage for guest
            items.value = []
            // Optionally re-read local storage if we want to support "guest cart" separate from "user cart"
            // But simpler to just clear. 
            // Actually, standard behavior: logout -> empty cart or guest cart.
            // Let's clear in-memory items.
        }
    })

    // --- Core Logic ---

    function initCart() {
        // 1. Try to load from LocalStorage (Guest Mode)
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

    function saveToLocalStorage() {
        // Only save to local storage if NOT authenticated (or as backup)
        // If authenticated, we rely on DB.
        // But for offline support/optimistic UI, maybe keep it?
        // Standard: Guest -> LocalStorage. Auth -> DB.
        if (!isAuthenticated.value) {
            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.value))
            } catch (e) {
                console.warn('Cart save failed:', e)
            }
        } else {
            // If authenticated, we might want to clear local storage to avoid confusion
            localStorage.removeItem(CART_STORAGE_KEY)
        }
    }

    // Watch items to save to LS if guest
    watch(items, () => {
        if (!isAuthenticated.value) {
            saveToLocalStorage()
        }
    }, { deep: true })

    async function syncCart() {
        if (!isAuthenticated.value || !convexUserId.value || isSyncing.value) return

        isSyncing.value = true
        try {
            const client = getConvexClient()
            if (!client) return

            // 1. Get local items to merge
            const localItems = items.value.map(item => ({
                productId: item.product.id,
                productData: item.product,
                quantity: item.quantity
            }))

            // 2. Call Sync Mutation
            // This mutation merges local items into DB and returns the FULL updated cart
            console.log('Syncing cart with Convex...', localItems.length, 'items')
            const serverCart = await client.mutation(api.mutations.syncCartItems, {
                userId: convexUserId.value,
                items: localItems
            })

            // 3. Update local state with Server Truth
            items.value = serverCart.map(dbItem => ({
                product: dbItem.productData,
                quantity: dbItem.quantity
            }))

            // 4. Clear local storage (we are now synced)
            localStorage.removeItem(CART_STORAGE_KEY)

        } catch (e) {
            console.error('Cart sync failed:', e)
        } finally {
            isSyncing.value = false
        }
    }

    async function fetchServerCart() {
        if (!isAuthenticated.value || !convexUserId.value) return
        try {
            const client = getConvexClient()
            if (!client) return

            const serverCart = await client.query(api.queries.getCart, {
                userId: convexUserId.value
            })

            items.value = serverCart.map(dbItem => ({
                product: dbItem.productData,
                quantity: dbItem.quantity
            }))
        } catch (e) {
            console.error('Fetch server cart failed', e)
        }
    }

    // --- Actions ---

    async function addItem(product, quantity = 1) {
        // Normalization
        const productData = {
            id: product.id || product.productId, // Handle both ID formats
            slug: product.slug,
            name: product.name,
            price: product.price,
            comparePrice: product.comparePrice,
            // Store only the first image or main image to save space/bandwidth
            image: Array.isArray(product.images) ? product.images[0] : (product.image || null),
            category: product.category,
            stock: product.stock
        }

        // Optimistic Update
        const existingIndex = items.value.findIndex(i => i.product.id === productData.id)
        if (existingIndex >= 0) {
            items.value[existingIndex].quantity += quantity
        } else {
            items.value.push({ product: productData, quantity })
        }

        // DB Sync
        if (isAuthenticated.value && convexUserId.value) {
            try {
                const client = getConvexClient()
                if (client) {
                    await client.mutation(api.mutations.addToCart, {
                        userId: convexUserId.value,
                        productId: productData.id,
                        productData: productData,
                        quantity
                    })
                }
            } catch (e) {
                console.error('DB Add failed:', e)
                // Revert optimistic update? 
                // Creating complex revert logic might be overkill, simplest is to re-fetch or warn.
                // For now, just log.
            }
        }

        openModal('cart')
    }

    async function removeItem(productId) {
        // Optimistic
        const index = items.value.findIndex(i => i.product.id === productId)
        if (index === -1) return

        items.value.splice(index, 1)

        // DB Sync
        if (isAuthenticated.value && convexUserId.value) {
            try {
                const client = getConvexClient()
                if (client) {
                    await client.mutation(api.mutations.removeFromCart, {
                        userId: convexUserId.value,
                        productId
                    })
                }
            } catch (e) {
                console.error('DB Remove failed:', e)
            }
        }
    }

    async function updateQuantity(productId, quantity) {
        if (quantity <= 0) {
            return removeItem(productId)
        }

        const item = items.value.find(i => i.product.id === productId)
        if (!item) return

        const maxStock = item.product.stock || 99
        const newQty = Math.min(quantity, maxStock)

        if (item.quantity === newQty) return

        // Optimistic
        item.quantity = newQty

        // DB Sync
        if (isAuthenticated.value && convexUserId.value) {
            try {
                const client = getConvexClient()
                if (client) {
                    await client.mutation(api.mutations.updateCartQuantity, {
                        userId: convexUserId.value,
                        productId,
                        quantity: newQty
                    })
                }
            } catch (e) {
                console.error('DB Update Quantity failed:', e)
            }
        }
    }

    async function clearCart() {
        items.value = []

        if (isAuthenticated.value && convexUserId.value) {
            try {
                const client = getConvexClient()
                if (client) {
                    await client.mutation(api.mutations.clearCart, {
                        userId: convexUserId.value
                    })
                }
            } catch (e) {
                console.error('DB Clear failed:', e)
            }
        }
    }

    // --- Computed ---

    const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

    const subtotal = computed(() => {
        return items.value.reduce((sum, item) => {
            return sum + (item.product.price * item.quantity)
        }, 0)
    })

    const savings = computed(() => {
        return items.value.reduce((sum, item) => {
            if (item.product.comparePrice && item.product.comparePrice > item.product.price) {
                return sum + ((item.product.comparePrice - item.product.price) * item.quantity)
            }
            return sum
        }, 0)
    })

    const isOpen = computed(() => {
        const { activeModal } = useUI()
        return activeModal.value === 'cart'
    })

    // --- Helpers ---

    function isInCart(productId) {
        return items.value.some(item => item.product.id === productId)
    }

    function getCartItem(productId) {
        return items.value.find(item => item.product.id === productId)
    }

    function closeCart() {
        const router = window.__vueRouter
        if (router?.currentRoute?.value?.hash === '#cart') {
            router.push({ hash: '' })
        } else {
            const { closeModalWithoutNavigation } = useUI()
            closeModalWithoutNavigation() // This was buggy in old code? make sure it exists
        }
    }

    function getCheckoutItems() {
        return items.value.map(item => ({
            productId: item.product.id,
            productSlug: item.product.slug,
            productName: item.product.name,
            productPrice: item.product.price,
            productImage: item.product.image || (Array.isArray(item.product.images) ? item.product.images[0] : null),
            quantity: item.quantity,
            subtotal: item.product.price * item.quantity
        }))
    }

    return {
        items,
        isOpen,
        isSyncing,
        itemCount,
        subtotal,
        savings,
        addItem,
        removeItem,
        updateQuantity,
        incrementQuantity: (id) => {
            const item = items.value.find(i => i.product.id === id)
            if (item) updateQuantity(id, item.quantity + 1)
        },
        decrementQuantity: (id) => {
            const item = items.value.find(i => i.product.id === id)
            if (item) updateQuantity(id, item.quantity - 1)
        },
        clearCart,
        isInCart,
        getCartItem,
        closeCart,
        openCart: () => openModal('cart'),
        toggleCart: () => isOpen.value ? closeCart() : openModal('cart'),
        getCheckoutItems,
        syncCart
    }
}
