/**
 * Server-side PayPal verification. The browser captures the PayPal order, but we
 * never trust that — the server independently asks PayPal whether the order was
 * really completed and for the right amount before marking anything paid.
 *
 * Env: NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET,
 *      PAYPAL_MODE ("live" | "sandbox", default "sandbox").
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ''
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || ''
const BASE_URL =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

/** True only when real-looking credentials are present (placeholders start with "xxxx"). */
export function isPayPalConfigured(): boolean {
  return (
    CLIENT_ID.length > 10 &&
    CLIENT_SECRET.length > 10 &&
    !CLIENT_ID.startsWith('xxxx') &&
    !CLIENT_SECRET.startsWith('xxxx')
  )
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error('PayPal-Authentifizierung fehlgeschlagen.')
  const data = await res.json()
  return data.access_token as string
}

/** Roher Abruf einer PayPal-Bestellung — von den beiden Prüf-Funktionen unten geteilt. */
async function holePayPalBestellung(orderId: string): Promise<any> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

/**
 * Confirms a PayPal order is COMPLETED and was paid for the expected amount.
 * Returns true only on a fully verified match.
 */
export async function verifyPayPalOrder(orderId: string, expectedCents: number): Promise<boolean> {
  if (!isPayPalConfigured()) return false
  if (!orderId) return false

  const order = await holePayPalBestellung(orderId)
  if (!order) return false

  if (order.status !== 'COMPLETED') return false

  const capture = order.purchase_units?.[0]?.payments?.captures?.[0]
  if (!capture || capture.status !== 'COMPLETED') return false

  const amount = capture.amount
  if (!amount || amount.currency_code !== 'EUR') return false

  const paidCents = Math.round(parseFloat(amount.value) * 100)
  return paidCents === expectedCents
}

/**
 * Prüfung beim Vormerken — BEVOR der Browser `actions.order.capture()`
 * aufruft, also bevor Geld fließt. Analog zur Stripe-Prüfung in
 * `/api/bestellung/vormerken` (dort: `stripe.paymentIntents.retrieve`).
 *
 * Erwartet wird der Status "APPROVED": der Kunde hat bei PayPal zugestimmt,
 * aber noch nichts wurde kassiert. Ein bereits "COMPLETED"er Status wird
 * bewusst ABGELEHNT — das würde bedeuten, dass am Vormerken vorbei schon
 * kassiert wurde, und genau diese Reihenfolge soll ja verhindert werden.
 */
export async function pruefePayPalVorabBetrag(orderId: string, expectedCents: number): Promise<boolean> {
  if (!isPayPalConfigured()) return false
  if (!orderId) return false

  const order = await holePayPalBestellung(orderId)
  if (!order) return false
  if (order.status !== 'APPROVED') return false

  const amount = order.purchase_units?.[0]?.amount
  if (!amount || amount.currency_code !== 'EUR') return false

  const cents = Math.round(parseFloat(amount.value) * 100)
  return cents === expectedCents
}

/**
 * Für die nächtliche Nachtwache: nur der aktuelle Rohstatus, ohne Wertung.
 * `null` heißt ausdrücklich "die Abfrage selbst ist fehlgeschlagen" (Netz,
 * Konfiguration, PayPal down) — das ist NICHT dasselbe wie "nicht bezahlt" und
 * muss vom Aufrufer unterschiedlich behandelt werden (nicht anfassen statt
 * fälschlich auf "failed" zu setzen).
 */
export async function holePayPalStatus(orderId: string): Promise<string | null> {
  if (!isPayPalConfigured()) return null
  if (!orderId) return null
  try {
    const order = await holePayPalBestellung(orderId)
    return order?.status ?? null
  } catch {
    return null
  }
}

/**
 * Verifiziert die Signatur eines PayPal-Webhook-Events serverseitig bei PayPal
 * (POST auf `/v1/notifications/verify-webhook-signature`) — das Pendant zu
 * `stripe.webhooks.constructEvent`. Ohne diese Prüfung könnte jeder eine
 * beliebige URL mit gefälschten "bezahlt"-Events aufrufen.
 */
export async function verifiziertePayPalWebhookSignatur(
  headers: { get(name: string): string | null },
  rohText: string,
  webhookId: string,
): Promise<boolean> {
  if (!isPayPalConfigured()) return false
  try {
    const token = await getAccessToken()
    const webhookEvent = JSON.parse(rohText)
    const res = await fetch(`${BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_algo: headers.get('paypal-auth-algo'),
        cert_url: headers.get('paypal-cert-url'),
        transmission_id: headers.get('paypal-transmission-id'),
        transmission_sig: headers.get('paypal-transmission-sig'),
        transmission_time: headers.get('paypal-transmission-time'),
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    })
    if (!res.ok) return false
    const data = await res.json()
    return data.verification_status === 'SUCCESS'
  } catch {
    return false
  }
}
