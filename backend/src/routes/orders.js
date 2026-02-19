import { AutoRouter } from 'itty-router'
import { json, error } from '../utils/response'
import { generateOrderNumber } from '../utils/helpers'
import { requireAuth } from '../lib/auth'
import { sendEmail } from '../lib/email'

const router = AutoRouter({ base: '/api/orders' })

/**
 * Create order
 * POST /api/orders
 * Body: { items, shipping, subtotal, shippingFee, total, isGuest, guestInfo }
 */
router.post('/', async (request, env) => {
    const { convex } = request
    try {
        const { items, shipping, subtotal, shippingFee, total, isGuest } = await request.json()

        if (!items?.length) {
            return error('Cart is empty')
        }

        if (!shipping?.name || !shipping?.phone || !shipping?.email || !shipping?.address) {
            return error('Shipping information incomplete')
        }

        const orderNumber = generateOrderNumber()

        // Get user ID from token if authenticated
        let userId = null
        const claims = await requireAuth(request, env)
        if (claims?.convexUserId) {
            userId = claims.convexUserId
        }

        // Create order in Convex
        const orderId = await convex.mutation('mutations:createOrder', {
            orderNumber,
            userId: userId || undefined,
            guestEmail: isGuest ? shipping.email : undefined,
            subtotal,
            shippingFee,
            total,
            shippingName: shipping.name,
            shippingPhone: shipping.phone,
            shippingEmail: shipping.email,
            shippingAddress: shipping.address,
            shippingCity: shipping.city || '',
            shippingState: shipping.state || '',
            shippingPostal: shipping.postal || '',
            shippingCountry: shipping.country || 'India',
            items: items.map(item => ({
                productId: item.id || item.productId,
                productName: item.name || item.productName,
                productSlug: item.slug || item.productSlug || item.id,
                productImage: item.image || item.images?.[0] || item.productImage,
                productPrice: item.price || item.productPrice,
                quantity: item.quantity,
            })),
        })

        // Send order confirmation email
        await sendEmail(env, 'order-confirmation', {
            to: shipping.email,
            name: shipping.name,
            orderNumber,
            items,
            total
        })

        // Send admin notification email
        await sendEmail(env, 'admin-alert', {
            type: 'new-order',
            orderNumber,
            customerName: shipping.name,
            total
        })

        return json({
            success: true,
            orderId,
            orderNumber,
            status: 'PENDING_VERIFICATION',
            verificationRequired: isGuest
        })
    } catch (e) {
        console.error('Order creation error:', e)
        return error('Failed to create order', 500)
    }
})

/**
 * Get user's orders
 * GET /api/orders
 * Header: Authorization: Bearer <token>
 */
router.get('/', async (request, env) => {
    const { convex } = request
    const claims = await requireAuth(request, env)
    if (!claims) {
        return error('Unauthorized', 401)
    }

    try {
        if (!claims.convexUserId) {
            return json({ orders: [] })
        }

        const orders = await convex.query('queries:getUserOrders', {
            userId: claims.convexUserId,
        })

        return json({ orders })
    } catch (e) {
        console.error('Get orders error:', e)
        return json({ orders: [] })
    }
})

/**
 * Get single order by ID
 * GET /api/orders/:id
 */
router.get('/:id', async (request, env) => {
    const { convex, params } = request
    const claims = await requireAuth(request, env)
    if (!claims) {
        return error('Unauthorized', 401)
    }

    try {
        const order = await convex.query('queries:getOrderById', {
            orderId: params.id,
        })

        if (!order) {
            return error('Order not found', 404)
        }

        // Check ownership
        if (order.userId !== claims.convexUserId && order.guestEmail !== claims.email) {
            return error('Unauthorized', 403)
        }

        return json({ order })
    } catch (e) {
        console.error('Get order error:', e)
        return error('Failed to get order', 500)
    }
})

/**
 * Track order by order number (public)
 * GET /api/orders/track/:orderNumber
 */
router.get('/track/:orderNumber', async (request, env) => {
    const { convex, params } = request
    try {
        const order = await convex.query('queries:getOrderByNumber', {
            orderNumber: params.orderNumber,
        })

        if (!order) {
            return error('Order not found', 404)
        }

        // Return limited info for public tracking
        return json({
            orderNumber: order.orderNumber,
            status: order.status,
            createdAt: order.createdAt,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt,
            trackingUrl: order.trackingUrl,
            trackingNumber: order.trackingNumber,
            courierName: order.courierName,
            history: order.history,
        })
    } catch (e) {
        console.error('Track order error:', e)
        return error('Failed to track order', 500)
    }
})

export default router
