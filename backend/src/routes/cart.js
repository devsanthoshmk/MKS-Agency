import { AutoRouter } from 'itty-router'
import { json, error } from '../utils/response'
import { requireAuth } from '../lib/auth'

const router = AutoRouter({ base: '/api/cart' })

/**
 * Get user's cart
 * GET /api/cart
 * Header: Authorization: Bearer <token>
 */
router.get('/', async (request, env) => {
    const { convex } = request
    const claims = await requireAuth(request, env)
    if (!claims || !claims.convexUserId) {
        return error('Unauthorized', 401)
    }

    try {
        const cart = await convex.query('queries:getCart', {
            userId: claims.convexUserId,
        })

        // Map Convex cart items to frontend format
        const formattedCart = cart.map(item => ({
            product: {
                ...item.productData,
                images: item.productData.image ? [item.productData.image] : undefined,
                stock: item.productData.stock
            },
            quantity: item.quantity
        }))

        return json({ cart: formattedCart })
    } catch (e) {
        console.error('Get cart error:', e)
        return error('Failed to fetch cart', 500)
    }
})

/**
 * Add item to cart
 * POST /api/cart/add
 * Body: { product, quantity }
 */
router.post('/add', async (request, env) => {
    const { convex } = request
    const claims = await requireAuth(request, env)
    if (!claims || !claims.convexUserId) {
        return error('Unauthorized', 401)
    }

    try {
        const { product, quantity } = await request.json()

        // Ensure product data is clean and matches schema
        const productData = {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            comparePrice: product.comparePrice,
            image: product.images?.[0] || product.image,
            category: product.category,
            stock: product.stock
        }

        await convex.mutation('mutations:addToCart', {
            userId: claims.convexUserId,
            productId: product.id,
            productData,
            quantity: quantity || 1
        })

        return json({ success: true })
    } catch (e) {
        console.error('Add to cart error:', e)
        return error('Failed to add item', 500)
    }
})

/**
 * Update cart item quantity
 * POST /api/cart/update
 * Body: { productId, quantity }
 */
router.post('/update', async (request, env) => {
    const { convex } = request
    const claims = await requireAuth(request, env)
    if (!claims || !claims.convexUserId) {
        return error('Unauthorized', 401)
    }

    try {
        const { productId, quantity } = await request.json()

        await convex.mutation('mutations:updateCartQuantity', {
            userId: claims.convexUserId,
            productId,
            quantity
        })

        return json({ success: true })
    } catch (e) {
        console.error('Update cart error:', e)
        return error('Failed to update cart', 500)
    }
})

/**
 * Remove item from cart
 * POST /api/cart/remove
 * Body: { productId }
 */
router.post('/remove', async (request, env) => {
    const { convex } = request
    const claims = await requireAuth(request, env)
    if (!claims || !claims.convexUserId) {
        return error('Unauthorized', 401)
    }

    try {
        const { productId } = await request.json()

        await convex.mutation('mutations:removeFromCart', {
            userId: claims.convexUserId,
            productId
        })

        return json({ success: true })
    } catch (e) {
        console.error('Remove from cart error:', e)
        return error('Failed to remove item', 500)
    }
})

/**
 * Clear cart
 * POST /api/cart/clear
 */
router.post('/clear', async (request, env) => {
    const { convex } = request
    const claims = await requireAuth(request, env)
    if (!claims || !claims.convexUserId) {
        return error('Unauthorized', 401)
    }

    try {
        await convex.mutation('mutations:clearCart', {
            userId: claims.convexUserId
        })

        return json({ success: true })
    } catch (e) {
        console.error('Clear cart error:', e)
        return error('Failed to clear cart', 500)
    }
})

/**
 * Sync cart from localStorage to Convex
 * POST /api/cart/sync
 * Body: { items: [...] }
 */
router.post('/sync', async (request, env) => {
    const { convex } = request
    const claims = await requireAuth(request, env)
    if (!claims?.convexUserId) {
        return error('Unauthorized', 401)
    }

    try {
        const { items } = await request.json()

        for (const item of items) {
            await convex.mutation('mutations:addToCart', {
                userId: claims.convexUserId,
                productId: item.id || item.productId,
                productData: {
                    id: item.id,
                    slug: item.slug,
                    name: item.name,
                    price: item.price,
                    comparePrice: item.comparePrice,
                    image: item.images?.[0] || item.image,
                    category: item.category,
                    stock: item.stock,
                },
                quantity: item.quantity || 1,
            })
        }

        const cart = await convex.query('queries:getCart', { userId: claims.convexUserId })
        return json({ success: true, cart })
    } catch (e) {
        console.error('Cart sync error:', e)
        return error('Failed to sync cart', 500)
    }
})

/**
 * Clear cart (DELETE method)
 * DELETE /api/cart
 */
router.delete('/', async (request, env) => {
    const { convex } = request
    const claims = await requireAuth(request, env)
    if (!claims?.convexUserId) {
        return error('Unauthorized', 401)
    }

    try {
        await convex.mutation('mutations:clearCart', { userId: claims.convexUserId })
        return json({ success: true })
    } catch (e) {
        return error('Failed to clear cart', 500)
    }
})

export default router
