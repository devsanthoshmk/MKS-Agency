/**
 * Wishlist Composable
 * Handles wishlist state with localStorage persistence
 */

import { ref, computed, watch } from 'vue'
import { useUI } from '@/composables/useUI'

const { activeModal } = useUI()
const WISHLIST_STORAGE_KEY = 'mks_wishlist'

// Wishlist items (product objects)
const items = ref([])
// // test
// watch(activeModal, (newVal) => {
//     console.info(activeModal, "changed")
// })
const isOpen = computed(() => {
    console.info("Wishlist isOpen:", activeModal?.value === 'wishlist', activeModal?.value);
    return activeModal?.value === 'wishlist';
})

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
function saveWishlist() {
    try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items.value))
    } catch (e) {
        console.warn('Wishlist save failed:', e)
    }
}

// Watch for changes and save
watch(items, saveWishlist, { deep: true })

// Initialize on import
initWishlist()

export function useWishlist() {
    // Item count
    const itemCount = computed(() => items.value.length)

    // Add to wishlist
    function addItem(product) {
        if (!isInWishlist(product.id)) {
            items.value.push({
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                comparePrice: product.comparePrice,
                images: product.images,
                stock: product.stock,
                shortDescription: product.shortDescription,
                addedAt: new Date().toISOString()
            })
        }
    }

    // Remove from wishlist
    function removeItem(productId) {
        const index = items.value.findIndex(item => item.id === productId)
        if (index >= 0) {
            items.value.splice(index, 1)
        }
    }

    // Toggle wishlist item
    function toggleItem(product) {
        if (isInWishlist(product.id)) {
            removeItem(product.id)
        } else {
            addItem(product)
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

    return {
        // State
        items,
        isOpen,

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
        closeWishlist
    }
}
