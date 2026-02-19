import { corsHeaders } from './cors'

export function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
        }
    })
}

export function error(message, status = 400) {
    return json({ error: message }, status)
}
