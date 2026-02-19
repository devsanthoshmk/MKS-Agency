import { verifyJWT } from './jwt'

export async function requireAuth(request, env) {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.slice(7)
    const claims = await verifyJWT(token, env.JWT_SECRET)
    return claims
}

export async function requireAdmin(request, env) {
    const claims = await requireAuth(request, env)
    if (!claims || !claims.isAdmin) {
        return null
    }
    return claims
}
