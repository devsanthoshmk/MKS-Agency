import { AutoRouter } from 'itty-router'
import { json, error } from '../utils/response'
import { getClientIP } from '../utils/helpers'
import { createJWT } from '../lib/jwt'
import { requireAdmin } from '../lib/auth'
import { sendEmail } from '../lib/email'

const router = AutoRouter({ base: '/api/admin' })

/**
 * Admin login
 * POST /api/admin/login
 * Body: { passcode: string }
 */
router.post('/login', async (request, env) => {
    const ip = getClientIP(request)


    try {
        const { passcode } = await request.json()

        if (!passcode) {
            return error('Passcode required')
        }

        // Get stored passcode from KV (or use env var as fallback)
        let validPasscode = false
        try {
            const storedPasscode = await env.ADMIN_SECRETS?.get('passcode')
            validPasscode = storedPasscode ? (passcode === storedPasscode) : (passcode === env.ADMIN_PASSCODE)
        } catch {
            validPasscode = passcode === env.ADMIN_PASSCODE
        }

        if (!validPasscode) {
            return error('Invalid passcode', 401)
        }


        // Create admin JWT (shorter expiry)
        const token = await createJWT(
            { isAdmin: true },
            env.JWT_SECRET,
            604800 // 7 days
        )

        return json({ success: true, token })
    } catch (e) {
        console.error('Admin login error:', e)
        return error('Login failed', 500)
    }
})

/**
 * Get all orders (admin)
 * GET /api/admin/orders
 * Query: ?status=PENDING_VERIFICATION&limit=50
 */
router.get('/orders', async (request, env) => {
    const { convex } = request
    const admin = await requireAdmin(request, env)
    if (!admin) {
        return error('Unauthorized', 401)
    }

    try {
        const url = new URL(request.url)
        const status = url.searchParams.get('status')
        const limit = parseInt(url.searchParams.get('limit') || '50')

        const orders = await convex.query('queries:getAllOrders', {
            status: status || undefined,
            limit,
        })

        return json({ orders })
    } catch (e) {
        console.error('Admin get orders error:', e)
        return json({ orders: [] })
    }
})

/**
 * Update order status (admin)
 * PUT /api/admin/orders/:id/status
 * Body: { status, trackingUrl, trackingNumber, courierName, note }
 */
router.put('/orders/:id/status', async (request, env) => {
    const { convex, params } = request
    const admin = await requireAdmin(request, env)
    if (!admin) {
        return error('Unauthorized', 401)
    }

    try {
        const { status, trackingUrl, trackingNumber, courierName, note, failureReason, cancellationReason, adminNotes } = await request.json()
        const orderId = params.id

        const validStatuses = [
            'PENDING_VERIFICATION',
            'PAYMENT_VERIFIED',
            'PROCESSING',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED',
            'FAILED'
        ]

        if (!validStatuses.includes(status)) {
            return error('Invalid status')
        }

        await convex.mutation('mutations:updateOrderStatus', {
            orderId,
            status,
            trackingUrl: trackingUrl || undefined,
            trackingNumber: trackingNumber || undefined,
            courierName: courierName || undefined,
            note: note || undefined,
            failureReason: failureReason || undefined,
            cancellationReason: cancellationReason || undefined,
            adminNotes: adminNotes || undefined,
        })

        // Get updated order to send email notification
        const order = await convex.query('queries:getOrderById', { orderId })

        // Define status details
        const statusMap = {
            'PENDING_VERIFICATION': {
                label: 'Pending Verification',
                description: 'Your order is currently being verified. We will update you shortly.'
            },
            'PAYMENT_VERIFIED': {
                label: 'Payment Verified',
                description: 'We have received your payment. Your order is now being prepared.'
            },
            'PROCESSING': {
                label: 'Processing',
                description: 'Your order is currently being processed and packed.'
            },
            'SHIPPED': {
                label: 'Shipped',
                description: 'Great news! Your order is on its way to you.'
            },
            'DELIVERED': {
                label: 'Delivered',
                description: 'Your order has been delivered. Thank you for shopping with us!'
            },
            'CANCELLED': {
                label: 'Cancelled',
                description: 'Your order has been cancelled. If this was a mistake, please contact us.'
            },
            'FAILED': {
                label: 'Payment/Order Failed',
                description: 'There was an issue with your order or payment. Please contact support.'
            }
        }

        const statusInfo = statusMap[status] || { label: status, description: '' }

        // Send status update email
        if (order && ['PAYMENT_VERIFIED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'].includes(status)) {
            await sendEmail(env, 'status-update', {
                to: order.shippingEmail,
                name: order.shippingName,
                orderNumber: order.orderNumber,
                status,
                statusLabel: statusInfo.label,
                statusDescription: statusInfo.description,
                trackingUrl,
                trackingNumber,
                courierName,
            })
        }

        return json({ success: true, order })
    } catch (e) {
        console.error('Status update error:', e)
        return error('Failed to update status', 500)
    }
})

/**
 * Update order details (admin) - General update endpoint
 * PUT /api/admin/orders/:id
 * This uses the same logic as the status update but handles the general update request
 */
router.put('/orders/:id', async (request, env) => {
    const { convex, params } = request
    const admin = await requireAdmin(request, env)
    if (!admin) {
        return error('Unauthorized', 401)
    }

    try {
        const body = await request.json()
        const { status, trackingUrl, trackingNumber, note, failureReason, cancellationReason, adminNotes } = body
        // Handle courierName vs courierService mismatch from frontend
        const courierName = body.courierName || body.courierService

        const orderId = params.id

        const validStatuses = [
            'PENDING_VERIFICATION',
            'PAYMENT_VERIFIED',
            'PROCESSING',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED',
            'FAILED'
        ]

        if (!validStatuses.includes(status)) {
            return error('Invalid status')
        }

        await convex.mutation('mutations:updateOrderStatus', {
            orderId,
            status,
            trackingUrl: trackingUrl || undefined,
            trackingNumber: trackingNumber || undefined,
            courierName: courierName || undefined,
            note: note || undefined,
            failureReason: failureReason || undefined,
            cancellationReason: cancellationReason || undefined,
            adminNotes: adminNotes || undefined,
        })

        // Get updated order to send email notification
        const order = await convex.query('queries:getOrderById', { orderId })

        // Define status details
        const statusMap = {
            'PENDING_VERIFICATION': {
                label: 'Pending Verification',
                description: 'Your order is currently being verified. We will update you shortly.'
            },
            'PAYMENT_VERIFIED': {
                label: 'Payment Verified',
                description: 'We have received your payment. Your order is now being prepared.'
            },
            'PROCESSING': {
                label: 'Processing',
                description: 'Your order is currently being processed and packed.'
            },
            'SHIPPED': {
                label: 'Shipped',
                description: 'Great news! Your order is on its way to you.'
            },
            'DELIVERED': {
                label: 'Delivered',
                description: 'Your order has been delivered. Thank you for shopping with us!'
            },
            'CANCELLED': {
                label: 'Cancelled',
                description: 'Your order has been cancelled. If this was a mistake, please contact us.'
            },
            'FAILED': {
                label: 'Payment/Order Failed',
                description: 'There was an issue with your order or payment. Please contact support.'
            }
        }

        const statusInfo = statusMap[status] || { label: status, description: '' }

        // Send status update email
        if (order && ['PAYMENT_VERIFIED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'].includes(status)) {
            await sendEmail(env, 'status-update', {
                to: order.shippingEmail,
                name: order.shippingName,
                orderNumber: order.orderNumber,
                status,
                statusLabel: statusInfo.label,
                statusDescription: statusInfo.description,
                trackingUrl,
                trackingNumber,
                courierName,
            })
        }

        return json({ success: true, order })
    } catch (e) {
        console.error('Order update error:', e)
        return error('Failed to update order', 500)
    }
})

/**
 * Get order analytics (admin)
 * GET /api/admin/analytics
 */
router.get('/analytics', async (request, env) => {
    const { convex } = request
    const admin = await requireAdmin(request, env)
    if (!admin) {
        return error('Unauthorized', 401)
    }

    try {
        const analytics = await convex.query('queries:getOrderAnalytics', {})
        return json(analytics)
    } catch (e) {
        console.error('Analytics error:', e)
        return json({
            totalOrders: 0,
            pendingVerification: 0,
            paymentVerified: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            failed: 0,
            verifiedRevenue: 0,
            completedRevenue: 0,
            ordersToday: 0,
            ordersWeek: 0,
            ordersMonth: 0
        })
    }
})

/**
 * Manage products via Convex
 * PUT /api/admin/products
 * Body: { action: 'create'|'update'|'delete', product: {...} }
 */
router.put('/products', async (request, env) => {
    const { convex } = request
    const admin = await requireAdmin(request, env)
    if (!admin) {
        return error('Unauthorized', 401)
    }

    try {
        const body = await request.json()
        const { action, product } = body

        if (action === 'create' && product) {
            const now = Date.now()
            await convex.mutation('mutations:createProduct', {
                productId: product.id || 'prod_' + now,
                slug: product.slug,
                name: product.name,
                description: product.description || undefined,
                shortDescription: product.shortDescription || undefined,
                price: Number(product.price),
                comparePrice: product.comparePrice ? Number(product.comparePrice) : undefined,
                category: product.category || undefined,
                subcategory: product.subcategory || undefined,
                images: product.images || undefined,
                stock: Number(product.stock) || 0,
                isActive: product.isActive !== false,
                tags: product.tags?.length ? product.tags : undefined,
                benefits: product.benefits?.length ? product.benefits : undefined,
                ingredients: product.ingredients || undefined,
                usage: product.usage || undefined,
                weight: product.weight || undefined,
            })
            return json({ success: true, action: 'created' })
        }

        if (action === 'update' && product && product._id) {
            const { _id, id, ...updates } = product
            await convex.mutation('mutations:updateProduct', {
                _id,
                productId: id || updates.productId,
                ...updates,
                price: updates.price !== undefined ? Number(updates.price) : undefined,
                comparePrice: updates.comparePrice ? Number(updates.comparePrice) : undefined,
                stock: updates.stock !== undefined ? Number(updates.stock) : undefined,
            })
            return json({ success: true, action: 'updated' })
        }

        if (action === 'delete' && product && product._id) {
            await convex.mutation('mutations:deleteProduct', {
                _id: product._id,
            })
            return json({ success: true, action: 'deleted' })
        }

        // Fallback: bulk seed (for migration from JSON)
        if (body.products && Array.isArray(body.products)) {
            await convex.mutation('mutations:seedProducts', {
                products: body.products,
            })
            return json({ success: true, action: 'seeded' })
        }

        return error('Invalid request. Expected action: create, update, or delete')
    } catch (e) {
        console.error('Admin products error:', e)
        return error('Failed to manage products', 500)
    }
})

export default router
