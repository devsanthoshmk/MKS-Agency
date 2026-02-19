import { AutoRouter } from 'itty-router'
import { json, error } from '../utils/response'
import { requireAuth } from '../lib/auth'

const router = AutoRouter({ base: '/api/wishlist' })

/**
 * Get user's wishlist
 * GET /api/wishlist
 * Header: Authorization: Bearer <token>
 */
router.get('/', async (request, env) => {
    const { convex } = request
    const claims = await requireAuth(request, env)
    if (!claims || !claims.convexUserId) {
        return error('Unauthorized', 401)
    }

    try {
        const wishlist = await convex.query('queries:getWishlist', {
            userId: claims.convexUserId,
        })

        // Map Convex wishlist items to frontend format
        const formattedWishlist = wishlist.map(item => ({
            id: item.productData.id,
            slug: item.productData.slug,
            name: item.productData.name,
            price: item.productData.price,
            comparePrice: item.productData.comparePrice,
            images: item.productData.image ? [item.productData.image] : undefined,
            category: item.productData.category,
            stock: item.productData.stock,
            addedAt: new Date(item.createdAt).toISOString()
        }))

        return json({ wishlist: formattedWishlist })
    } catch (e) {
        console.error('Get wishlist error:', e)
        return error('Failed to fetch wishlist', 500)
    }
})

/**
 * Add item to wishlist
 * POST /api/wishlist/add
 * Body: { product }
 */
router.post('/add', async (request, env) => {
    const { convex } = request
    const claims = await requireAuth(request, env)
    if (!claims || !claims.convexUserId) {
        return error('Unauthorized', 401)
    }

    try {
        const { product } = await request.json()

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

        await convex.mutation('mutations:addToWishlist', {
            userId: claims.convexUserId,
            productId: product.id,
            productData
        })

        return json({ success: true })
    } catch (e) {
        console.error('Add to wishlist error:', e)
        return error('Failed to add item', 500)
    }
})

/**
 * Remove item from wishlist
 * POST /api/wishlist/remove
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

        await convex.mutation('mutations:removeFromWishlist', {
            userId: claims.convexUserId,
            productId
        })

        return json({ success: true })
    } catch (e) {
        console.error('Remove from wishlist error:', e)
        return error('Failed to remove item', 500)
    }
})

export default router
