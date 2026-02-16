# MKS Agencies — Architecture Overview

## What Is This Project?
MKS Agencies is a **production e-commerce platform** for an Ayurvedic products business (MKS Ayurvedic) with **manual payment verification** workflow. This is NOT a hobby project — it serves real customers and handles real orders.

## Tech Stack (DO NOT change without explicit approval)

| Layer | Technology | Hosting |
|-------|-----------|---------|
| **Frontend** | Vue.js 3 (Composition API) + Vite 7 + Tailwind CSS 4 | Cloudflare Pages |
| **Backend** | Cloudflare Workers (vanilla JS, NO framework) | Cloudflare Workers |
| **Database** | Convex (real-time, TypeScript) | Convex Cloud |
| **Email** | Netlify Functions + Nodemailer (Gmail SMTP) | Netlify |
| **Auth** | Google OAuth + Email Magic Links + Guest Checkout | — |
| **Products** | Static JSON synced from GitHub | GitHub API |
| **State** | Vue Composables (NO Vuex/Pinia) | — |
| **Package Manager** | pnpm | — |
| **Testing** | Vitest + @cloudflare/vitest-pool-workers | — |

## Production URLs (NEVER hardcode — use environment variables)

| Service | URL |
|---------|-----|
| Frontend | `https://mksagencies.pages.dev` |
| Backend | `https://backend.mks-agencies-official.workers.dev` |
| Email Server | `https://mksagencies-email.netlify.app` |
| Convex DB | `https://tame-ermine-520.convex.cloud` |

## Monorepo Structure

```
MKS-Agency/
├── backend/                    # Cloudflare Worker (vanilla JS)
│   ├── src/index.js            # ALL API routes (single file Worker)
│   ├── wrangler.jsonc          # Dev config (local URLs)
│   ├── wrangler.production.jsonc # Prod config (production URLs)
│   ├── test/                   # Vitest tests
│   └── package.json
├── frontend/                   # Vue.js 3 + Vite + Tailwind
│   ├── convex/                 # Schema, queries, mutations
│   │   ├── schema.ts           # ⚠️ LIVE DATABASE SCHEMA
│   │   ├── queries.ts          # Read-only queries
│   │   ├── mutations.ts        # Write mutations
│   │   ├── files.ts            # File storage functions
│   │   └── _generated/         # Auto-generated (DO NOT EDIT)
│   └── src/
│       ├── App.vue             # Root component with router
│       ├── main.js             # App entry, router config, Convex setup
│       ├── style.css           # Global styles + Tailwind
│       ├── composables/        # State management (NO Vuex/Pinia)
│       │   ├── useAuth.js      # Authentication state & methods
│       │   ├── useCart.js       # Cart state & methods
│       │   ├── useOrders.js    # Order state & methods
│       │   ├── useProducts.js  # Products state, filtering, search
│       │   ├── useWishlist.js  # Wishlist state & methods
│       │   └── useUI.js        # Toast notifications, modals
│       ├── views/              # Route-level page components
│       │   ├── HomePage.vue
│       │   ├── AdminDashboard.vue
│       │   ├── GuestVerification.vue
│       │   └── LoginVerification.vue
│       └── components/         # Reusable UI components
│           ├── AuthModal.vue
│           ├── CartPanel.vue
│           ├── CheckoutModal.vue
│           ├── NavbarComp.vue
│           ├── OrdersModal.vue
│           ├── ProductCard.vue
│           ├── ProductModal.vue
│           ├── ToastNotifications.vue
│           ├── WishlistPanel.vue
│           └── admin/          # Admin sub-components
├── email-server/               # Netlify Functions
│   ├── functions/email.js      # Email sending function
│   ├── netlify.toml            # Netlify config
│   └── package.json
├── db/
│   └── schema.sql              # Reference SQL schema
├── docs/                       # Documentation
│   ├── BACKEND.md
│   ├── FRONTEND.md
│   ├── DATABASE.md
│   └── EMAIL_SERVER.md
├── .env.example                # Environment variable reference
├── AGENTS.md                   # AI Agent quick-reference rules
├── agents.md                   # AI Agent comprehensive rules
└── README.md
```

## File Naming Conventions
- **Vue components**: PascalCase (`ProductCard.vue`, `NavbarComp.vue`)
- **Composables**: camelCase with `use` prefix (`useAuth.js`, `useCart.js`)
- **Convex functions**: camelCase (`schema.ts`, `queries.ts`, `mutations.ts`)
- **Backend**: Single file at `backend/src/index.js`
- **Config files**: lowercase with dots (`wrangler.jsonc`, `netlify.toml`)

## Key Architecture Decisions
1. **Single-file Worker backend** — intentional for Cloudflare Workers simplicity, NOT a code smell
2. **Vue Composables over Vuex/Pinia** — module-level singleton pattern for state
3. **Products from GitHub JSON** — static catalog, not stored in Convex database
4. **Manual payment verification** — business requirement, not a missing feature
5. **Convex for real-time** — don't reinvent real-time subscriptions
6. **No server framework in Workers** — vanilla JS with route matching
