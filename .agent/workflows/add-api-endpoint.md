---
description: To add a new API endpoint to the Cloudflare Workers backend
---

# Add API Endpoint Workflow 🔌

Follow this workflow when adding a new API endpoint to `backend/src/index.js`.

## 1. Plan the Endpoint
Before coding, define:
- **Path**: `/api/category/action` (e.g., `/api/orders/create`)
- **Method**: GET, POST, PUT, PATCH, DELETE
- **Auth Required?**: Public, User JWT, or Admin JWT
- **Input**: What request body/params are expected
- **Output**: What response shape to return
- **Rate Limited?**: Should this endpoint have rate limiting

## 2. Add Route to `backend/src/index.js`
Add the route match in the fetch handler, following existing patterns:

```javascript
// In the route matching section of fetch()
if (path === '/api/your/endpoint' && request.method === 'POST') {
  return handleYourEndpoint(request, env)
}
```

## 3. Implement Handler
Follow this exact pattern:

```javascript
async function handleYourEndpoint(request, env) {
  try {
    // 1. Parse and validate input FIRST (early returns)
    const body = await request.json()
    const { field1, field2 } = body
    
    if (!field1 || typeof field1 !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        error: 'field1 is required and must be a string'
      }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(env) }})
    }
    
    // 2. Auth check (if needed)
    const user = await verifyJWT(request, env) // or verifyAdminJWT
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(env) }})
    }
    
    // 3. Business logic (Convex calls, etc.)
    const convex = new ConvexHttpClient(env.CONVEX_URL)
    convex.setAdminAuth(env.CONVEX_ADMIN_KEY)
    const result = await convex.mutation(api.mutations.yourMutation, { ...args })
    
    // 4. Return success response
    return new Response(JSON.stringify({
      success: true,
      data: result
    }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(env) }})
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in handleYourEndpoint:`, error.message)
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(env) }})
  }
}
```

## 4. Constraints Checklist
- [ ] No new npm dependencies added (keep bundle < 1MB)
- [ ] No Node.js APIs used (Web APIs only)
- [ ] CORS headers on every response (including errors)
- [ ] Input validated before any processing
- [ ] Auth verified for protected endpoints
- [ ] Rate limiting added for sensitive endpoints
- [ ] Error responses don't expose internal details

## 5. Update Frontend
If the frontend needs to call this endpoint:
- Add the call in the relevant composable (NOT in a component)
- Use `fetch()` with `VITE_API_URL`
- Wrap in try/catch
- Show toast notifications for success/error

## 6. Test
```bash
# Start dev server
cd backend && pnpm run dev

# Test with curl
curl -X POST http://localhost:8787/api/your/endpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"field1": "value"}'
```

## 7. Quality Gate
Follow the `/code-quality-gate` workflow.