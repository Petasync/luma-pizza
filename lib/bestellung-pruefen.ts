import { CreateOrderPayload } from './types'
import { priceCart, PricedCart, PricingError } from './pricing'
import { isDeliverable } from './postal-codes'
import { isOpen, getOpeningStatus } from './opening-hours'
import { getMinOrderForPostalCode } from './business'

/**
 * Alle Regeln, die erfüllt sein müssen, BEVOR Geld fließt.
 *
 * Früher standen diese Prüfungen ausschließlich in `POST /api/orders` — und die
 * Route lief erst NACH der Stripe-Zahlung. Eine Ablehnung ("wir haben schon zu",
 * "Mindestbestellwert nicht erreicht") kam damit zu einem Zeitpunkt, an dem das
 * Geld des Kunden bereits eingezogen war und die Bestellung trotzdem nirgends
 * ankam. Deshalb liegen die Regeln jetzt hier, gemeinsam nutzbar, und werden
 * beim Karten-Weg vor `confirmPayment` ausgeführt.
 */

export interface Pruefergebnis {
  fehler?: { nachricht: string; status: number }
  priced?: PricedCart
}

export function pruefeBestellung(body: CreateOrderPayload, jetzt: Date = new Date()): Pruefergebnis {
  // --- Öffnungszeiten ---
  if (!isOpen(jetzt)) {
    const status = getOpeningStatus(jetzt)
    const next = status.open ? '' : ` Wir öffnen ${status.nextOpenLabel} um ${status.nextOpenTime} Uhr.`
    return { fehler: { nachricht: `Wir nehmen aktuell keine Bestellungen entgegen.${next}`, status: 503 } }
  }

  // --- Pflichtfelder ---
  if (!body.customer_name || !body.customer_email || !body.customer_phone) {
    return { fehler: { nachricht: 'Kontaktdaten fehlen.', status: 400 } }
  }
  if (body.type === 'delivery') {
    if (!body.delivery_address || !body.postal_code) {
      return { fehler: { nachricht: 'Lieferadresse fehlt.', status: 400 } }
    }
    if (!isDeliverable(body.postal_code)) {
      return { fehler: { nachricht: 'Wir liefern leider nicht an diese PLZ.', status: 400 } }
    }
  }

  // --- Preise: der Browser wird nicht vertraut, alles neu rechnen ---
  let priced: PricedCart
  try {
    priced = priceCart(body.items)
  } catch (e) {
    const msg = e instanceof PricingError ? e.message : 'Warenkorb ungültig.'
    return { fehler: { nachricht: msg, status: 400 } }
  }

  // --- Mindestbestellwert bei Lieferung (ortsabhängig) ---
  if (body.type === 'delivery') {
    const minOrder = getMinOrderForPostalCode(body.postal_code)
    if (priced.total < minOrder) {
      return { fehler: { nachricht: `Mindestbestellwert für Lieferung: ${minOrder},00 €.`, status: 400 } }
    }
  }

  return { priced }
}

/** Die Felder, die aus Payload + geprüftem Warenkorb in die Datenbank wandern. */
export function bestellungsZeile(body: CreateOrderPayload, priced: PricedCart) {
  return {
    type: body.type,
    customer_name: body.customer_name,
    customer_email: body.customer_email,
    customer_phone: body.customer_phone,
    delivery_address: body.type === 'delivery' ? body.delivery_address : null,
    postal_code: body.type === 'delivery' ? body.postal_code : null,
    items: priced.items,
    total_price: priced.total,
    payment_method: body.payment_method,
    notes: body.notes ?? null,
  }
}
