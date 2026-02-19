// Send email via external email server
export async function sendEmail(env, type, data) {
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
