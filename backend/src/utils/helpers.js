export function getClientIP(request) {
    return request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')[0] ||
        'unknown'
}

export function generateToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const array = crypto.getRandomValues(new Uint8Array(length))
    for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length]
    }
    return result
}

export function generateOrderNumber() {
    const date = new Date()
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '')
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `MKS-${datePart}-${randomPart}`
}
