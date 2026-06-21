import { CartItem } from './types'
import { getItemById } from './menu'

/**
 * Server-side price authority. The client sends a cart, but the browser is not
 * trusted — prices, totals and item availability are recomputed here against the
 * canonical menu. Never persist or charge based on client-supplied prices.
 */

export interface PricedCart {
  /** Cart items with prices overwritten by the authoritative menu price. */
  items: CartItem[]
  /** Authoritative total in euros, rounded to cents. */
  total: number
  /** Authoritative total in integer cents (use this for payment comparisons). */
  totalCents: number
}

class PricingError extends Error {}

/**
 * Maps the variant chosen in the UI (CartItem.size) to the authoritative price.
 * Für Pizzen trägt `size` die Größe (33cm/45cm), für Gerichte mit Beilage die
 * gewählte Beilage (ohne Aufpreis), sonst ist `size` null.
 */
function priceForItem(menuItemId: string, size: string | null): number {
  const item = getItemById(menuItemId)
  if (!item) throw new PricingError(`Unbekannter Artikel: ${menuItemId}`)
  if (!item.available) throw new PricingError(`Artikel nicht verfügbar: ${item.name}`)

  // Pizza: zwei Größen
  if (item.priceSmall !== undefined && item.priceLarge !== undefined) {
    if (size === '33cm') return item.priceSmall
    if (size === '45cm') return item.priceLarge
    throw new PricingError(`Größe ungültig für ${item.name}`)
  }

  // Gericht mit wählbarer Beilage: `size` muss eine erlaubte Beilage sein (kein Aufpreis)
  if (item.sides && item.sides.length > 0) {
    if (size === null || !item.sides.includes(size)) {
      throw new PricingError(`Beilage ungültig für ${item.name}`)
    }
    if (item.price === undefined) throw new PricingError(`Preis fehlt für ${item.name}`)
    return item.price
  }

  // Einfacher Artikel ohne Variante
  if (size !== null) throw new PricingError(`Größe ungültig: ${size}`)
  if (item.price === undefined) throw new PricingError(`Preis fehlt für ${item.name}`)
  return item.price
}

/**
 * Recomputes the cart against the canonical menu.
 * Throws PricingError if any item is unknown, unavailable, or has an invalid size/quantity.
 */
export function priceCart(items: CartItem[]): PricedCart {
  if (!Array.isArray(items) || items.length === 0) {
    throw new PricingError('Warenkorb ist leer.')
  }

  let totalCents = 0
  const priced: CartItem[] = items.map(raw => {
    const quantity = Number(raw.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      throw new PricingError('Ungültige Menge.')
    }
    const size = raw.size ?? null
    const unitPrice = priceForItem(raw.menuItemId, size)
    const menuItem = getItemById(raw.menuItemId)!
    totalCents += Math.round(unitPrice * 100) * quantity
    return {
      menuItemId: raw.menuItemId,
      name: menuItem.name,
      size,
      price: unitPrice,
      quantity,
    }
  })

  return {
    items: priced,
    total: totalCents / 100,
    totalCents,
  }
}

export { PricingError }
