/**
 * Auth Composable
 * Handles authentication with Google OAuth and guest checkout
 */

import { ref, computed, watch } from 'vue'

const AUTH_STORAGE_KEY = 'mks_auth'
const API_BASE = '/api'

// Auth state
const user = ref(null)
const token = ref(null)
const isLoading = ref(false)
const error = ref(null)
const isAuthModalOpen = ref(false)

// Initialize from localStorage
function initAuth() {
    try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY)
        if (stored) {
            const data = JSON.parse(stored)
            user.value = data.user
            token.value = data.token

            // Verify token is still valid
            verifyToken()
        }
    } catch (e) {
        console.warn('Auth load failed:', e)
        clearAuth()
    }
}

// Save to localStorage
function saveAuth() {
    try {
        if (user.value && token.value) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
                user: user.value,
                token: token.value
            }))
        } else {
            localStorage.removeItem(AUTH_STORAGE_KEY)
        }
    } catch (e) {
        console.warn('Auth save failed:', e)
    }
}

// Watch for changes
watch([user, token], saveAuth)

// Initialize
initAuth()

export function useAuth() {
    const isAuthenticated = computed(() => !!user.value && !!token.value)
    const isGuest = computed(() => user.value?.isGuest === true)

    // Verify current token
    async function verifyToken() {
        if (!token.value) return false

        try {
            const response = await fetch(`${API_BASE}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token.value}`
                }
            })

            if (!response.ok) {
                clearAuth()
                return false
            }

            const data = await response.json()
            user.value = data.user
            return true
        } catch (e) {
            console.warn('Token verification failed:', e)
            return false
        }
    }

    // Google One-Tap Login
    async function loginWithGoogle(credential) {
        isLoading.value = true
        error.value = null

        try {
            const response = await fetch(`${API_BASE}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ credential })
            })

            if (!response.ok) {
                throw new Error('Authentication failed')
            }

            const data = await response.json()
            user.value = data.user
            token.value = data.token
            isAuthModalOpen.value = false

            return true
        } catch (e) {
            error.value = e.message || 'Authentication failed'
            return false
        } finally {
            isLoading.value = false
        }
    }

    // Guest checkout - creates temporary user
    async function createGuestSession(guestData) {
        isLoading.value = true
        error.value = null

        try {
            const response = await fetch(`${API_BASE}/auth/guest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(guestData)
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.message || 'Failed to create guest session')
            }

            const data = await response.json()
            user.value = {
                ...data.user,
                isGuest: true
            }
            token.value = data.token

            return {
                success: true,
                verificationRequired: data.verificationRequired,
                verificationMethod: data.verificationMethod // 'email' or 'phone'
            }
        } catch (e) {
            error.value = e.message || 'Failed to create guest session'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    // Verify guest via email link
    async function verifyGuestEmail(verificationToken) {
        isLoading.value = true
        error.value = null

        try {
            const response = await fetch(`${API_BASE}/auth/verify-guest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: verificationToken })
            })

            if (!response.ok) {
                throw new Error('Verification failed')
            }

            const data = await response.json()

            if (data.verified) {
                // Update user as verified
                if (user.value) {
                    user.value.isVerified = true
                }
                return { success: true }
            }

            return { success: false, error: 'Invalid verification token' }
        } catch (e) {
            error.value = e.message || 'Verification failed'
            return { success: false, error: error.value }
        } finally {
            isLoading.value = false
        }
    }

    // Logout
    function logout() {
        clearAuth()
    }

    function clearAuth() {
        user.value = null
        token.value = null
        localStorage.removeItem(AUTH_STORAGE_KEY)
    }

    // Open/close auth modal
    function openAuthModal() {
        isAuthModalOpen.value = true
    }

    function closeAuthModal() {
        isAuthModalOpen.value = false
    }

    // Get auth header for API requests
    function getAuthHeader() {
        if (!token.value) return {}
        return {
            'Authorization': `Bearer ${token.value}`
        }
    }

    // Prompt login if not authenticated
    function requireAuth() {
        if (!isAuthenticated.value) {
            openAuthModal()
            return false
        }
        return true
    }

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

        // Methods
        loginWithGoogle,
        createGuestSession,
        verifyGuestEmail,
        verifyToken,
        logout,
        openAuthModal,
        closeAuthModal,
        getAuthHeader,
        requireAuth
    }
}
