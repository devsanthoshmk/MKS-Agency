import { AutoRouter } from 'itty-router'
import { json, error } from '../utils/response'
import { getClientIP, generateToken } from '../utils/helpers'
import { createJWT, verifyJWT } from '../lib/jwt'
import { requireAuth } from '../lib/auth'
import { sendEmail } from '../lib/email'

const router = AutoRouter({ base: '/api/auth' })

/**
 * Google OAuth callback
 * POST /api/auth/google
 * Body: { credential: string } - Google ID token
 */
router.post('/google', async (request, env) => {
    const { convex } = request
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
 */
router.post('/guest', async (request, env) => {
    const { convex } = request
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
        const sent = await sendEmail(env, 'guest-verification', {
            to: email,
            name,
            verificationLink: `${env.FRONTEND_URL}/verify/${verificationToken}`
        })

        if (!sent) {
            return error('Failed to send verification email', 500)
        }

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
router.post('/verify-guest', async (request, env) => {
    const { convex } = request
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

/**
 * Send email login link
 * POST /api/auth/email/send
 * Body: { email: string }
 */
router.post('/email/send', async (request, env) => {
    const { convex } = request
    try {
        const ip = getClientIP(request)


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
        const sent = await sendEmail(env, 'email-login', {
            to: email,
            loginLink: `${env.FRONTEND_URL}/login/${loginToken}`
        })

        if (!sent) {
            return error('Failed to send login email', 500)
        }


        return json({
            success: true,
            message: 'Login link sent to your email',
            isNewUser: result?.isNew ?? false
        })
    } catch (e) {
        console.error('Email login send error:', e)
        return error(e.message || 'Failed to send login link', 500)
    }
})

/**
 * Verify email login token
 * POST /api/auth/email/verify
 * Body: { token: string }
 */
router.post('/email/verify', async (request, env) => {
    const { convex } = request
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
router.get('/verify', async (request, env) => {
    const claims = await requireAuth(request, env)
    if (!claims) {
        return error('Unauthorized', 401)
    }
    return json({ valid: true, user: claims })
})

export default router
