import { CreateOrderPayload } from './types'
import { priceCart, PricedCart, PricingError } from './pricing'
import { isDeliverable } from './postal-codes'
import { isOpen, getOpeningStatus } from './opening-hours'
import { getMinOrderForPostalCode, PAYPAL_AKTIV } from './business'

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
  // --- Öffnungszeiten (Abholung ab 11:00, Lieferung erst ab 17:00) ---
  if (!isOpen(jetzt, body.type)) {
    const status = getOpeningStatus(jetzt, body.type)
    const wann = status.open ? '' : ` ${status.nextOpenLabel} ab ${status.nextOpenTime} Uhr.`
    if (body.type === 'delivery') {
      // Mittags läuft die Abholung längst — dann ist ein blankes Nein die
      // schlechtere Auskunft als der Hinweis darauf.
      const abholbar = isOpen(jetzt, 'pickup') ? ' Abholen kannst du jetzt schon.' : ''
      return { fehler: { nachricht: `Wir liefern gerade nicht.${wann}${abholbar}`, status: 503 } }
    }
    return { fehler: { nachricht: `Wir nehmen aktuell keine Abholbestellungen entgegen.${wann}`, status: 503 } }
  }

  // --- Zahlart ---
  // Der ausgeblendete Knopf an der Kasse hält nur den Browser ab; ein von Hand
  // gebauter Request käme sonst weiterhin durch und legte eine PayPal-Bestellung
  // an, die niemand mehr bezahlen kann.
  if (body.payment_method === 'paypal' && !PAYPAL_AKTIV) {
    return { fehler: { nachricht: 'PayPal steht derzeit nicht zur Verfügung.', status: 400 } }
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
