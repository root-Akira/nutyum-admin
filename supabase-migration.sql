-- Nutyum Admin Panel — DB Migration
-- Run this in Supabase SQL Editor

-- Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  compare_price DECIMAL(10,2) DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_out_of_stock BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_alts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS show_in_store BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;

-- Stock change log
CREATE TABLE IF NOT EXISTS stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  old_stock INTEGER NOT NULL DEFAULT 0,
  new_stock INTEGER NOT NULL DEFAULT 0,
  change INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on stock_logs" ON stock_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed','confirmed','packed','shipped','out_for_delivery','delivered','cancelled','returned')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid','pending','failed','refunded')),
  payment_method TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_address JSONB,
  tracking_number TEXT,
  courier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  image TEXT
);

-- Order status logs table
CREATE TABLE IF NOT EXISTS order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  changed_by TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('flat','percentage')),
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_order DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(10,2) DEFAULT 0,
  usage_limit INTEGER NOT NULL DEFAULT 100,
  usage_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER NOT NULL DEFAULT 1,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','categories','products')),
  applicable_ids JSONB DEFAULT '[]'::jsonb,
  starts_at       TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  show_in_store   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link TEXT,
  title TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CMS pages table
CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shipping zones table
CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  states JSONB NOT NULL DEFAULT '[]'::jsonb,
  pincodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  free_above DECIMAL(10,2),
  estimated_days TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT 'Nutyum',
  store_email TEXT,
  store_phone TEXT,
  store_address TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  gst_number TEXT,
  cod_enabled BOOLEAN NOT NULL DEFAULT true,
  cod_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  social_links JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO categories (name, slug, description, "order") VALUES
  ('Classic', 'classic', 'Traditional roasted makhana', 1),
  ('Spicy', 'spicy', 'Bold heat and bold flavor', 2),
  ('Sweet', 'sweet', 'Decadent chocolate and sweet coatings', 3),
  ('Gift Pack', 'gift-pack', 'Curated assortments for gifting', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert default site settings
INSERT INTO site_settings (store_name, store_email, store_phone, store_address)
VALUES ('Nutyum', 'hello@nutyum.com', '', '')
ON CONFLICT DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Open access for authenticated admin users
CREATE POLICY "Admin full access on products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on product_variants" ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on order_items" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on order_status_logs" ON order_status_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on coupons" ON coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on banners" ON banners FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on cms_pages" ON cms_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on shipping_zones" ON shipping_zones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on site_settings" ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Users table (synced from auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  phone TEXT,
  is_blocked BOOLEAN DEFAULT false,
  order_count INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger function to sync auth.users -> public.users
CREATE OR REPLACE FUNCTION public.sync_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone',
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user();

-- Backfill existing users
INSERT INTO public.users (id, email, name, phone, created_at, updated_at)
SELECT
  id,
  email,
  raw_user_meta_data->>'name',
  raw_user_meta_data->>'phone',
  created_at,
  updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Add admin_reply column to reviews (for admin reply feature)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_reply TEXT;
