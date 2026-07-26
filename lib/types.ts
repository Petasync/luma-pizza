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
  /** Wählbare Beilagen ohne Aufpreis. Die Auswahl wird im CartItem.size gespeichert. */
  sides?: string[]
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
  paypal_order_id?: string
  notes?: string
  /**
   * Zeitpunkt, zu dem Kunden- und Restaurant-Mail rausgingen. Leer bei einer
   * bezahlten Bestellung heißt: Versand steht aus oder ist fehlgeschlagen —
   * die nächtliche Nachtwache holt ihn dann nach.
   */
  benachrichtigt_am?: string | null
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
  paypal_order_id?: string
}
