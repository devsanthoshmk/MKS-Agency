/**
 * Cloudflare Workers Backend
 * Ayurvedic Ecommerce API
 */

// CORS headers
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

// Simple router
class Router {
	constructor() {
		this.routes = []
	}

	add(method, path, handler) {
		// Convert path params to regex
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
					return await route.handler(request, env, ctx, params)
				} catch (e) {
					console.error('Route error:', e)
					return error('Internal server error', 500)
				}
			}
		}

		return error('Not found', 404)
	}
}

// JWT utilities
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

// Rate limiting with KV
async function checkRateLimit(env, ip, action, maxAttempts = 5, windowSec = 900) {
	const key = `rate:${action}:${ip}`

	try {
		const data = await env.RATE_LIMIT.get(key, 'json')

		if (data) {
			if (data.lockedUntil && Date.now() < data.lockedUntil) {
				return { allowed: false, remaining: 0, retryAfter: Math.ceil((data.lockedUntil - Date.now()) / 1000) }
			}

			if (data.attempts >= maxAttempts) {
				// Lock for window duration
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
		// If KV fails, allow the request
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

// Get client IP
function getClientIP(request) {
	return request.headers.get('CF-Connecting-IP') ||
		request.headers.get('X-Forwarded-For')?.split(',')[0] ||
		'unknown'
}

// Auth middleware
async function requireAuth(request, env) {
	const authHeader = request.headers.get('Authorization')
	if (!authHeader?.startsWith('Bearer ')) {
		return null
	}

	const token = authHeader.slice(7)
	const claims = await verifyJWT(token, env.JWT_SECRET)
	return claims
}

// Admin auth middleware
async function requireAdmin(request, env) {
	const claims = await requireAuth(request, env)
	if (!claims || !claims.isAdmin) {
		return null
	}
	return claims
}

// Generate random token
function generateToken(length = 32) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let result = ''
	const array = crypto.getRandomValues(new Uint8Array(length))
	for (let i = 0; i < length; i++) {
		result += chars[array[i] % chars.length]
	}
	return result
}

// Generate order number
function generateOrderNumber() {
	const date = new Date()
	const datePart = date.toISOString().slice(0, 10).replace(/-/g, '')
	const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
	return `MKS-${datePart}-${randomPart}`
}

// Send email via Nodemailer server
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

// Create router
const router = new Router()

// ================== AUTH ROUTES ==================

// Google OAuth callback
router.post('/api/auth/google', async (request, env) => {
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

		// Create or get user (in real impl, this would hit Neon)
		const user = {
			id: googleUser.sub,
			email: googleUser.email,
			name: googleUser.name,
			avatar_url: googleUser.picture,
			provider: 'google',
			emailVerified: googleUser.email_verified
		}

		// Create JWT
		const token = await createJWT(
			{ userId: user.id, email: user.email },
			env.JWT_SECRET,
			86400 // 24 hours
		)

		return json({ user, token })
	} catch (e) {
		console.error('Google auth error:', e)
		return error('Authentication failed', 500)
	}
})

// Guest session
router.post('/api/auth/guest', async (request, env) => {
	try {
		const { name, email, phone } = await request.json()

		if (!name || !email || !phone) {
			return error('Name, email, and phone are required')
		}

		// Generate verification token
		const verificationToken = generateToken(48)

		// Create guest user (in real impl, this would hit Neon)
		const guestId = crypto.randomUUID()
		const guestUser = {
			id: guestId,
			name,
			email,
			phone,
			isGuest: true,
			isVerified: false,
			verificationToken
		}

		// Create JWT
		const token = await createJWT(
			{
				guestId,
				email,
				isGuest: true
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
			user: guestUser,
			token,
			verificationRequired: true,
			verificationMethod: 'email'
		})
	} catch (e) {
		console.error('Guest auth error:', e)
		return error('Failed to create guest session', 500)
	}
})

// Verify guest email
router.post('/api/auth/verify-guest', async (request, env) => {
	try {
		const { token } = await request.json()

		if (!token) {
			return error('Verification token required')
		}

		// In real impl, verify token against database
		// For now, just return success
		return json({ verified: true })
	} catch (e) {
		return error('Verification failed', 500)
	}
})

// Verify JWT
router.get('/api/auth/verify', async (request, env) => {
	const claims = await requireAuth(request, env)
	if (!claims) {
		return error('Unauthorized', 401)
	}
	return json({ valid: true, user: claims })
})

// ================== ADMIN AUTH ==================

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

		// Compare with stored hash (simplified - in real impl use bcrypt)
		const validPasscode = passcode === 'mksagency-admin' // In prod, compare hashes

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

// ================== ORDERS ==================

// Create order
router.post('/api/orders', async (request, env) => {
	try {
		const { items, shipping, subtotal, shippingFee, total, isGuest, guestInfo } = await request.json()

		if (!items?.length) {
			return error('Cart is empty')
		}

		if (!shipping?.name || !shipping?.phone || !shipping?.email || !shipping?.address) {
			return error('Shipping information incomplete')
		}

		const orderNumber = generateOrderNumber()
		const orderId = crypto.randomUUID()

		const order = {
			id: orderId,
			orderNumber,
			status: 'PENDING_VERIFICATION',
			items,
			subtotal,
			shippingFee,
			total,
			shippingName: shipping.name,
			shippingPhone: shipping.phone,
			shippingEmail: shipping.email,
			shippingAddress: shipping.address,
			shippingCity: shipping.city,
			shippingState: shipping.state,
			shippingPostal: shipping.postal,
			createdAt: new Date().toISOString(),
			isGuest
		}

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

		// Send FCM push to admin (if configured)
		// await sendFCMNotification(env, { title: 'New Order', body: `Order ${orderNumber}` })

		return json({
			success: true,
			order,
			orderNumber,
			verificationRequired: isGuest
		})
	} catch (e) {
		console.error('Order creation error:', e)
		return error('Failed to create order', 500)
	}
})

// Get user orders
router.get('/api/orders', async (request, env) => {
	const claims = await requireAuth(request, env)
	if (!claims) {
		return error('Unauthorized', 401)
	}

	// In real impl, fetch from Neon with RLS
	return json({ orders: [] })
})

// Get single order
router.get('/api/orders/:id', async (request, env, ctx, params) => {
	const claims = await requireAuth(request, env)
	if (!claims) {
		return error('Unauthorized', 401)
	}

	// In real impl, fetch from Neon with RLS
	return json({ order: null })
})

// ================== ADMIN ORDERS ==================

// Get all orders (admin)
router.get('/api/admin/orders', async (request, env) => {
	const admin = await requireAdmin(request, env)
	if (!admin) {
		return error('Unauthorized', 401)
	}

	// In real impl, fetch all orders from Neon with service role
	return json({ orders: [] })
})

// Update order status (admin)
router.put('/api/admin/orders/:id/status', async (request, env, ctx, params) => {
	const admin = await requireAdmin(request, env)
	if (!admin) {
		return error('Unauthorized', 401)
	}

	try {
		const { status, trackingUrl, trackingNumber, courierName, note } = await request.json()
		const orderId = params.id

		// Validate status transition
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

		// In real impl, update in Neon with service role
		const updatedOrder = {
			id: orderId,
			status,
			trackingUrl,
			trackingNumber,
			courierName,
			updatedAt: new Date().toISOString()
		}

		// Send status update email to customer
		// await sendEmail(env, 'status-update', { ... })

		return json({ success: true, order: updatedOrder })
	} catch (e) {
		console.error('Status update error:', e)
		return error('Failed to update status', 500)
	}
})

// ================== ADMIN PRODUCTS ==================

// Update product (commits to GitHub)
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

		// Get current file SHA from GitHub
		const getResponse = await fetch(
			`https://api.github.com/repos/${env.GITHUB_REPO}/contents/frontend/src/assets/products.json`,
			{
				headers: {
					'Authorization': `token ${env.GITHUB_TOKEN}`,
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'MKS-Ayurvedic-Admin'
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
					'Authorization': `token ${env.GITHUB_TOKEN}`,
					'Accept': 'application/vnd.github.v3+json',
					'User-Agent': 'MKS-Ayurvedic-Admin',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message: `Update products - ${new Date().toISOString()}`,
					content: btoa(JSON.stringify(productData, null, 2)),
					sha,
					branch: 'main'
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

// ================== ADMIN ANALYTICS ==================

router.get('/api/admin/analytics', async (request, env) => {
	const admin = await requireAdmin(request, env)
	if (!admin) {
		return error('Unauthorized', 401)
	}

	// In real impl, fetch from Neon analytics view
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
})

// ================== MAIN HANDLER ==================

export default {
	async fetch(request, env, ctx) {
		return router.handle(request, env, ctx)
	}
}
