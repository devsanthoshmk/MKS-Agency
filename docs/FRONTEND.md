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
│   │   ├── admin/         # Admin dashboard components
│   │   │   ├── AnalyticsDashboard.vue  # Stats & metrics
│   │   │   ├── ContentManager.vue      # CMS (coming soon)
│   │   │   ├── OrderEditModal.vue      # Order editing modal
│   │   │   ├── OrdersManager.vue       # Order list & search
│   │   │   └── ProductsManager.vue     # Product CRUD
│   │   ├── AuthModal.vue
│   │   ├── CartPanel.vue
│   │   ├── CheckoutModal.vue
│   │   ├── NavbarComp.vue
│   │   ├── OrdersModal.vue
│   │   ├── ProductCard.vue
│   │   ├── ProductModal.vue
│   │   ├── ToastNotifications.vue
│   │   └── WishlistPanel.vue
│   ├── composables/       # State management
│   │   ├── useAuth.js     # Authentication
│   │   ├── useCart.js     # Shopping cart
│   │   ├── useOrders.js   # Order management
│   │   ├── useProducts.js # Product catalog
│   │   └── useUI.js       # UI state
│   ├── views/             # Page components
│   │   ├── HomePage.vue   # Main shop page
│   │   ├── AdminDashboard.vue # Admin panel
│   │   ├── GuestVerification.vue
│   │   └── LoginVerification.vue
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

## Admin Dashboard

The admin dashboard (`/admin`) provides a comprehensive interface for managing the store.

### Features

- **Analytics Dashboard** - Overview of orders, revenue, and status metrics
- **Order Management** - Search, filter, and manage orders with full editing capabilities
- **Product Management** - CRUD operations for products (commits to GitHub)
- **Content Management** - CMS for website content (coming soon)

### Admin Components

| Component | Description |
|-----------|-------------|
| `AnalyticsDashboard.vue` | Displays order statistics, revenue, and status breakdown |
| `OrdersManager.vue` | Order list with search, filter, and selection |
| `OrderEditModal.vue` | Full order editing with status updates, tracking info, and notes |
| `ProductsManager.vue` | Product list with create/edit/delete operations |
| `ContentManager.vue` | Placeholder for future CMS features |

### Order Status Updates

The admin can update order status with the following options:
- `PENDING_VERIFICATION` - Awaiting payment confirmation
- `PAYMENT_VERIFIED` - Payment confirmed
- `PROCESSING` - Order being prepared
- `SHIPPED` - Order dispatched (can add tracking info)
- `DELIVERED` - Order delivered
- `CANCELLED` - Order cancelled (requires reason)
- `FAILED` - Order failed (requires reason)

### Access

1. Navigate to `/admin`
2. Enter the admin passcode
3. Session is stored in localStorage (2-hour expiry)

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Identity** API
4. Go to **Credentials** > **Create Credentials** > **OAuth Client ID**
5. Select **Web application**
6. Add authorized origins:
   - `http://localhost:5173` (development)
   - `https://mksagencies.pages.dev` (production)
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

### Development Build
```bash
# Uses .env.local
pnpm run build
```

### Production Build
```bash
# Uses .env.production
pnpm run build:prod

# Preview build
pnpm run preview
```

### Production Environment (`.env.production`)
```env
# Backend API URL (Cloudflare Workers)
VITE_API_URL=https://backend.mks-agencies-official.workers.dev

# Convex Database URL  
VITE_CONVEX_URL=https://tame-ermine-520.convex.cloud

# Convex Deployment (production)
CONVEX_DEPLOYMENT=prod:tame-ermine-520
```

Output in `dist/` directory.

### Important: API URL Configuration

All API calls in the frontend use the `VITE_API_URL` environment variable to construct full backend URLs. This is critical because:

- **Development**: Vite's proxy forwards `/api/*` requests to `localhost:8787`
- **Production**: No proxy exists; frontend and backend are on separate domains

Components that make API calls (e.g., `AdminDashboard.vue`, `GuestVerification.vue`, etc.) must use:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
fetch(`${API_URL}/api/endpoint`, { ... })
```

---

## Deployment

### Cloudflare Pages

1. Connect GitHub repo to Cloudflare Pages
2. Build settings:
   - Build command: `pnpm run build:prod`
   - Output directory: `dist`
3. Add environment variables in dashboard:
   - `VITE_API_URL=https://backend.mks-agencies-official.workers.dev`
   - `VITE_CONVEX_URL=https://tame-ermine-520.convex.cloud`

### Production URLs
| Service | URL |
|---------|-----|
| Frontend | https://mksagencies.pages.dev |
| Backend | https://backend.mks-agencies-official.workers.dev |
| Email Server | https://mksagencies-email.netlify.app |
| Database | https://tame-ermine-520.convex.cloud |

# Future changes:

- use product table in convex instead of products.json
