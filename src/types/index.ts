export interface AuthUser {
  id: string
  email: string
  role?: 'super_admin' | 'admin' | 'staff'
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  category: string
  price: number
  compare_price?: number
  sku: string
  stock: number
  images: string[]
  tags: string[]
  is_active: boolean
  is_coming_soon: boolean
  is_best_seller: boolean
  is_new: boolean
  launch_date?: string
  nutrition?: string
  ingredients?: string
  meta_title?: string
  meta_description?: string
  bgColor?: string
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku: string
  price: number
  compare_price?: number
  stock: number
  is_active: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  status: 'placed' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned'
  payment_status: 'paid' | 'pending' | 'failed' | 'refunded'
  payment_method: string
  subtotal: number
  shipping: number
  discount: number
  tax: number
  total: number
  shipping_address: Address
  tracking_number?: string
  courier?: string
  notes?: string
  created_at: string
  updated_at: string
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  product_id: string
  product_name: string
  variant_name?: string
  quantity: number
  price: number
  total: number
  image?: string
}

export interface OrderStatusLog {
  id: string
  order_id: string
  from_status: string
  to_status: string
  changed_by: string
  changed_at: string
}

export interface Address {
  id?: string
  name: string
  phone: string
  street: string
  city: string
  state: string
  pincode: string
  is_default?: boolean
}

export interface Customer {
  id: string
  email: string
  name?: string
  phone?: string
  is_blocked: boolean
  total_spent: number
  order_count: number
  created_at: string
  addresses?: Address[]
}

export interface Review {
  id: string
  product_id: string
  product_name?: string
  user_name?: string
  rating: number
  title: string
  comment: string
  is_approved: boolean
  admin_reply?: string
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  type: 'flat' | 'percentage'
  value: number
  min_order: number
  max_discount?: number
  usage_limit: number
  usage_count: number
  per_user_limit: number
  applies_to: 'all' | 'categories' | 'products'
  applicable_ids?: string[]
  starts_at: string
  expires_at: string
  is_active: boolean
  created_at: string
}

export interface Banner {
  id: string
  image_url: string
  link?: string
  title?: string
  order: number
  is_active: boolean
  starts_at?: string
  expires_at?: string
}

export interface CmsPage {
  id: string
  slug: string
  title: string
  content: string
  updated_at: string
}

export interface ShippingZone {
  id: string
  name: string
  states: string[]
  pincodes: string[]
  rate: number
  free_above?: number
  estimated_days: string
}

export interface SiteSettings {
  store_name: string
  store_email: string
  store_phone: string
  store_address: string
  currency: string
  gst_number?: string
  cod_enabled: boolean
  cod_charge: number
  maintenance_mode: boolean
  social_links: Record<string, string>
}

export interface DashboardStats {
  total_orders_today: number
  total_orders_week: number
  total_orders_month: number
  revenue_today: number
  revenue_week: number
  revenue_month: number
  new_customers: number
  pending_orders: number
  low_stock_count: number
  recent_orders: Order[]
  top_products: { name: string; sold: number; revenue: number }[]
}
