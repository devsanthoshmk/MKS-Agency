/**
 * Email Server
 * Node.js + Nodemailer with Gmail App Password
 */

import express from 'express'
import nodemailer from 'nodemailer'
import cors from 'cors'
import { config } from 'dotenv'

// Load environment variables
config()

const app = express()
const PORT = process.env.EMAIL_SERVER_PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error)
  } else {
    console.log('✅ Email server ready to send emails')
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
            <p>MKS Ayurvedic | 100% Natural Wellness</p>
            <p>Need help? Contact us at support@mksayurvedic.com</p>
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
            <p>MKS Ayurvedic | 100% Natural Wellness</p>
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
          <p class="footer">This link expires in 24 hours.<br>MKS Ayurvedic | 100% Natural Wellness</p>
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
      <title>Sign In to MKS Ayurvedic</title>
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
          <p>Click the button below to securely sign in to MKS Ayurvedic. No password needed!</p>
          <a href="${data.loginLink}" class="button">Sign In Now</a>
          <div class="security-note">
            <p>🔒 This is a secure, one-time login link. It will expire in 24 hours.</p>
          </div>
          <p style="font-size: 14px;">Or copy this link: ${data.loginLink}</p>
          <p class="footer">If you didn't request this, you can safely ignore this email.<br>MKS Ayurvedic | 100% Natural Wellness</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Send order confirmation
app.post('/send/order-confirmation', async (req, res) => {
  try {
    const { to, name, orderNumber, items, total } = req.body

    await transporter.sendMail({
      from: `"MKS Ayurvedic" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Order Confirmed - ${orderNumber}`,
      html: templates.orderConfirmation({ name, orderNumber, items, total })
    })

    console.log(`✉️ Order confirmation sent to ${to}`)
    res.json({ success: true })
  } catch (error) {
    console.error('Order confirmation error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

// Send status update
app.post('/send/status-update', async (req, res) => {
  try {
    const { to, orderNumber, status, statusLabel, statusDescription, trackingUrl } = req.body

    await transporter.sendMail({
      from: `"MKS Ayurvedic" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Order Update - ${orderNumber}: ${statusLabel}`,
      html: templates.statusUpdate({ orderNumber, statusLabel, statusDescription, trackingUrl })
    })

    console.log(`✉️ Status update sent to ${to}`)
    res.json({ success: true })
  } catch (error) {
    console.error('Status update error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

// Send admin alert
app.post('/send/admin-alert', async (req, res) => {
  try {
    const { type, orderNumber, customerName, total } = req.body
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER

    await transporter.sendMail({
      from: `"MKS Ayurvedic System" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `🔔 ${type === 'new-order' ? 'New Order' : 'Order Update'} - ${orderNumber}`,
      html: templates.adminAlert({ type, orderNumber, customerName, total })
    })

    console.log(`✉️ Admin alert sent for ${orderNumber}`)
    res.json({ success: true })
  } catch (error) {
    console.error('Admin alert error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

// Send guest verification
app.post('/send/guest-verification', async (req, res) => {
  try {
    const { to, name, verificationLink } = req.body

    await transporter.sendMail({
      from: `"MKS Ayurvedic" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Verify Your Email - MKS Ayurvedic',
      html: templates.guestVerification({ name, verificationLink })
    })

    console.log(`✉️ Verification email sent to ${to}`)
    res.json({ success: true })
  } catch (error) {
    console.error('Verification email error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

// Send email login link
app.post('/send/email-login', async (req, res) => {
  try {
    const { to, loginLink } = req.body

    await transporter.sendMail({
      from: `"MKS Ayurvedic" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Sign In to MKS Ayurvedic',
      html: templates.emailLogin({ loginLink })
    })

    console.log(`✉️ Login email sent to ${to}`)
    res.json({ success: true })
  } catch (error) {
    console.error('Email login error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`📧 Email server running on http://localhost:${PORT}`)
})

