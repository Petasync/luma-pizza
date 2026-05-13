export type OrderType = 'delivery' | 'pickup'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered'
export type PaymentMethod = 'card' | 'paypal' | 'cash'
export type PaymentStatus = 'pending' | 'paid' | 'failed'

export interface CartItem {
  menuItemId: string
  name: string
  size: string | null
  price: number
  quantity: number
}

export interface MenuItem {
  id: string
  category: string
  name: string
  description: string
  price?: number
  priceSmall?: number
  priceLarge?: number
  available: boolean
  tags?: ('vegetarisch' | 'scharf' | '18+')[]
}

export interface Order {
  id: string
  created_at: string
  status_changed_at: string
  status: OrderStatus
  type: OrderType
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address?: string
  postal_code?: string
  items: CartItem[]
  total_price: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  stripe_payment_intent_id?: string
  notes?: string
}

export interface CreateOrderPayload {
  type: OrderType
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address?: string
  postal_code?: string
  items: CartItem[]
  total_price: number
  payment_method: PaymentMethod
  notes?: string
  stripe_payment_intent_id?: string
}
