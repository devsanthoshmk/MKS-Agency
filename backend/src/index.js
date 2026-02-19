import { AutoRouter, cors } from 'itty-router'
import { ConvexClient } from './lib/convex'
import { json } from './utils/response'

// Import Routers
import wishlistRouter from './routes/wishlist'
import cartRouter from './routes/cart'
import authRouter from './routes/auth'
import orderRouter from './routes/orders'
import adminRouter from './routes/admin'

/**
 * Cloudflare Workers Backend - MKS AGENCY E-commerce API
 * 
 * This backend handles:
 * - Authentication (Google OAuth, email, guest)
 * - Order management with Convex database
 * - Admin operations (order status, products via Convex)
 * 
 * @see /docs/BACKEND.md for full documentation
 */

// CORS Setup
const { preflight, corsify } = cors({
	origin: '*',
	allowMethods: 'GET, POST, PUT, DELETE, OPTIONS',
	allowHeaders: 'Content-Type, Authorization',
	maxAge: 86400,
})

// Main Router
const router = AutoRouter({
	before: [
		preflight,
		(request, env) => {
			// Inject Convex client into request
			request.convex = new ConvexClient(env.CONVEX_URL)
		}
	],
	catch: (error) => {
		console.error('Global error:', error)
		return json({
			error: error.message || 'Internal Server Error',
			stack: error.stack
		}, 500)
	},
	finally: [corsify]
})

// health check
router.all('/health-check', () => {
	return json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Mount Sub-Routers
router.all('/api/wishlist/*', wishlistRouter.fetch)
router.all('/api/cart/*', cartRouter.fetch)
router.all('/api/auth/*', authRouter.fetch)
router.all('/api/orders/*', orderRouter.fetch)
router.all('/api/admin/*', adminRouter.fetch)

// Health Check
router.get('/api/health', () => {
	return json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Export the router (it has a fetch handler)
export default router
