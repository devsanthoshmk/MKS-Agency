/**
 * Wishlist Composable
 * Handles wishlist state with localStorage persistence and backend sync
 */

import { ref, computed, watch } from 'vue'
import { useUI } from '@/composables/useUI'
import { useAuth } from '@/composables/useAuth'

const WISHLIST_STORAGE_KEY = 'mks_wishlist'

// Wishlist items (product objects)
const items = ref([])
const isSyncing = ref(false)

// Initialize from localStorage
function initWishlist() {
    try {
        const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
        if (stored) {
            items.value = JSON.parse(stored)
        }
    } catch (e) {
        console.warn('Wishlist load failed:', e)
        items.value = []
    }
}

// Save to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items.value))
    } catch (e) {
        console.warn('Wishlist save failed:', e)
    }
}

// Watch for changes and save
watch(items, saveToLocalStorage, { deep: true })

// Initialize on import, but don't overwrite if already loaded
if (items.value.length === 0) {
    initWishlist()
}

// Sync local wishlist with server
async function syncWishlist() {
    const { isAuthenticated, apiRequest } = useAuth()

    if (!isAuthenticated.value || isSyncing.value) return

    isSyncing.value = true
    try {
        // 1. Push local items to server (merge)
        if (items.value.length > 0) {
            console.log('Syncing local wishlist items to server...')
            await Promise.all(items.value.map(item =>
                apiRequest('/api/wishlist/add', {
                    method: 'POST',
                    body: JSON.stringify({ product: item })
                })
            ))
        }

        // 2. Fetch latest wishlist from server
        console.log('Fetching server wishlist...')
        const data = await apiRequest('/api/wishlist')

        // 3. Update local state
        if (data.wishlist) {
            // Merge logic or simple replace? 
            // Replace is safer to ensure we match server state exactly after sync
            items.value = data.wishlist
        }
    } catch (e) {
        console.error('Wishlist sync failed:', e)
    } finally {
        isSyncing.value = false
    }
}

export function useWishlist() {
    const { isAuthenticated, apiRequest } = useAuth()

    // Sync when user logs in
    watch(isAuthenticated, (newVal) => {
        if (newVal) {
            syncWishlist()
        }
    }, { immediate: true })

    // Item count
    const itemCount = computed(() => items.value.length)

    // Add to wishlist
    async function addItem(product) {
        if (!isInWishlist(product.id)) {
            // Optimistic update
            items.value.push({
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                comparePrice: product.comparePrice,
                images: product.images,
                image: product.image, // Ensure image is present
                stock: product.stock,
                shortDescription: product.shortDescription,
                category: product.category,
                addedAt: new Date().toISOString()
            })

            // Sync with backend
            if (isAuthenticated.value) {
                try {
                    await apiRequest('/api/wishlist/add', {
                        method: 'POST',
                        body: JSON.stringify({
                            product: {
                                ...product,
                                images: undefined,
                                image: product.images?.[0] || product.image
                            }
                        })
                    })
                } catch (e) {
                    console.error('Failed to add item to server wishlist:', e)
                }
            }
        }
    }

    // Remove from wishlist
    async function removeItem(productId) {
        // Optimistic update
        const index = items.value.findIndex(item => item.id === productId)
        if (index >= 0) {
            items.value.splice(index, 1)
        }

        // Sync with backend
        if (isAuthenticated.value) {
            try {
                await apiRequest('/api/wishlist/remove', {
                    method: 'POST',
                    body: JSON.stringify({ productId })
                })
            } catch (e) {
                console.error('Failed to remove item from server wishlist:', e)
            }
        }
    }

    // Toggle wishlist item
    async function toggleItem(product) {
        if (isInWishlist(product.id)) {
            await removeItem(product.id)
        } else {
            await addItem(product)
        }
    }

    // Check if in wishlist
    function isInWishlist(productId) {
        return items.value.some(item => item.id === productId)
    }

    // Clear wishlist
    function clearWishlist() {
        items.value = []
    }

    // Toggle wishlist panel (use router hash)
    function toggleWishlist() {
        const { activeModal } = useUI()
        // Import router in the function to avoid issues at module level
        const router = window.__vueRouter
        if (activeModal.value === 'wishlist') {
            router?.push({ hash: '' })
        } else {
            router?.push({ hash: '#wishlist' })
        }
    }

    function openWishlist() {
        const router = window.__vueRouter
        router?.push({ hash: '#wishlist' })
    }

    function closeWishlist() {
        const router = window.__vueRouter
        // Only navigate if hash exists, otherwise just close the modal
        if (router?.currentRoute?.value?.hash === '#wishlist') {
            router.push({ hash: '' })
        } else {
            const { closeModalWithoutNavigation } = useUI()
            closeModalWithoutNavigation()
        }
    }

    const { activeModal } = useUI()
    const isOpen = computed(() => activeModal.value === 'wishlist')

    return {
        // State
        items,
        isOpen,
        isSyncing,

        // Computed
        itemCount,

        // Methods
        addItem,
        removeItem,
        toggleItem,
        isInWishlist,
        clearWishlist,
        toggleWishlist,
        openWishlist,
        closeWishlist,
        syncWishlist
    }
}
