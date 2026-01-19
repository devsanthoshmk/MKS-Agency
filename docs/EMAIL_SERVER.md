# MKS Agencies E-commerce - Email Server Documentation

## Overview

The Email Server is a **serverless** application deployed on **Netlify Functions** (AWS Lambda). It handles all transactional emails for the platform using `nodemailer` and Gmail SMTP.

It mimics the behavior of a standard Node.js Express server but runs as standalone stateless functions to reduce costs and maintenance.

## Architecture

The server is a single monolithic Netlify Function (`functions/email.js`) that handles routing internally based on the request path. This ensures compatibility with existing frontend API calls while leveraging serverless infrastructure.

## Setup

### 1. Install Dependencies

```bash
cd email-server
pnpm install
```

### 2. Configure Environment

Create `.env` file (for local development via `netlify dev`):

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
ADMIN_EMAIL=admin@example.com (optional, defaults to GMAIL_USER)
```

**Note:** For production, set these environment variables in the Netlify Dashboard.

### 3. Run Development Server

```bash
# Install Netlify CLI globally if not already installed
npm install -g netlify-cli

# Run locally
netlify dev
```

Server typically runs at: `http://localhost:8888/.netlify/functions/email` (proxied from port 3001 if configured in `netlify.toml`).

## API Endpoints

The server accepts **POST** requests with JSON bodies.

| Path | Description | Required Body Fields |
|------|-------------|----------------------|
| `/health` | Health check (GET) | None |
| `/send/order-confirmation` | Send order confirmation | `to`, `name`, `orderNumber`, `items`, `total` |
| `/send/status-update` | Send order status update | `to`, `orderNumber`, `status`, `statusLabel`, `statusDescription`, `trackingUrl` (optional) |
| `/send/admin-alert` | Notify admin of new order | `type` ('new-order' or 'update'), `orderNumber`, `customerName`, `total` |
| `/send/guest-verification` | Send email verification link | `to`, `name`, `verificationLink` |
| `/send/email-login` | Send login magic link | `to`, `loginLink` |

All endpoints return JSON responses:
- Success: `{ "success": true }`
- Error: `{ "error": "message" }`

## Templates

The server includes HTML templates for:
- **Order Confirmation**: Receipt with item details.
- **Status Update**: Current status with visual indicator and tracking link.
- **Admin Alert**: Simple notification for the store owner.
- **Guest Verification**: Link to verify email address.
- **Email Login**: Magic link for passwordless login.

## Deployment

The server is automatically deployed via Netlify when changes are pushed to the repository.

```bash
# Manual deployment
netlify deploy --prod
```

### Production URL
The email server is deployed at: `https://mksagencies-email.netlify.app`

### Production URLs
| Service | URL |
|---------|-----|
| Email Server | https://mksagencies-email.netlify.app |
| Backend | https://backend.mks-agencies-official.workers.dev |
| Frontend | https://mksagencies.pages.dev |
| Database | https://tame-ermine-520.convex.cloud |

### `netlify.toml` Configuration

The routing is handled by a redirect rule:

```toml
[[redirects]]
  from = "/*"
  to   = "/.netlify/functions/email/:splat"
  status = 200
```
