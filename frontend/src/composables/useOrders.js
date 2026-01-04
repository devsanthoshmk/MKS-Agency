/**
 * Orders Composable
 * Handles order creation and status tracking
 */

import { ref, computed } from 'vue'
import { useAuth } from './useAuth'
import { useCart } from './useCart'

const API_BASE = '/api'

// Orders state
const orders = ref([])
const currentOrder = ref(null)
const isLoading = ref(false)
const error = ref(null)
const isOrdersModalOpen = ref(false)

// Order status labels and colors
const ORDER_STATUSES = {
    PENDING_VERIFICATION: {
        label: 'Awaiting Payment Verification',
        color: 'warning',
        icon: '⏳',
        description: 'We will contact you shortly to verify your payment.'
    },
    PAYMENT_VERIFIED: {
        label: 'Payment Verified',
        color: 'success',
        icon: '✓',
        description: 'Your payment has been verified. Order is being prepared.'
    },
    PROCESSING: {
        label: 'Processing',
        color: 'info',
        icon: '📦',
        description: 'Your order is being packed and prepared for shipping.'
    },
    SHIPPED: {
        label: 'Shipped',
        color: 'primary',
        icon: '🚚',
        description: 'Your order is on its way!'
    },
    DELIVERED: {
        label: 'Delivered',
        color: 'success',
        icon: '✅',
        description: 'Your order has been delivered successfully.'
    },
    CANCELLED: {
        label: 'Cancelled',
        color: 'error',
        icon: '❌',
        description: 'This order has been cancelled.'
    },
    FAILED: {
        label: 'Failed',
        color: 'error',
        icon: '⚠️',
        description: 'There was an issue with this order.'
    }
}

export function useOrders() {
    const { token, getAuthHeader, isAuthenticated } = useAuth()
    const { getCheckoutItems, clearCart } = useCart()

    // Fetch user orders
    async function fetchOrders() {
        if (!isAuthenticated.value) {
            orders.value = []
            return
        }

        isLoading.value = true
        error.value = null

        try {
            const response = await fetch(`${API_BASE}/orders`, {
                headers: getAuthHeader()
            })

            if (!response.ok) {
                throw new Error('Failed to fetch orders')
            }

            const data = await response.json()
            orders.value = data.orders || []
        } catch (e) {
            error.value = e.message || 'Failed to fetch orders'
            console.error('Fetch orders error:', e)
        } finally {
            isLoading.value = false
        }
    }

    // Create new order
    async function createOrder(orderData) {
        isLoading.value = true
        error.value = null

        try {
            const cartItems = getCheckoutItems()

            if (!cartItems.length) {
                throw new Error('Cart is empty')
            }

            const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0)
            const shippingFee = subtotal >= 500 ? 0 : 50 // Free shipping above ₹500
            const total = subtotal + shippingFee

            const response = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify({
                    items: cartItems,
                    shipping: orderData.shipping,
                    subtotal,
                    shippingFee,
                    total,
                    isGuest: orderData.isGuest || false,
                    guestInfo: orderData.guestInfo || null
                })
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.message || 'Failed to create order')
            }

            const data = await response.json()

            // Clear cart after successful order
            clearCart()

            // Add to orders list
            orders.value.unshift(data.order)
            currentOrder.value = data.order

            return {
                success: true,
                order: data.order,
                orderNumber: data.order.orderNumber,
                verificationRequired: data.verificationRequired
            }
        } catch (e) {
            error.value = e.message || 'Failed to create order'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    // Get order by ID
    async function getOrder(orderId) {
        isLoading.value = true
        error.value = null

        try {
            const response = await fetch(`${API_BASE}/orders/${orderId}`, {
                headers: getAuthHeader()
            })

            if (!response.ok) {
                throw new Error('Order not found')
            }

            const data = await response.json()
            currentOrder.value = data.order
            return data.order
        } catch (e) {
            error.value = e.message || 'Failed to fetch order'
            return null
        } finally {
            isLoading.value = false
        }
    }

    // Get order status info
    function getStatusInfo(status) {
        return ORDER_STATUSES[status] || {
            label: status,
            color: 'default',
            icon: '•',
            description: ''
        }
    }

    // Open/close orders modal
    function openOrdersModal(order = null) {
        if (order) {
            currentOrder.value = order
        }
        isOrdersModalOpen.value = true
    }

    function closeOrdersModal() {
        isOrdersModalOpen.value = false
        currentOrder.value = null
    }

    // Format price
    function formatPrice(price) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(price)
    }

    // Format date
    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Computed
    const pendingOrders = computed(() =>
        orders.value.filter(o => o.status === 'PENDING_VERIFICATION')
    )

    const activeOrders = computed(() =>
        orders.value.filter(o =>
            ['PAYMENT_VERIFIED', 'PROCESSING', 'SHIPPED'].includes(o.status)
        )
    )

    const completedOrders = computed(() =>
        orders.value.filter(o => o.status === 'DELIVERED')
    )

    return {
        // State
        orders,
        currentOrder,
        isLoading,
        error,
        isOrdersModalOpen,

        // Computed
        pendingOrders,
        activeOrders,
        completedOrders,

        // Constants
        ORDER_STATUSES,

        // Methods
        fetchOrders,
        createOrder,
        getOrder,
        getStatusInfo,
        openOrdersModal,
        closeOrdersModal,
        formatPrice,
        formatDate
    }
}
