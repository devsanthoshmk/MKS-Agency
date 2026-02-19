/**
 * Authentication Composable
 * 
 * Handles user authentication with Google OAuth and guest checkout.
 * Uses JWT tokens stored in localStorage, synced with Convex via backend.
 * 
 * Usage:
 *   import { useAuth } from '@/composables/useAuth'
 *   const { user, isAuthenticated, loginWithGoogle, logout } = useAuth()
 * 
 * @see /docs/FRONTEND.md for full documentation
 */

import { ref, computed, watch } from 'vue'

// ==================== CONSTANTS ====================

const TOKEN_KEY = 'mks_auth_token'
const USER_KEY = 'mks_auth_user'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// ==================== STATE ====================

const user = ref(null)
const token = ref(null)
const isLoading = ref(false)
const error = ref(null)
const isAuthModalOpen = ref(false)

// ==================== MODAL FUNCTIONS ====================

function openAuthModal() {
    isAuthModalOpen.value = true
}

function closeAuthModal() {
    isAuthModalOpen.value = false
}

// ==================== COMPUTED ====================

const isAuthenticated = computed(() => !!token.value && !!user.value)
const isGuest = computed(() => user.value?.isGuest ?? false)
const convexUserId = computed(() => user.value?.id || null)

// ==================== INITIALIZATION ====================

/**
 * Initialize auth state from localStorage
 */
function initAuth() {
    try {
        const storedToken = localStorage.getItem(TOKEN_KEY)
        const storedUser = localStorage.getItem(USER_KEY)
        console.info('Auth init checking localStorage...', { storedToken, storedUser })
        if (storedToken && storedUser) {
            console.info('Restoring auth from localStorage initing...')
            token.value = storedToken
            user.value = JSON.parse(storedUser)

            // Verify token is still valid
            verifyToken()
        }
    } catch (e) {
        console.warn('Auth init failed:', e)
        clearAuth()
    }
}

/**
 * Save auth state to localStorage
 */
function saveAuth() {
    if (token.value && user.value) {
        console.info('  Saving auth state to localStorage...(the above saying is true)', { token: token.value, user: user.value })
        localStorage.setItem(TOKEN_KEY, token.value)
        localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    } else {
        console.info('  Clearing auth state from localStorage...(logging out)', { token: token.value, user: user.value })
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
    }
}

/**
 * Clear auth state
 */
function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
}

// Watch for auth changes
watch([token, user], () => {
    console.info('Auth state changed, saving to localStorage...', { token: token.value, user: user.value })
    saveAuth()
})

// ==================== API HELPERS ====================

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    }

    if (token.value) {
        headers['Authorization'] = `Bearer ${token.value}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    })

    let data
    try {
        const text = await response.text()
        try {
            data = JSON.parse(text)
        } catch {
            // If response is not JSON (e.g. HTML 500 error), use text as error
            throw new Error(text || response.statusText)
        }
    } catch (e) {
        // If parsing didn't work, ensure we have a fallback
        if (!data) {
            throw new Error(`Request failed: ${response.status} ${response.statusText}`)
        }
    }

    if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed')
    }

    return data
}

// ==================== AUTH METHODS ====================

/**
 * Verify current token is valid
 */
async function verifyToken() {
    if (!token.value) return false

    try {
        const data = await apiRequest('/api/auth/verify')
        return data.valid
    } catch (e) {
        console.warn('Token verification failed:', e)
        clearAuth()
        return false
    }
}

/**
 * Login with Google OAuth
 * 
 * Uses Google Identity Services library.
 * Can be called with a credential from the Google callback, or without to open the auth modal.
 * 
 * @param {string} [credential] - Optional Google credential from callback
 */
async function loginWithGoogle(credential) {
    // If no credential provided, open the auth modal to let user sign in
    if (!credential) {
        openAuthModal()
        return null
    }

    if (!GOOGLE_CLIENT_ID) {
        error.value = 'Google Client ID not configured'
        return null
    }

    isLoading.value = true
    error.value = null

    try {
        // Send credential to backend
        const data = await apiRequest('/api/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential }),
        })

        token.value = data.token
        user.value = data.user

        // Close the auth modal on successful login
        closeAuthModal()

        return data.user
    } catch (e) {
        console.error('Google login failed:', e)
        error.value = e.message
        return null
    } finally {
        isLoading.value = false
    }
}

/**
 * Continue as guest with email verification
 */
async function continueAsGuest(guestInfo) {
    const { name, email, phone } = guestInfo

    if (!name || !email || !phone) {
        error.value = 'Name, email, and phone are required'
        return null
    }

    isLoading.value = true
    error.value = null

    try {
        const data = await apiRequest('/api/auth/guest', {
            method: 'POST',
            body: JSON.stringify({ name, email, phone }),
        })

        token.value = data.token
        user.value = data.user

        return {
            user: data.user,
            verificationRequired: data.verificationRequired,
        }
    } catch (e) {
        console.error('Guest auth failed:', e)
        error.value = e.message
        return null
    } finally {
        isLoading.value = false
    }
}

/**
 * Verify guest email with token
 */
async function verifyGuestEmail(verificationToken) {
    isLoading.value = true
    error.value = null

    try {
        const data = await apiRequest('/api/auth/verify-guest', {
            method: 'POST',
            body: JSON.stringify({ token: verificationToken }),
        })

        if (data.verified && user.value) {
            user.value = { ...user.value, isVerified: true }
        }

        return data.verified
    } catch (e) {
        console.error('Guest verification failed:', e)
        error.value = e.message
        return false
    } finally {
        isLoading.value = false
    }
}

/**
 * Send email login link
 * 
 * Sends a magic link to the user's email for passwordless login.
 * 
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function sendLoginEmail(email) {
    if (!email) {
        error.value = 'Email is required'
        return { success: false, error: 'Email is required' }
    }

    isLoading.value = true
    error.value = null

    try {
        const data = await apiRequest('/api/auth/email/send', {
            method: 'POST',
            body: JSON.stringify({ email }),
        })

        return {
            success: true,
            message: data.message || 'Login link sent to your email',
            isNewUser: data.isNewUser
        }
    } catch (e) {
        console.error('Send login email failed:', e)
        error.value = e.message
        return { success: false, error: e.message }
    } finally {
        isLoading.value = false
    }
}

/**
 * Verify email login token from magic link
 * 
 * Called when user clicks the login link from their email.
 * Authenticates and sets user state.
 * 
 * @param {string} loginToken - Token from the magic link URL
 * @returns {Promise<object|null>} User object on success, null on failure
 */
async function verifyLoginToken(loginToken) {
    if (!loginToken) {
        error.value = 'Login token is required'
        return null
    }

    isLoading.value = true
    error.value = null

    try {
        const data = await apiRequest('/api/auth/email/verify', {
            method: 'POST',
            body: JSON.stringify({ token: loginToken }),
        })

        token.value = data.token
        user.value = data.user

        // Close the auth modal on successful login
        closeAuthModal()

        return data.user
    } catch (e) {
        console.error('Login token verification failed:', e)
        error.value = e.message
        return null
    } finally {
        isLoading.value = false
    }
}

/**
 * Logout user
 */
function logout() {
    clearAuth()

    // Also sign out from Google
    if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect()
    }
}

/**
 * Get current auth token for API requests
 */
function getToken() {
    return token.value
}

/**
 * Get auth headers for API requests
 */
function getAuthHeaders() {
    if (!token.value) return {}
    return { 'Authorization': `Bearer ${token.value}` }
}

// Initialize on import
initAuth()

// ==================== EXPORT ====================

export function useAuth() {
    return {
        // State
        user,
        token,
        isLoading,
        error,
        isAuthModalOpen,

        // Computed
        isAuthenticated,
        isGuest,
        convexUserId,

        // Methods
        loginWithGoogle,
        continueAsGuest,
        verifyGuestEmail,
        sendLoginEmail,
        verifyLoginToken,
        logout,
        verifyToken,
        getToken,
        getAuthHeaders,
        openAuthModal,
        closeAuthModal,

        // API helper
        apiRequest,
    }
}
