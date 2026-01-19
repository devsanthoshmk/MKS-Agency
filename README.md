# MKS Agencies E-commerce

A complete e-commerce platform with manual payment verification workflow.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vue.js 3 (Composition API) |
| **Backend** | Cloudflare Workers |
| **Database** | Convex (real-time) |
| **Auth** | Google OAuth + Email |
| **Products** | Static JSON (GitHub-synced) |

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/MKS-Agency.git
cd MKS-Agency

# Install all dependencies
pnpm install
```

### 2. Configure Environment

**Backend** (`backend/wrangler.jsonc`):
```jsonc
{
  "vars": {
    "CONVEX_URL": "https://your-deployment.convex.cloud",
    "GITHUB_REPO": "your-username/MKS-Agency"
  }
}
```

**Frontend** (`frontend/.env.local`):
```env
VITE_API_URL=http://localhost:8787
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### 3. Add Secrets

```bash
cd backend
wrangler secret put JWT_SECRET      # Random 32+ char string
wrangler secret put CONVEX_ADMIN_KEY # From Convex dashboard
wrangler secret put GITHUB_TOKEN    # GitHub PAT
```

### 4. Push Convex Schema

```bash
cd frontend
pnpm exec convex dev
```

### 5. Run Development

```bash
# Terminal 1: Backend
cd backend
pnpm run dev

# Terminal 2: Frontend
cd frontend
pnpm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8787

---

## Project Structure

```
MKS-Agencies/
├── backend/             # Cloudflare Worker
│   ├── src/index.js     # API routes
│   └── wrangler.jsonc   # Worker config
├── frontend/            # Vue.js app
│   ├── convex/          # Database schema
│   ├── src/
│   │   ├── composables/ # State management
│   │   ├── views/       # Page components
│   │   └── assets/      # Static files
│   └── index.html
├── docs/                # Documentation
│   ├── BACKEND.md
│   ├── FRONTEND.md
│   └── DATABASE.md
└── README.md
```

---

## Order Flow

```
Customer places order → PENDING_VERIFICATION
                              ↓
Admin verifies payment → PAYMENT_VERIFIED
                              ↓
Admin marks processing → PROCESSING
                              ↓
Admin adds tracking → SHIPPED
                              ↓
Customer receives → DELIVERED
```

No payment gateway needed - all payments verified manually by admin.

---

## Documentation

- [Backend API](docs/BACKEND.md) - API endpoints, testing with curl
- [Frontend](docs/FRONTEND.md) - Composables, routes, setup
- [Database](docs/DATABASE.md) - Convex schema, queries, mutations

---

## Deployment

### Production URLs
| Service | URL |
|---------|-----|
| **Frontend** | https://mksagencies.pages.dev |
| **Backend** | https://backend.mks-agencies-official.workers.dev |
| **Email Server** | https://mksagencies-email.netlify.app |
| **Database** | https://tame-ermine-520.convex.cloud |

### Backend (Cloudflare Workers)
```bash
cd backend
# Development deployment (uses wrangler.jsonc)
pnpm run deploy

# Production deployment (uses wrangler.production.jsonc)
pnpm run deploy:prod
```

### Frontend (Cloudflare Pages)
```bash
cd frontend
# Build for production (uses .env.production)
pnpm run build:prod
# Deploy dist/ to Cloudflare Pages
```

### Email Server (Netlify)
```bash
cd email-server
# Deploy via Netlify CLI or dashboard
netlify deploy --prod
```

### Convex Database
```bash
cd frontend
# Deploy to production
pnpm exec convex deploy --prod
```

---

## License

MIT

.env - https://docs.google.com/document/d/1N-siw8XeLHxyjsbWAbyl2kJKP59Jx9k7KRxurqEBsz8/edit (connectwithsanthoshmk@gmail.com)
