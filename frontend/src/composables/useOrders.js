/**
 * Orders Composable
 * 
 * Handles order placement, tracking, and history.
 * Integrates with the Cloudflare Worker backend + Convex.
 * 
 * Usage:
 *   import { useOrders } from '@/composables/useOrders'
 *   const { orders, placeOrder, trackOrder } = useOrders()
 * 
 * @see /docs/FRONTEND.md for full documentation
 */

import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useCart } from '@/composables/useCart'

// ==================== CONSTANTS ====================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

// ==================== STATE ====================

const orders = ref([])
const currentOrder = ref(null)
const isLoading = ref(false)
const error = ref(null)

// ==================== COMPUTED ====================

const pendingOrders = computed(() =>
    orders.value.filter(o => ['PENDING_VERIFICATION', 'PAYMENT_VERIFIED', 'PROCESSING'].includes(o.status))
)

const completedOrders = computed(() =>
    orders.value.filter(o => o.status === 'DELIVERED')
)

const activeOrders = computed(() =>
    orders.value.filter(o => !['DELIVERED', 'CANCELLED', 'FAILED'].includes(o.status))
)

// ==================== ORDER STATUS HELPERS ====================

const ORDER_STATUSES = {
    PENDING_VERIFICATION: {
        label: 'Pending Verification',
        description: 'Waiting for payment verification',
        color: 'warning',
        icon: '⏳'
    },
    PAYMENT_VERIFIED: {
        label: 'Payment Verified',
        description: 'Payment confirmed, preparing order',
        color: 'info',
        icon: '✓'
    },
    PROCESSING: {
        label: 'Processing',
        description: 'Order is being prepared',
        color: 'info',
        icon: '📦'
    },
    SHIPPED: {
        label: 'Shipped',
        description: 'Order is on the way',
        color: 'primary',
        icon: '🚚'
    },
    DELIVERED: {
        label: 'Delivered',
        description: 'Order delivered successfully',
        color: 'success',
        icon: '✅'
    },
    CANCELLED: {
        label: 'Cancelled',
        description: 'Order was cancelled',
        color: 'error',
        icon: '❌'
    },
    FAILED: {
        label: 'Failed',
        description: 'Order failed',
        color: 'error',
        icon: '⚠️'
    }
}

function getStatusInfo(status) {
    return ORDER_STATUSES[status] || {
        label: status,
        description: '',
        color: 'default',
        icon: '•'
    }
}

// ==================== API METHODS ====================

/**
 * Place a new order
 */
async function placeOrder(shippingInfo) {
    const { getToken } = useAuth()
    const { items, subtotal, clearCart, getCheckoutItems } = useCart()

    if (!items.value.length) {
        error.value = 'Cart is empty'
        return null
    }

    isLoading.value = true
    error.value = null

    try {
        const headers = {
            'Content-Type': 'application/json',
        }

        const token = getToken()
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        // Calculate shipping fee (can be dynamic based on location)
        const shippingFee = 50 // Fixed ₹50 shipping
        const total = subtotal.value + shippingFee

        const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                items: items.value.map(item => ({
                    id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    price: item.product.price,
                    images: item.product.images,
                    quantity: item.quantity,
                })),
                shipping: {
                    name: shippingInfo.name,
                    email: shippingInfo.email,
                    phone: shippingInfo.phone,
                    address: shippingInfo.address,
                    city: shippingInfo.city,
                    state: shippingInfo.state,
                    postal: shippingInfo.postal,
                    country: shippingInfo.country || 'India',
                },
                subtotal: subtotal.value,
                shippingFee,
                total,
                isGuest: !token,
            }),
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Failed to place order')
        }

        // Clear cart on successful order
        clearCart()

        // Store order info
        currentOrder.value = {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            status: data.status,
            total,
        }

        return data
    } catch (e) {
        console.error('Order placement failed:', e)
        error.value = e.message
        return null
    } finally {
        isLoading.value = false
    }
}

/**
 * Load user's orders
 */
async function loadOrders() {
    const { getToken, isAuthenticated } = useAuth()

    if (!isAuthenticated.value) {
        orders.value = []
        return
    }

    isLoading.value = true
    error.value = null

    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        })

        const data = await response.json()

        if (response.ok) {
            orders.value = data.orders || []
        }
    } catch (e) {
        console.error('Load orders failed:', e)
        error.value = e.message
    } finally {
        isLoading.value = false
    }
}

/**
 * Get single order by ID
 */
async function getOrder(orderId) {
    const { getToken } = useAuth()

    isLoading.value = true
    error.value = null

    try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Order not found')
        }

        return data.order
    } catch (e) {
        console.error('Get order failed:', e)
        error.value = e.message
        return null
    } finally {
        isLoading.value = false
    }
}

/**
 * Track order by order number (public)
 */
async function trackOrder(orderNumber) {
    isLoading.value = true
    error.value = null

    try {
        const response = await fetch(`${API_URL}/api/orders/track/${orderNumber}`)
        const data = await response.json()

        if (!response.ok) {
            throw new Error(data.error || 'Order not found')
        }

        return data
    } catch (e) {
        console.error('Track order failed:', e)
        error.value = e.message
        return null
    } finally {
        isLoading.value = false
    }
}

// ==================== UTILITY METHODS ====================

/**
 * Format price in INR
 */
function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(price)
}

/**
 * Format date
 */
function formatDate(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

// ==================== EXPORT ====================

export function useOrders() {
    return {
        // State
        orders,
        currentOrder,
        isLoading,
        error,

        // Computed
        pendingOrders,
        completedOrders,
        activeOrders,

        // Methods
        placeOrder,
        loadOrders,
        getOrder,
        trackOrder,

        // Helpers
        getStatusInfo,
        formatPrice,
        formatDate,
        ORDER_STATUSES,
    }
}
