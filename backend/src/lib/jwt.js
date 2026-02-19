export async function createJWT(payload, secret, expiresIn = 3600) {
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

export async function verifyJWT(token, secret) {
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
