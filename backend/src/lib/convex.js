/**
 * Convex HTTP Client for server-side access
 * Uses the Convex HTTP API to call queries and mutations
 */
export class ConvexClient {
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
