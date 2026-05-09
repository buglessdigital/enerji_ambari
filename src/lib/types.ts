// ============================================================
// Enerji Ambarı - Type Definitions
// ============================================================

// --- Categories ---
export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  description: string | null
  image_url: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  children?: Category[]
  product_count?: number
}

// --- Products ---
export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  brand: string | null
  category_id: string | null
  sku: string | null
  price: number
  sale_price: number | null
  cost_price: number | null
  cost_price_usd: number | null
  cost_currency: string | null
  dealer_price: number | null
  dealer_sale_price: number | null
  price_markup_percent: number | null
  dealer_markup_percent: number | null
  discount_percent: number | null
  dealer_discount_percent: number | null
  stock_quantity: number
  is_active: boolean
  is_featured: boolean  // "Sizin İçin Seçtiklerimiz"
  meta_title: string | null
  meta_description: string | null
  technical_specs: Array<{ key: string; value: string }> | null
  created_at: string
  updated_at: string
  images?: ProductImage[]
  category?: Category
  variants?: ProductVariant[]
  reviews?: Review[]
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string | null
  sort_order: number
  is_cover: boolean
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string       // e.g. "Güç", "Renk", "Boyut"
  value: string      // e.g. "400W", "Siyah", "1200x600mm"
  price_modifier: number  // price adjustment
  stock_quantity: number
}

// --- Hero Slides ---
export interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string
  mobile_image_url: string | null
  button_text: string | null
  button_link: string | null
  secondary_button_text: string | null
  secondary_button_link: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

// --- Collections ---
export interface Collection {
  id: string
  title: string
  subtitle: string | null
  hover_text: string | null
  image_url: string
  target_url: string
  gradient_color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

// --- Orders ---
export interface Order {
  id: string
  order_number: string
  user_id: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_method: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  subtotal: number
  tax_amount: number
  shipping_cost: number
  total: number
  shipping_address_id: string | null
  billing_address_id: string | null
  tracking_number: string | null
  shipping_company: string | null
  customer_note: string | null
  admin_note: string | null
  payment_transaction_id: string | null
  payment_error: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
  user?: UserProfile
  shipping_address?: Address
  billing_address?: Address
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  product_image: string | null
  quantity: number
  unit_price: number
  total_price: number
  variant_info: string | null
}

// --- Users / Addresses ---
export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: 'customer' | 'dealer' | 'admin'
  created_at: string
}

export interface Address {
  id: string
  user_id: string
  label: string       // e.g. "Ev", "İş"
  full_name: string
  phone: string
  city: string
  district: string
  address_line: string
  zip_code: string | null
  is_default: boolean
  address_type: 'shipping' | 'billing' | 'both'
  created_at: string
}

// --- Favorites ---
export interface Favorite {
  id: string
  user_id: string
  product_id: string
  created_at: string
  product?: Product
}

// --- Reviews ---
export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number       // 1-5
  comment: string
  status: 'pending' | 'approved' | 'rejected'
  admin_reply: string | null
  created_at: string
  user?: UserProfile
}

// --- Dealer Applications ---
export interface DealerApplication {
  id: string
  company_name: string
  contact_name: string
  phone: string
  email: string
  business_area: string
  tax_office: string
  tax_number: string
  address: string
  city: string | null
  status: 'pending' | 'approved' | 'rejected'
  documents: string[]   // uploaded file URLs
  admin_note: string | null
  created_at: string
}

// --- Dealers ---
export interface Dealer {
  id: string
  user_id: string
  company_name: string
  dealer_group: string   // e.g. "Altın Bayi", "Gümüş Bayi"
  discount_rate: number  // e.g. 10 for 10%
  is_active: boolean
  notes: string | null
  total_orders: number
  created_at: string
  user?: UserProfile
}

// --- Site Settings ---
export interface SiteSettings {
  id: string
  site_name: string
  company_name: string
  email: string
  support_email: string | null
  phone: string
  phone_secondary: string | null
  whatsapp_number: string | null
  whatsapp_enabled: boolean
  address: string
  map_embed_code: string | null
  logo_url: string | null
  dark_logo_url: string | null
  favicon_url: string | null
  footer_logo_url: string | null
  instagram_url: string | null
  linkedin_url: string | null
  facebook_url: string | null
  youtube_url: string | null
  twitter_url: string | null
  meta_title: string | null
  meta_description: string | null
  google_analytics_code: string | null
  indexing_enabled: boolean
  shipping_free_threshold: number | null
  shipping_flat_rate: number | null
  currency: string           // "TRY"
  tax_rate: number           // e.g. 20
  maintenance_mode: boolean
  feature_shipping_title: string
  feature_shipping_desc: string
  feature_guarantee_title: string
  feature_guarantee_desc: string
  feature_return_title: string
  feature_return_desc: string
  delivery_shipping_text: string
  delivery_return_text: string
  hero_fallback_badge: string
  hero_fallback_title: string
  hero_fallback_description: string
}

// --- Static Pages (Hakkımızda etc.) ---
export interface StaticPage {
  id: string
  slug: string
  title: string
  content: string           // Rich text HTML
  featured_image: string | null
  vision: string | null
  mission: string | null
  values: PageValue[] | null
  stats: PageStat[] | null
  meta_title: string | null
  meta_description: string | null
  updated_at: string
}

export interface PageValue {
  icon: string
  title: string
  description: string
}

export interface PageStat {
  label: string     // e.g. "Tamamlanan Proje"
  value: string     // e.g. "500+"
}

// --- Quotes ---
export interface QuoteItem {
  product_id: string
  product_name: string
  product_sku: string | null
  image_url: string | null
  quantity: number
  unit_price: number
  total_price: number
}

export interface Quote {
  id: string
  quote_number: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  valid_until: string | null
  note: string | null
  items: QuoteItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  created_by: string | null
  created_at: string
  updated_at: string
}

// --- Cart (Client-side) ---
export interface CartItem {
  product: Product
  quantity: number
  variant?: ProductVariant
}
