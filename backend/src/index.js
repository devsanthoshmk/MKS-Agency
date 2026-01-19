/**
 * Cloudflare Workers Backend - MKS Agencies E-commerce API
 * 
 * This backend handles:
 * - Authentication (Google OAuth, email, guest)
 * - Order management with Convex database
 * - Admin operations (order status, products via GitHub)
 * - Rate limiting via KV
 * 
 * @see /docs/BACKEND.md for full documentation
 */

// CORS headers for cross-origin requests triggering deploy
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Access-Control-Max-Age': '86400',
}

// JSON response helper
function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders
		}
	})
}

// Error response helper
function error(message, status = 400) {
	return json({ error: message }, status)
}

// ==================== CONVEX HTTP CLIENT ====================

/**
 * Convex HTTP Client for server-side access
 * Uses the Convex HTTP API to call queries and mutations
 */
class ConvexClient {
	constructor(url) {
		this.url = url
	}

	async query(name, args = {}) {
		const response = await fetch(`${this.url}/api/query`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				path: name,
				args,
				format: 'json',
			}),
		})

		if (!response.ok) {
			const err = await response.text()
			console.error(`Convex query error (${name}):`, err)
			throw new Error(`Convex query failed: ${name}`)
		}

		const result = await response.json()
		// Handle both {status, value} format and direct value format
		if (result && typeof result === 'object' && 'value' in result) {
			return result.value
		}
		return result
	}

	async mutation(name, args = {}) {
		const response = await fetch(`${this.url}/api/mutation`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				path: name,
				args,
				format: 'json',
			}),
		})

		if (!response.ok) {
			const err = await response.text()
			console.error(`Convex mutation error (${name}):`, err)
			throw new Error(`Convex mutation failed: ${name}`)
		}

		const result = await response.json()
		// Handle both {status, value} format and direct value format
		if (result && typeof result === 'object' && 'value' in result) {
			return result.value
		}
		return result
	}
}

// ==================== ROUTER ====================

class Router {
	constructor() {
		this.routes = []
	}

	add(method, path, handler) {
		const pattern = path.replace(/:[^/]+/g, '([^/]+)')
		const regex = new RegExp(`^${pattern}$`)
		const paramNames = (path.match(/:[^/]+/g) || []).map(p => p.slice(1))
		this.routes.push({ method, regex, handler, paramNames })
	}

	get(path, handler) { this.add('GET', path, handler) }
	post(path, handler) { this.add('POST', path, handler) }
	put(path, handler) { this.add('PUT', path, handler) }
	delete(path, handler) { this.add('DELETE', path, handler) }

	async handle(request, env, ctx) {
		const url = new URL(request.url)
		const method = request.method

		// Handle CORS preflight
		if (method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders })
		}

		// Initialize Convex client
		const convex = new ConvexClient(env.CONVEX_URL)

		// Find matching route
		for (const route of this.routes) {
			if (route.method !== method) continue
			const match = url.pathname.match(route.regex)
			if (match) {
				const params = {}
				route.paramNames.forEach((name, i) => {
					params[name] = match[i + 1]
				})
				try {
					return await route.handler(request, env, ctx, params, convex)
				} catch (e) {
					console.error('Route error:', e)
					return error('Internal server error', 500)
				}
			}
		}

		return error('Not found', 404)
	}
}

// ==================== JWT UTILITIES ====================

async function createJWT(payload, secret, expiresIn = 3600) {
	const header = { alg: 'HS256', typ: 'JWT' }
	const now = Math.floor(Date.now() / 1000)
	const claims = {
		...payload,
		iat: now,
		exp: now + expiresIn
	}

	const encoder = new TextEncoder()
	const headerB64 = btoa(JSON.stringify(header))
	const claimsB64 = btoa(JSON.stringify(claims))
	const data = `${headerB64}.${claimsB64}`

	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	)

	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
	const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))

	return `${data}.${signatureB64}`
}

async function verifyJWT(token, secret) {
	try {
		const [headerB64, claimsB64, signatureB64] = token.split('.')
		if (!headerB64 || !claimsB64 || !signatureB64) return null

		const encoder = new TextEncoder()
		const data = `${headerB64}.${claimsB64}`

		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(secret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		)

		const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0))
		const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data))

		if (!valid) return null

		const claims = JSON.parse(atob(claimsB64))
		if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
			return null
		}

		return claims
	} catch (e) {
		return null
	}
}

// ==================== RATE LIMITING ====================

async function checkRateLimit(env, ip, action, maxAttempts = 5, windowSec = 900) {
	const key = `rate:${action}:${ip}`

	try {
		const data = await env.RATE_LIMIT.get(key, 'json')

		if (data) {
			if (data.lockedUntil && Date.now() < data.lockedUntil) {
				return { allowed: false, remaining: 0, retryAfter: Math.ceil((data.lockedUntil - Date.now()) / 1000) }
			}

			if (data.attempts >= maxAttempts) {
				await env.RATE_LIMIT.put(key, JSON.stringify({
					attempts: data.attempts,
					lockedUntil: Date.now() + (windowSec * 1000)
				}), { expirationTtl: windowSec })

				return { allowed: false, remaining: 0, retryAfter: windowSec }
			}

			return { allowed: true, remaining: maxAttempts - data.attempts }
		}

		return { allowed: true, remaining: maxAttempts }
	} catch (e) {
		return { allowed: true, remaining: maxAttempts }
	}
}

async function incrementRateLimit(env, ip, action, windowSec = 900) {
	const key = `rate:${action}:${ip}`

	try {
		const data = await env.RATE_LIMIT.get(key, 'json') || { attempts: 0 }
		await env.RATE_LIMIT.put(key, JSON.stringify({
			attempts: data.attempts + 1,
			firstAttempt: data.firstAttempt || Date.now()
		}), { expirationTtl: windowSec })
	} catch (e) {
		console.error('Rate limit increment failed:', e)
	}
}

async function resetRateLimit(env, ip, action) {
	const key = `rate:${action}:${ip}`
	try {
		await env.RATE_LIMIT.delete(key)
	} catch (e) {
		console.error('Rate limit reset failed:', e)
	}
}

// ==================== UTILITIES ====================

function getClientIP(request) {
	return request.headers.get('CF-Connecting-IP') ||
		request.headers.get('X-Forwarded-For')?.split(',')[0] ||
		'unknown'
}

async function requireAuth(request, env) {
	const authHeader = request.headers.get('Authorization')
	if (!authHeader?.startsWith('Bearer ')) {
		return null
	}

	const token = authHeader.slice(7)
	const claims = await verifyJWT(token, env.JWT_SECRET)
	return claims
}

async function requireAdmin(request, env) {
	const claims = await requireAuth(request, env)
	if (!claims || !claims.isAdmin) {
		return null
	}
	return claims
}

function generateToken(length = 32) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let result = ''
	const array = crypto.getRandomValues(new Uint8Array(length))
	for (let i = 0; i < length; i++) {
		result += chars[array[i] % chars.length]
	}
	return result
}

function generateOrderNumber() {
	const date = new Date()
	const datePart = date.toISOString().slice(0, 10).replace(/-/g, '')
	const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
	return `MKS-${datePart}-${randomPart}`
}

// Send email via external email server
async function sendEmail(env, type, data) {
	try {
		const response = await fetch(`${env.EMAIL_SERVER_URL}/send/${type}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
		return response.ok
	} catch (e) {
		console.error('Email send failed:', e)
		return false
	}
}


// ==================== ROUTER SETUP ====================

const router = new Router()

// ==================== WISHLIST ROUTES ====================

/**
 * Get user's wishlist
 * GET /api/wishlist
 * Header: Authorization: Bearer <token>
 */
router.get('/api/wishlist', async (request, env, ctx, params, convex) => {
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
router.post('/api/wishlist/add', async (request, env, ctx, params, convex) => {
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
			category: product.category
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
router.post('/api/wishlist/remove', async (request, env, ctx, params, convex) => {
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

// ==================== CART ROUTES ====================

/**
 * Get user's cart
 * GET /api/cart
 * Header: Authorization: Bearer <token>
 */
router.get('/api/cart', async (request, env, ctx, params, convex) => {
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
				images: item.productData.image ? [item.productData.image] : undefined
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
router.post('/api/cart/add', async (request, env, ctx, params, convex) => {
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
			category: product.category
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
router.post('/api/cart/update', async (request, env, ctx, params, convex) => {
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
router.post('/api/cart/remove', async (request, env, ctx, params, convex) => {
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
router.post('/api/cart/clear', async (request, env, ctx, params, convex) => {
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



// ==================== AUTH ROUTES ====================

/**
 * Google OAuth callback
 * POST /api/auth/google
 * Body: { credential: string } - Google ID token
 * 
 * Verifies Google token, creates/updates user in Convex, returns JWT
 */
router.post('/api/auth/google', async (request, env, ctx, params, convex) => {
	try {
		const { credential } = await request.json()
		if (!credential) {
			return error('Credential required')
		}

		// Verify Google token
		const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`)
		if (!googleResponse.ok) {
			return error('Invalid credential')
		}

		const googleUser = await googleResponse.json()

		// Create or update user in Convex
		const userId = await convex.mutation('mutations:upsertUser', {
			email: googleUser.email,
			name: googleUser.name,
			avatarUrl: googleUser.picture,
			provider: 'google',
			providerId: googleUser.sub,
			emailVerified: googleUser.email_verified === 'true',
			isGuest: false,
		})

		// Get full user data
		const user = await convex.query('queries:getUserByEmail', { email: googleUser.email })

		// Create JWT
		const token = await createJWT(
			{
				userId: String(userId),
				email: googleUser.email,
				convexUserId: String(userId),
			},
			env.JWT_SECRET,
			86400 // 24 hours
		)

		return json({
			user: {
				id: userId,
				email: user.email,
				name: user.name,
				avatarUrl: user.avatarUrl,
				provider: 'google',
				emailVerified: user.emailVerified,
			},
			token
		})
	} catch (e) {
		console.error('Google auth error:', e)
		return error('Authentication failed', 500)
	}
})

/**
 * Guest session creation
 * POST /api/auth/guest
 * Body: { name, email, phone }
 * 
 * Creates guest user with verification token
 */
router.post('/api/auth/guest', async (request, env, ctx, params, convex) => {
	try {
		const { name, email, phone } = await request.json()

		if (!name || !email || !phone) {
			return error('Name, email, and phone are required')
		}

		// Generate verification token
		const verificationToken = generateToken(48)

		// Create guest user in Convex
		const userId = await convex.mutation('mutations:createGuestUser', {
			email,
			name,
			phone,
			verificationToken,
		})

		// Create JWT
		const token = await createJWT(
			{
				guestId: String(userId),
				email,
				isGuest: true,
				convexUserId: String(userId),
			},
			env.JWT_SECRET,
			86400 // 24 hours
		)

		// Send verification email
		await sendEmail(env, 'guest-verification', {
			to: email,
			name,
			verificationLink: `${env.FRONTEND_URL}/verify/${verificationToken}`
		})

		return json({
			user: {
				id: userId,
				name,
				email,
				phone,
				isGuest: true,
				isVerified: false,
			},
			token,
			verificationRequired: true,
			verificationMethod: 'email'
		})
	} catch (e) {
		console.error('Guest auth error:', e)
		return error('Failed to create guest session', 500)
	}
})

/**
 * Verify guest email
 * POST /api/auth/verify-guest
 * Body: { token: string }
 */
router.post('/api/auth/verify-guest', async (request, env, ctx, params, convex) => {
	try {
		const { token } = await request.json()

		if (!token) {
			return error('Verification token required')
		}

		const result = await convex.mutation('mutations:verifyGuestUser', {
			verificationToken: token,
		})

		if (!result.success) {
			return error(result.error || 'Verification failed')
		}

		return json({ verified: true, userId: result.userId })
	} catch (e) {
		return error('Verification failed', 500)
	}
})

// ==================== EMAIL LOGIN ====================

/**
 * Send email login link
 * POST /api/auth/email/send
 * Body: { email: string }
 * 
 * Sends a magic link for passwordless login
 * Rate limited: 3 attempts per 5 minutes
 */
router.post('/api/auth/email/send', async (request, env, ctx, params, convex) => {
	const ip = getClientIP(request)

	// Check rate limit
	const rateCheck = await checkRateLimit(env, ip, 'email_login', 3, 300)
	if (!rateCheck.allowed) {
		return error(`Too many attempts. Try again in ${rateCheck.retryAfter} seconds.`, 429)
	}

	try {
		const { email } = await request.json()

		if (!email) {
			return error('Email is required')
		}

		// Basic email validation
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return error('Please enter a valid email address')
		}

		// Generate login token
		const loginToken = generateToken(48)

		console.log('Generated login token:', loginToken.substring(0, 8) + '...')

		// Store token in Convex (creates user if needed)
		const result = await convex.mutation('mutations:createEmailLoginToken', {
			email,
			loginToken,
		})

		console.log('createEmailLoginToken result:', JSON.stringify(result))

		// Send login email
		await sendEmail(env, 'email-login', {
			to: email,
			loginLink: `${env.FRONTEND_URL}/login/${loginToken}`
		})

		await incrementRateLimit(env, ip, 'email_login', 300)

		return json({
			success: true,
			message: 'Login link sent to your email',
			isNewUser: result?.isNew ?? false
		})
	} catch (e) {
		console.error('Email login send error:', e)
		return error('Failed to send login link', 500)
	}
})

/**
 * Verify email login token
 * POST /api/auth/email/verify
 * Body: { token: string }
 * 
 * Verifies the magic link token and returns JWT
 */
router.post('/api/auth/email/verify', async (request, env, ctx, params, convex) => {
	try {
		const { token } = await request.json()

		if (!token) {
			return error('Login token required')
		}

		console.log('Verifying email login token:', token.substring(0, 8) + '...')

		const result = await convex.mutation('mutations:verifyEmailLoginToken', {
			loginToken: token,
		})

		console.log('Convex verifyEmailLoginToken result:', JSON.stringify(result))

		if (!result || !result.success) {
			return error(result?.error || 'Invalid login link')
		}

		// Create JWT
		const jwtToken = await createJWT(
			{
				userId: String(result.user.id),
				email: result.user.email,
				convexUserId: String(result.user.id),
			},
			env.JWT_SECRET,
			86400 * 7 // 7 days for email login
		)

		return json({
			user: {
				id: result.user.id,
				email: result.user.email,
				name: result.user.name,
				phone: result.user.phone,
				provider: result.user.provider,
				emailVerified: true,
			},
			token: jwtToken
		})
	} catch (e) {
		console.error('Email login verify error:', e)
		return error('Login verification failed', 500)
	}
})

/**
 * Verify JWT token
 * GET /api/auth/verify
 * Header: Authorization: Bearer <token>
 */
router.get('/api/auth/verify', async (request, env) => {
	const claims = await requireAuth(request, env)
	if (!claims) {
		return error('Unauthorized', 401)
	}
	return json({ valid: true, user: claims })
})

// ==================== ADMIN AUTH ====================

/**
 * Admin login
 * POST /api/admin/login
 * Body: { passcode: string }
 * 
 * Rate limited: 5 attempts per 15 minutes
 */
router.post('/api/admin/login', async (request, env) => {
	const ip = getClientIP(request)

	// Check rate limit
	const rateCheck = await checkRateLimit(env, ip, 'admin_login', 5, 900)
	if (!rateCheck.allowed) {
		return error(`Too many attempts. Try again in ${rateCheck.retryAfter} seconds.`, 429)
	}

	try {
		const { passcode } = await request.json()

		if (!passcode) {
			await incrementRateLimit(env, ip, 'admin_login')
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
			await incrementRateLimit(env, ip, 'admin_login')
			return error('Invalid passcode', 401)
		}

		// Reset rate limit on success
		await resetRateLimit(env, ip, 'admin_login')

		// Create admin JWT (shorter expiry)
		const token = await createJWT(
			{ isAdmin: true },
			env.JWT_SECRET,
			7200 // 2 hours
		)

		return json({ success: true, token })
	} catch (e) {
		console.error('Admin login error:', e)
		return error('Login failed', 500)
	}
})

// ==================== ORDER ROUTES ====================

/**
 * Create order
 * POST /api/orders
 * Body: { items, shipping, subtotal, shippingFee, total, isGuest, guestInfo }
 */
router.post('/api/orders', async (request, env, ctx, params, convex) => {
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
router.get('/api/orders', async (request, env, ctx, params, convex) => {
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
router.get('/api/orders/:id', async (request, env, ctx, params, convex) => {
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
router.get('/api/orders/track/:orderNumber', async (request, env, ctx, params, convex) => {
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

// ==================== ADMIN ORDERS ====================

/**
 * Get all orders (admin)
 * GET /api/admin/orders
 * Query: ?status=PENDING_VERIFICATION&limit=50
 */
router.get('/api/admin/orders', async (request, env, ctx, params, convex) => {
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
router.put('/api/admin/orders/:id/status', async (request, env, ctx, params, convex) => {
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
 * Get order analytics (admin)
 * GET /api/admin/analytics
 */
router.get('/api/admin/analytics', async (request, env, ctx, params, convex) => {
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

// ==================== ADMIN PRODUCTS ====================

/**
 * Update products (commits to GitHub)
 * PUT /api/admin/products
 * Body: { products: [...] }
 */
router.put('/api/admin/products', async (request, env) => {
	const admin = await requireAdmin(request, env)
	if (!admin) {
		return error('Unauthorized', 401)
	}

	try {
		const { products } = await request.json()

		// Prepare new product.json content
		const productData = {
			version: new Date().toISOString().split('T')[0],
			updatedAt: new Date().toISOString(),
			categories: [...new Set(products.map(p => p.category).filter(Boolean))],
			products
		}

		// Get GitHub token from secrets KV or env
		let githubToken = env.GITHUB_TOKEN
		try {
			const kvToken = await env.ADMIN_SECRETS?.get('github_pat')
			if (kvToken) githubToken = kvToken
		} catch { }

		if (!githubToken) {
			return error('GitHub token not configured', 500)
		}

		// Get current file SHA from GitHub
		const getResponse = await fetch(
			`https://api.github.com/repos/${env.GITHUB_REPO}/contents/frontend/src/assets/products.json`,
			{
				headers: {
					'Authorization': `token ${githubToken}`,
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'MKS-Agencies-Admin'
				}
			}
		)

		let sha = null
		if (getResponse.ok) {
			const fileData = await getResponse.json()
			sha = fileData.sha
		}

		// Commit updated file
		const commitResponse = await fetch(
			`https://api.github.com/repos/${env.GITHUB_REPO}/contents/frontend/src/assets/products.json`,
			{
				method: 'PUT',
				headers: {
					'Authorization': `token ${githubToken}`,
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'MKS-Agencies-Admin',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: `Update products - ${new Date().toISOString()} (from admin page)`,
					content: btoa(unescape(encodeURIComponent(JSON.stringify(productData, null, 2)))),
					sha,
					branch: 'master'
				})
			}
		)

		if (!commitResponse.ok) {
			const err = await commitResponse.json()
			console.error('GitHub commit failed:', err)
			return error('Failed to update products', 500)
		}

		return json({ success: true })
	} catch (e) {
		console.error('Product update error:', e)
		return error('Failed to update products', 500)
	}
})

// ==================== CART & WISHLIST (Convex sync) ====================

/**
 * Sync cart from localStorage to Convex
 * POST /api/cart/sync
 * Body: { items: [...] }
 */
router.post('/api/cart/sync', async (request, env, ctx, params, convex) => {
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
 * Get cart
 * GET /api/cart
 */
router.get('/api/cart', async (request, env, ctx, params, convex) => {
	const claims = await requireAuth(request, env)
	if (!claims?.convexUserId) {
		return error('Unauthorized', 401)
	}

	try {
		const cart = await convex.query('queries:getCart', { userId: claims.convexUserId })
		return json({ cart })
	} catch (e) {
		return json({ cart: [] })
	}
})

/**
 * Clear cart
 * DELETE /api/cart
 */
router.delete('/api/cart', async (request, env, ctx, params, convex) => {
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

// ==================== HEALTH CHECK ====================

router.get('/api/health', async () => {
	return json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ==================== MAIN HANDLER ====================

export default {
	async fetch(request, env, ctx) {
		return router.handle(request, env, ctx)
	}
}
