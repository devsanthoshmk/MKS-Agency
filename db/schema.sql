-- =====================================================
-- MKS Agencies E-commerce Database Schema
-- PostgreSQL with Row Level Security (RLS)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (managed by Neon Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  provider TEXT DEFAULT 'google',
  email_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  verification_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest users (for checkout without login)
CREATE TABLE IF NOT EXISTS guest_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  verification_token TEXT,
  verification_expires TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT false,
  verified_via TEXT, -- 'email' or 'phone'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (source of truth is JSON, this is for RLS queries)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2), -- Original price for showing discount
  category TEXT,
  subcategory TEXT,
  images TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES guest_users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'PENDING_VERIFICATION',
  total DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  -- Shipping details
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_email TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT NOT NULL,
  shipping_postal TEXT NOT NULL,
  shipping_country TEXT DEFAULT 'India',
  -- Tracking
  tracking_url TEXT,
  tracking_number TEXT,
  courier_name TEXT,
  -- Status details
  failure_reason TEXT,
  cancellation_reason TEXT,
  admin_notes TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  -- Constraint: either user_id or guest_id must be set
  CONSTRAINT order_user_check CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL, -- References product slug/id from JSON
  product_name TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  product_image TEXT,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order status history for timeline
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  changed_by TEXT DEFAULT 'system', -- 'system', 'admin', 'user'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL, -- References product slug/id from JSON
  product_data JSONB NOT NULL, -- Cached product data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Cart table (persistent server-side cart)
CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  product_data JSONB NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT 'Admin',
  passcode_hash TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  fcm_token TEXT, -- For push notifications
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table (future payment gateway ready)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  method TEXT DEFAULT 'manual', -- 'manual', 'stripe', 'razorpay', etc.
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'failed', 'refunded'
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  gateway_id TEXT, -- Payment gateway transaction ID
  gateway_response JSONB, -- Full response from gateway
  verified_by TEXT, -- Admin who verified (for manual)
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting table for admin login (backup, primary is Workers KV)
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  action TEXT NOT NULL, -- 'admin_login'
  attempts INTEGER DEFAULT 1,
  first_attempt TIMESTAMPTZ DEFAULT NOW(),
  last_attempt TIMESTAMPTZ DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  UNIQUE(ip_address, action)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_guest_users_email ON guest_users(email);
CREATE INDEX IF NOT EXISTS idx_guest_users_verification ON guest_users(verification_token);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_guest ON orders(guest_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip_address, action);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all user-facing tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- Products are public read
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Users: Can read/update their own profile
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Guest users: Only accessible via verification token (handled by Workers)
CREATE POLICY guest_users_verify ON guest_users
  FOR SELECT USING (false); -- All access through service role

-- Products: Public read access
CREATE POLICY products_public_read ON products
  FOR SELECT USING (is_active = true);

-- Orders: Users can see their own orders
CREATE POLICY orders_user_select ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY orders_user_insert ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Order Items: Access through order ownership
CREATE POLICY order_items_user_select ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY order_items_user_insert ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- Order Status History: Read through order ownership
CREATE POLICY order_history_user_select ON order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_status_history.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Wishlist: Full access to own wishlist
CREATE POLICY wishlist_user_all ON wishlist
  FOR ALL USING (auth.uid() = user_id);

-- Cart: Full access to own cart
CREATE POLICY cart_user_all ON cart
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

CREATE OR REPLACE VIEW order_analytics AS
SELECT
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'PENDING_VERIFICATION') as pending_verification,
  COUNT(*) FILTER (WHERE status = 'PAYMENT_VERIFIED') as payment_verified,
  COUNT(*) FILTER (WHERE status = 'PROCESSING') as processing,
  COUNT(*) FILTER (WHERE status = 'SHIPPED') as shipped,
  COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
  COALESCE(SUM(total) FILTER (WHERE status IN ('PAYMENT_VERIFIED', 'PROCESSING', 'SHIPPED', 'DELIVERED')), 0) as verified_revenue,
  COALESCE(SUM(total) FILTER (WHERE status = 'DELIVERED'), 0) as completed_revenue,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as orders_today,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as orders_week,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as orders_month
FROM orders;

CREATE OR REPLACE VIEW daily_order_stats AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as order_count,
  COALESCE(SUM(total), 0) as total_value,
  COALESCE(SUM(total) FILTER (WHERE status IN ('PAYMENT_VERIFIED', 'PROCESSING', 'SHIPPED', 'DELIVERED')), 0) as verified_value
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    new_number := 'MKS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number);
    counter := counter + 1;
    EXIT WHEN counter > 100; -- Prevent infinite loop
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cart_updated_at
  BEFORE UPDATE ON cart
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create order status history on order creation
CREATE OR REPLACE FUNCTION create_initial_order_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_status_history (order_id, status, note, changed_by)
  VALUES (NEW.id, NEW.status, 'Order placed', 'system');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_initial_history
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION create_initial_order_history();

-- Track order status changes
CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, note, changed_by)
    VALUES (NEW.id, NEW.status, NULL, 'admin');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_change_history
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION track_order_status_change();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Create default admin (passcode: mksagencies-admin)
-- bcrypt hash of 'mksagency-admin' with 10 rounds
INSERT INTO admins (name, passcode_hash)
VALUES ('MKS Agencies Admin', '$2b$10$rKN8VZE5YK3.ORqVHRKqk.dB7xIKX9tZ8bJGhCz/6qGp1HvKMVYjy')
ON CONFLICT DO NOTHING;

-- =====================================================
-- ORDER STATUS ENUM REFERENCE
-- =====================================================
-- PENDING_VERIFICATION - Order placed, awaiting payment verification
-- PAYMENT_VERIFIED - Payment confirmed manually
-- PROCESSING - Order being prepared
-- SHIPPED - Order dispatched with tracking
-- DELIVERED - Order delivered successfully
-- CANCELLED - Order cancelled (by user or admin)
-- FAILED - Order failed (payment issue, etc.)
