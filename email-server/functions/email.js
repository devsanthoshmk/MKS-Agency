import { createTransport } from 'nodemailer'
// const { config } = require('dotenv')

// // Load environment variables - Netlify injects these automatically in production, 
// // but we might need dotenv for local dev if not running via 'netlify dev'
// config()

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

// Create nodemailer transporter
const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

// HTML Email Templates
const templates = {
  orderConfirmation: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f4; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 24px; }
        .logo span { display: inline-block; width: 50px; height: 50px; background: linear-gradient(135deg, #059669, #047857); border-radius: 50%; line-height: 50px; color: white; font-size: 24px; font-weight: bold; }
        h1 { color: #1c1917; font-size: 24px; margin-bottom: 8px; text-align: center; }
        .subtitle { color: #78716c; text-align: center; margin-bottom: 24px; }
        .order-number { background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px; }
        .order-number span { color: #059669; font-size: 20px; font-weight: bold; }
        .section { margin-bottom: 24px; }
        .section-title { color: #1c1917; font-weight: 600; margin-bottom: 12px; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px; }
        .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f4; }
        .item:last-child { border-bottom: none; }
        .total { display: flex; justify-content: space-between; padding: 16px 0; border-top: 2px solid #e7e5e4; margin-top: 8px; }
        .total span:last-child { color: #059669; font-size: 20px; font-weight: bold; }
        .notice { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
        .notice-title { color: #92400e; font-weight: 600; margin-bottom: 8px; }
        .notice-text { color: #a16207; font-size: 14px; }
        .footer { text-align: center; color: #78716c; font-size: 12px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo"><span>M</span></div>
          <h1>Order Confirmed! 🎉</h1>
          <p class="subtitle">Thank you for your order, ${data.name}!</p>
          
          <div class="order-number">
            <p style="margin: 0; color: #78716c; font-size: 14px;">Order Number</p>
            <span>${data.orderNumber}</span>
          </div>
          
          <div class="notice">
            <div class="notice-title">📞 Payment Verification</div>
            <div class="notice-text">We will contact you shortly via phone or email to verify your payment details.</div>
          </div>
          
          <div class="section">
            <div class="section-title">Order Items</div>
            ${data.items.map(item => `
              <div class="item">
                <span>${item.productName} × ${item.quantity}</span>
                <span>₹${item.subtotal}</span>
              </div>
            `).join('')}
            <div class="total">
              <span>Total</span>
              <span>₹${data.total}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>MKS Agencies | Siddha & Ayurveda Medicines</p>
            <p>Need help? Contact us at support@mksagencies.com</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,

  statusUpdate: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Update</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f4; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .logo { text-align: center; margin-bottom: 24px; }
        .logo span { display: inline-block; width: 50px; height: 50px; background: linear-gradient(135deg, #059669, #047857); border-radius: 50%; line-height: 50px; color: white; font-size: 24px; font-weight: bold; }
        h1 { color: #1c1917; font-size: 24px; margin-bottom: 8px; text-align: center; }
        .status { background: #ecfdf5; border: 1px solid #d1fae5; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .status-label { color: #78716c; font-size: 14px; margin-bottom: 8px; }
        .status-value { color: #059669; font-size: 24px; font-weight: bold; }
        .tracking { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center; }
        .tracking a { color: #2563eb; text-decoration: none; font-weight: 600; }
        .footer { text-align: center; color: #78716c; font-size: 12px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo"><span>M</span></div>
          <h1>Order Update</h1>
          <p style="text-align: center; color: #78716c;">Order #${data.orderNumber}</p>
          
          <div class="status">
            <div class="status-label">Current Status</div>
            <div class="status-value">${data.statusLabel}</div>
          </div>
          
          ${data.trackingUrl ? `
            <div class="tracking">
              <p style="margin: 0 0 8px 0; color: #1e40af;">🚚 Track Your Package</p>
              <a href="${data.trackingUrl}">Click here to track</a>
            </div>
          ` : ''}
          
          <p style="text-align: center; color: #78716c;">${data.statusDescription}</p>
          
          <div class="footer">
            <p>MKS Agencies | Siddha & Ayurveda Medicines</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,

  adminAlert: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Admin Alert</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f4; }
        .card { background: white; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
        h2 { margin: 0 0 16px 0; color: #1c1917; }
        .detail { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e7e5e4; }
        .detail:last-child { border-bottom: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="alert">
          <strong>🔔 ${data.type === 'new-order' ? 'New Order Received!' : 'Order Update'}</strong>
        </div>
        <h2>Order #${data.orderNumber}</h2>
        <div class="detail">
          <span>Customer</span>
          <strong>${data.customerName}</strong>
        </div>
        <div class="detail">
          <span>Amount</span>
          <strong>₹${data.total}</strong>
        </div>
        <p style="margin-top: 16px; color: #78716c;">Please verify payment and update order status.</p>
      </div>
    </body>
    </html>
  `,

  guestVerification: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f4; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
        .logo span { display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #059669, #047857); border-radius: 50%; line-height: 60px; color: white; font-size: 28px; font-weight: bold; }
        h1 { color: #1c1917; font-size: 24px; margin: 24px 0 8px; }
        p { color: #78716c; line-height: 1.6; }
        .button { display: inline-block; background: linear-gradient(135deg, #059669, #047857); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; margin: 24px 0; }
        .footer { margin-top: 24px; font-size: 12px; color: #a8a29e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo"><span>M</span></div>
          <h1>Verify Your Email</h1>
          <p>Hi ${data.name}! Please click the button below to verify your email address and confirm your order.</p>
          <a href="${data.verificationLink}" class="button">Verify Email</a>
          <p style="font-size: 14px;">Or copy this link: ${data.verificationLink}</p>
          <p class="footer">This link expires in 24 hours.<br>MKS Agencies | Siddha & Ayurveda Medicines</p>
        </div>
      </div>
    </body>
    </html>
  `,

  emailLogin: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign In to MKS Agencies</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f4; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
        .logo span { display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #059669, #047857); border-radius: 50%; line-height: 60px; color: white; font-size: 28px; font-weight: bold; }
        h1 { color: #1c1917; font-size: 24px; margin: 24px 0 8px; }
        p { color: #78716c; line-height: 1.6; }
        .button { display: inline-block; background: linear-gradient(135deg, #059669, #047857); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; margin: 24px 0; }
        .security-note { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin: 20px 0; }
        .security-note p { color: #1e40af; font-size: 14px; margin: 0; }
        .footer { margin-top: 24px; font-size: 12px; color: #a8a29e; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo"><span>M</span></div>
          <h1>Sign In to Your Account</h1>
          <p>Click the button below to securely sign in to MKS Agencies. No password needed!</p>
          <a href="${data.loginLink}" class="button">Sign In Now</a>
          <div class="security-note">
            <p>🔒 This is a secure, one-time login link. It will expire in 24 hours.</p>
          </div>
          <p style="font-size: 14px;">Or copy this link: ${data.loginLink}</p>
          <p class="footer">If you didn't request this, you can safely ignore this email.<br>MKS Agencies | Siddha & Ayurveda Medicines</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function handler(event, context) {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  // Parse path to route requests
  // The path comes in as something like "/send/order-confirmation" or "/.netlify/functions/email/send/order-confirmation"
  // We need to robustly handle this.
  const path = event.path.replace(/^\/\.netlify\/functions\/email/, '') || '/'

  console.log(`Received ${event.httpMethod} request for ${path}`)

  try {
    // Health check
    if (path === '/health' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() })
      }
    }

    // POST requests
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')

      // Send order confirmation
      if (path === '/send/order-confirmation') {
        const { to, name, orderNumber, items, total } = body
        await transporter.sendMail({
          from: `"MKS Agencies" <${process.env.GMAIL_USER}>`,
          to,
          subject: `Order Confirmed - ${orderNumber}`,
          html: templates.orderConfirmation({ name, orderNumber, items, total })
        })
        console.log(`✉️ Order confirmation sent to ${to}`)
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        }
      }

      // Send status update
      if (path === '/send/status-update') {
        const { to, orderNumber, status, statusLabel, statusDescription, trackingUrl } = body

        // Fallback for missing labels
        const safeLabel = statusLabel || status
        const safeDescription = statusDescription || ''

        await transporter.sendMail({
          from: `"MKS Agencies" <${process.env.GMAIL_USER}>`,
          to,
          subject: `Order Update - ${orderNumber}: ${safeLabel}`,
          html: templates.statusUpdate({ orderNumber, statusLabel: safeLabel, statusDescription: safeDescription, trackingUrl })
        })
        console.log(`✉️ Status update sent to ${to}`)
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        }
      }

      // Send admin alert
      if (path === '/send/admin-alert') {
        const { type, orderNumber, customerName, total } = body
        const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER
        await transporter.sendMail({
          from: `"MKS Agencies System" <${process.env.GMAIL_USER}>`,
          to: adminEmail,
          subject: `🔔 ${type === 'new-order' ? 'New Order' : 'Order Update'} - ${orderNumber}`,
          html: templates.adminAlert({ type, orderNumber, customerName, total })
        })
        console.log(`✉️ Admin alert sent for ${orderNumber}`)
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        }
      }

      // Send guest verification
      if (path === '/send/guest-verification') {
        const { to, name, verificationLink } = body
        await transporter.sendMail({
          from: `"MKS Agencies" <${process.env.GMAIL_USER}>`,
          to,
          subject: 'Verify Your Email - MKS Agencies',
          html: templates.guestVerification({ name, verificationLink })
        })
        console.log(`✉️ Verification email sent to ${to}`)
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        }
      }

      // Send email login link
      if (path === '/send/email-login') {
        const { to, loginLink } = body
        await transporter.sendMail({
          from: `"MKS Agencies" <${process.env.GMAIL_USER}>`,
          to,
          subject: 'Sign In to MKS Agencies',
          html: templates.emailLogin({ loginLink })
        })
        console.log(`✉️ Login email sent to ${to}`)
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        }
      }
    }

    // Accept root GET for simple check if needed, or 404
    if (path === '/' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Email server ready' })
      }
    }

    // 404 for unmatched routes
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: `Not found: ${path}` })
    }

  } catch (error) {
    console.error('SERVER ERROR:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process request', details: error.message })
    }
  }
}
