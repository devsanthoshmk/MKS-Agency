/**
 * UI Composable
 * Handles global UI state like modals, panels, and notifications
 */

import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// UI State
const activeModal = ref(null) // 'product', 'checkout', 'orders', 'auth'
const modalData = ref(null)
const notifications = ref([])
const isLoading = ref(false)

// Toast notifications
let toastId = 0

export function useUI() {
    const route = useRoute()
    const router = useRouter()

    // Modal management
    function openModal(type, data = null) {
        activeModal.value = type
        modalData.value = data
        document.body.style.overflow = 'hidden'
    }

    function closeModal() {
        activeModal.value = null
        modalData.value = null
        document.body.style.overflow = ''

        // Navigate back if on modal route
        if (route.name === 'product-detail') {
            router.push('/products')
        } else if (route.name === 'checkout' || route.name === 'orders') {
            router.back()
        }
    }

    function closeAllOverlays() {
        activeModal.value = null
        modalData.value = null
        document.body.style.overflow = ''
    }

    // Check if modal is open
    const isModalOpen = computed(() => activeModal.value !== null)

    // Toast notifications
    function showToast(message, type = 'info', duration = 3000) {
        const id = ++toastId
        const toast = { id, message, type, visible: true }
        notifications.value.push(toast)

        setTimeout(() => {
            removeToast(id)
        }, duration)

        return id
    }

    function removeToast(id) {
        const index = notifications.value.findIndex(n => n.id === id)
        if (index >= 0) {
            notifications.value.splice(index, 1)
        }
    }

    // Convenience toast methods
    function success(message, duration) {
        return showToast(message, 'success', duration)
    }

    function warning(message, duration) {
        return showToast(message, 'warning', duration)
    }

    function error(message, duration) {
        return showToast(message, 'error', duration)
    }

    function info(message, duration) {
        return showToast(message, 'info', duration)
    }

    // Loading state
    function startLoading() {
        isLoading.value = true
    }

    function stopLoading() {
        isLoading.value = false
    }

    // Escape key handler
    function handleEscapeKey(event) {
        if (event.key === 'Escape') {
            closeModal()
        }
    }

    // Setup escape key listener
    function setupEscapeListener() {
        document.addEventListener('keydown', handleEscapeKey)
    }

    function removeEscapeListener() {
        document.removeEventListener('keydown', handleEscapeKey)
    }

    return {
        // State
        activeModal,
        modalData,
        notifications,
        isLoading,

        // Computed
        isModalOpen,

        // Modal methods
        openModal,
        closeModal,
        closeAllOverlays,

        // Toast methods
        showToast,
        removeToast,
        success,
        warning,
        error,
        info,

        // Loading methods
        startLoading,
        stopLoading,

        // Listeners
        setupEscapeListener,
        removeEscapeListener
    }
}
