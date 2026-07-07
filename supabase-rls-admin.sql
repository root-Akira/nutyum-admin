-- Nutyum Admin Panel — Tighten RLS to admin-only access
-- Run this in Supabase SQL Editor (AFTER supabase-migration.sql)

-- Drop existing open policies
DROP POLICY IF EXISTS "Admin full access on products" ON products;
DROP POLICY IF EXISTS "Admin full access on product_variants" ON product_variants;
DROP POLICY IF EXISTS "Admin full access on orders" ON orders;
DROP POLICY IF EXISTS "Admin full access on order_items" ON order_items;
DROP POLICY IF EXISTS "Admin full access on order_status_logs" ON order_status_logs;
DROP POLICY IF EXISTS "Admin full access on coupons" ON coupons;
DROP POLICY IF EXISTS "Admin full access on banners" ON banners;
DROP POLICY IF EXISTS "Admin full access on cms_pages" ON cms_pages;
DROP POLICY IF EXISTS "Admin full access on shipping_zones" ON shipping_zones;
DROP POLICY IF EXISTS "Admin full access on site_settings" ON site_settings;
DROP POLICY IF EXISTS "Admin full access on categories" ON categories;
DROP POLICY IF EXISTS "Admin full access on users" ON public.users;

-- Recreate policies with admin email check
-- Add/remove admin emails here
CREATE POLICY "Admin full access on products" ON products
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'ss5494602@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ss5494602@gmail.com');

CREATE POLICY "Admin full access on product_variants" ON product_variants
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'ss5494602@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ss5494602@gmail.com');

CREATE POLICY "Admin full access on orders" ON orders
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'ss5494602@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ss5494602@gmail.com');

CREATE POLICY "Admin full access on order_items" ON order_items
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'ss5494602@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ss5494602@gmail.com');

CREATE POLICY "Admin full access on order_status_logs" ON order_status_logs
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'ss5494602@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ss5494602@gmail.com');

CREATE POLICY "Admin full access on coupons" ON coupons
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'ss5494602@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ss5494602@gmail.com');

CREATE POLICY "Admin full access on banners" ON banners
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'ss5494602@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ss5494602@gmail.com');

CREATE POLICY "Admin full access on cms_pages" ON cms_pages
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'ss5494602@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ss5494602@gmail.com');

CREATE POLICY "Admin full access on shipping_zones" ON shipping_zones
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'ss5494602@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ss5494602@gmail.com');

CREATE POLICY "Admin full access on site_settings" ON site_settings
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'ss5494602@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ss5494602@gmail.com');

CREATE POLICY "Admin full access on categories" ON categories
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'ss5494602@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ss5494602@gmail.com');

CREATE POLICY "Admin full access on users" ON public.users
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'ss5494602@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ss5494602@gmail.com');
