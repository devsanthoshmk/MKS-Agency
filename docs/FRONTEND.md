# MKS Agency E-commerce - Frontend Documentation

## Overview

The frontend is a **Vue.js 3** application using:
- 🎨 Composition API
- 🛣️ Vue Router for navigation
- 📦 Convex for real-time database
- 🎯 Composables for state management

## Architecture

```
frontend/
├── convex/                 # Convex database
│   ├── schema.ts          # Database schema
│   ├── queries.ts         # Read operations
│   └── mutations.ts       # Write operations
├── src/
│   ├── assets/
│   │   └── products.json  # Product catalog
│   ├── components/        # Reusable components
│   ├── composables/       # State management
│   │   ├── useAuth.js     # Authentication
│   │   ├── useCart.js     # Shopping cart
│   │   ├── useOrders.js   # Order management
│   │   ├── useProducts.js # Product catalog
│   │   └── useUI.js       # UI state
│   ├── views/             # Page components
│   │   ├── HomePage.vue   # Main shop page
│   │   ├── AdminDashboard.vue # Admin panel
│   │   └── GuestVerification.vue
│   ├── App.vue
│   └── main.js
└── index.html
```

## Setup

### 1. Install Dependencies

```bash
cd frontend
pnpm install
```

### 2. Configure Environment

Create `.env.local`:

```env
# API URL (Cloudflare Worker)
VITE_API_URL=http://localhost:8787

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Convex deployment URL
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### 3. Push Convex Schema

```bash
pnpm exec convex dev
# This pushes schema and starts watching for changes
```

### 4. Run Development Server

```bash
pnpm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Composables

### useAuth

Authentication with Google OAuth, email login, and guest checkout.

```javascript
import { useAuth } from '@/composables/useAuth'

const {
  user,           // Current user object
  isAuthenticated, // Boolean - logged in?
  isGuest,        // Boolean - guest user?
  isLoading,      // Boolean - auth in progress?
  error,          // Error message
  
  loginWithGoogle,    // Async - Google sign-in
  sendLoginEmail,     // Async - Send magic link email
  verifyLoginToken,   // Async - Verify magic link token
  continueAsGuest,    // Async - Guest checkout
  verifyGuestEmail,   // Async - Email verification
  logout,             // Sign out
  getToken,           // Get JWT token
  apiRequest,         // Authenticated fetch helper
} = useAuth()

// Example: Google login
const user = await loginWithGoogle()
if (user) {
  console.log('Logged in as:', user.email)
}

// Example: Email login
const result = await sendLoginEmail('user@example.com')
if (result.success) {
  console.log('Login link sent!')
}

// Example: Guest checkout
const result = await continueAsGuest({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '9876543210'
})
```

### useCart

Shopping cart with localStorage persistence.

```javascript
import { useCart } from '@/composables/useCart'

const {
  items,         // Reactive cart items
  itemCount,     // Total item count
  subtotal,      // Cart subtotal
  savings,       // Savings from compare prices
  
  addItem,       // Add product to cart
  removeItem,    // Remove from cart
  updateQuantity,// Change quantity
  clearCart,     // Empty cart
  isInCart,      // Check if product in cart
  openCart,      // Open cart panel
  closeCart,     // Close cart panel
} = useCart()

// Example: Add to cart
addItem(product, 2)  // Add 2 units

// Example: Update quantity
updateQuantity('prod_001', 5)
```

### useOrders

Order placement and tracking.

```javascript
import { useOrders } from '@/composables/useOrders'

const {
  orders,        // User's orders
  currentOrder,  // Just-placed order
  isLoading,
  error,
  
  placeOrder,    // Create new order
  loadOrders,    // Fetch order history
  getOrder,      // Get single order
  trackOrder,    // Track by order number
  getStatusInfo, // Get status label/color
  formatPrice,   // Format INR price
} = useOrders()

// Example: Place order
const result = await placeOrder({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '9876543210',
  address: '123 Main St',
  city: 'Chennai',
  state: 'Tamil Nadu',
  postal: '600001'
})

if (result) {
  console.log('Order placed:', result.orderNumber)
}

// Example: Track order
const order = await trackOrder('MKS-20260116-ABCD')
console.log('Status:', order.status)
```

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | HomePage | Main shop page |
| `/products` | HomePage | Products listing |
| `/product/:slug` | HomePage | Product detail (modal) |
| `/checkout` | HomePage | Checkout flow |
| `/orders` | HomePage | Order history |
| `/verify/:token` | GuestVerification | Email verification |
| `/login/:token` | LoginVerification | Email login link |
| `/admin` | AdminDashboard | Admin panel |

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Identity** API
4. Go to **Credentials** > **Create Credentials** > **OAuth Client ID**
5. Select **Web application**
6. Add authorized origins:
   - `http://localhost:5173` (development)
   - `https://your-domain.com` (production)
7. Copy the **Client ID** to `.env.local`

Add to `index.html`:
```html
<script src="https://accounts.google.com/gsi/client" async></script>
```

---

## Convex Integration

### Schema (convex/schema.ts)

Tables:
- `users` - User profiles
- `orders` - Order records
- `orderItems` - Line items
- `orderStatusHistory` - Status timeline
- `wishlist` - User wishlists
- `cart` - Persistent cart

### Using Convex in Components

```javascript
import { useQuery, useMutation } from 'convex-vue'
import { api } from '../convex/_generated/api'

// Query example
const orders = useQuery(api.queries.getUserOrders, { userId })

// Mutation example
const createOrder = useMutation(api.mutations.createOrder)
await createOrder({ ... })
```

---

## Building for Production

```bash
# Build
pnpm run build

# Preview build
pnpm run preview
```

Output in `dist/` directory.

---

## Deployment

### Cloudflare Pages

1. Connect GitHub repo to Cloudflare Pages
2. Build settings:
   - Build command: `pnpm run build`
   - Output directory: `dist`
3. Add environment variables in dashboard

### Vercel

```bash
vercel --prod
```
