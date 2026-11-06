# MKS Agency: agency website, Vue business site, and service landing page

MKS Agency is an e-commerce agency website, Vue business site, and service landing page for ordering traditional herbal wellness products. The platform coordinates public catalog browsing, customer ordering, passwordless authentication, manual payment verification, and automated email notifications across serverless services.

## Architecture

The system contains three decoupled services: a Vue 3 single-page client, a Cloudflare Workers REST backend, and a Netlify email microservice. Real-time data and file assets live in Convex.

| Component | Workspace directory | Technology | Role |
| :--- | :--- | :--- | :--- |
| Frontend | `frontend/` | Vue 3.5, Vite 7.2, Tailwind CSS 4.1, Vue Router 4.6 | Client user interface and admin portal |
| Backend | `backend/` | Cloudflare Workers, itty-router 5.0, Vitest 3.2 | API router, authentication, and order controller |
| Database and storage | `frontend/convex/` | Convex 1.31 | Real-time database, file storage, and cleanup cron |
| Email service | `email-server/` | Netlify Functions, Nodemailer 7.0 | Transactional email delivery through Gmail SMTP |
| Testing | `backend-test/` | Bruno | API test collections |

## Setup

### Prerequisites

Install Node.js 20 or higher, pnpm, Cloudflare Wrangler, and Netlify CLI.

### Installation

Clone the repository and install dependencies in each workspace directory:

```bash
git clone https://github.com/devsanthoshmk/MKS-Agency.git
cd MKS-Agency

# Install frontend dependencies
cd frontend && pnpm install && cd ..

# Install backend dependencies
cd backend && pnpm install && cd ..

# Install email service dependencies
cd email-server && pnpm install && cd ..
```

### Database initialization

Run the Convex development process from the frontend directory to apply the schema:

```bash
cd frontend
pnpm exec convex dev
```

To load starter product data into Convex:

```bash
cd frontend
node scripts/seed-products.mjs
```

### Local development

Run the backend worker and frontend application in separate terminal sessions:

```bash
# Terminal 1: Backend API on http://localhost:8787
cd backend
pnpm run dev

# Terminal 2: Frontend client on http://localhost:5173
cd frontend
pnpm run dev

# Terminal 3: Optional email service on http://localhost:3001
cd email-server
netlify dev
```

## Usage

### Public storefront

Visitors browse catalog items, search by title, and filter by category or price on the home page. Selecting a product opens a modal with usage instructions, ingredients, and benefits. Shoppers add items to the cart or wishlist without creating an account. Cart items persist in browser local storage. When a user authenticates with Google OAuth or an email magic link, the client synchronizes local cart items with the database cart table.

### Order lifecycle

The storefront operates with manual payment verification instead of automated credit card gateways:

1. A buyer submits an order at `/checkout`. The backend creates a record in the `orders` table with status `PENDING_VERIFICATION`.
2. The store administrator contacts the buyer to confirm payment details.
3. The administrator signs in to the admin panel and sets order status to `PAYMENT_VERIFIED`.
4. When workers prepare the package, the administrator updates status to `PROCESSING`.
5. When the package leaves the facility, the administrator records tracking numbers and marks status as `SHIPPED`.
6. When the buyer receives the package, the administrator updates status to `DELIVERED`.

Each status change adds an audit entry to `orderStatusHistory` and triggers the email service to deliver an HTML notification.

### Admin dashboard

Administrators access `/admin` and authenticate with a passcode. The dashboard provides five sections:

- Analytics: Summarizes orders by status and calculates verified revenue.
- Orders: Filters orders, edits shipping addresses, recalculates totals, and updates fulfillment status.
- Products: Manages product records, stock quantities, and pricing.
- Content: Displays promotional copy controls.
- Settings: Stores operational configuration values.

The product editor allows file uploads to Convex storage, reorders images, exports JSON, and generates structured prompts for missing product details.

## Configuration

### Frontend environment

Define environment variables in `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8787
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
CONVEX_DEPLOYMENT=dev:your-deployment-name
```

### Backend environment

Configure non-sensitive variables in `backend/wrangler.jsonc`:

```jsonc
{
  "vars": {
    "FRONTEND_URL": "http://localhost:5173",
    "EMAIL_SERVER_URL": "http://localhost:3001",
    "CONVEX_URL": "https://your-deployment.convex.cloud",
    "ADMIN_PASSCODE": "your-admin-passcode",
    "GITHUB_REPO": "devsanthoshmk/MKS-Agency"
  }
}
```

Set secret keys in the backend directory:

```bash
cd backend
wrangler secret put JWT_SECRET
wrangler secret put CONVEX_ADMIN_KEY
wrangler secret put GITHUB_TOKEN
```

Create Cloudflare KV namespaces for rate limiting and administrative secrets:

```bash
wrangler kv namespace create RATE_LIMIT
wrangler kv namespace create ADMIN_SECRETS
```

### Email server environment

Define SMTP credentials in `email-server/.env`:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
ADMIN_EMAIL=admin-receiver@gmail.com
```
