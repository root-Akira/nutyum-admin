import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  compare_price: z.coerce.number().min(0, 'Compare price must be 0 or more'),
  weight: z.string().optional(),
  images: z.array(z.string().url('Invalid image URL')).min(0),
  is_new: z.boolean(),
  is_best_seller: z.boolean(),
  is_coming_soon: z.boolean(),
  nutritional_info: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  vibes: z.array(z.string()).optional(),
})

export const couponSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50, 'Code too long'),
  type: z.enum(['flat', 'percentage']),
  value: z.coerce.number().min(1, 'Value must be at least 1'),
  min_order: z.coerce.number().min(0, 'Min order must be 0 or more'),
  usage_limit: z.coerce.number().int().min(1, 'Usage limit must be at least 1'),
  per_user_limit: z.coerce.number().int().min(1, 'Per-user limit must be at least 1'),
  applies_to: z.enum(['all', 'categories', 'products']),
  applicable_ids: z.array(z.string()),
  starts_at: z.string().optional(),
  expires_at: z.string().optional(),
  is_active: z.boolean(),
  show_in_store: z.boolean(),
})

export const siteSettingsSchema = z.object({
  store_name: z.string().min(1, 'Store name is required'),
  store_email: z.string().email('Invalid email').or(z.literal('')),
  store_phone: z.string().optional(),
  store_address: z.string().optional(),
  gst_number: z.string().optional(),
  cod_enabled: z.boolean(),
  cod_charge: z.coerce.number().min(0, 'COD charge must be 0 or more'),
  maintenance_mode: z.boolean(),
  social_links: z.string(),
})
