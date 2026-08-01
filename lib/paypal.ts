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

/**
 * Wird geworfen, wenn die Anfrage an PayPal selbst (technisch) fehlgeschlagen
 * ist — Netzwerkfehler, 5xx, Rate-Limit (429), ein sonst unerwarteter
 * Statuscode. Das ist AUSDRÜCKLICH NICHT dasselbe wie "PayPal sagt: nicht
 * bezahlt" und darf von keinem Aufrufer mit `false`/`null`/"nicht bezahlt"
 * verwechselt werden — genau diese Verwechslung hätte den Vorfall vom
 * 26.07.2026 auf einem anderen Weg wiederholen können: eine tatsächlich
 * bezahlte Bestellung darf niemals wegen eines vorübergehenden PayPal-
 * Ausfalls als "failed" enden.
 */
export class PayPalAbfrageFehlgeschlagen extends Error {}

/**
 * Roher Abruf einer PayPal-Bestellung — von den beiden Prüf-Funktionen unten
 * geteilt.
 *
 * Unterscheidet bewusst zwei völlig verschiedene Fälle:
 *  - **404 Not Found** ist eine verlässliche INHALTLICHE Auskunft von PayPal
 *    ("diese Bestellung existiert nicht") → `null`.
 *  - **Jeder andere Fehlerstatus** (5xx, 429, 401/403, sonst etwas
 *    Unerwartetes) ist KEINE verlässliche Auskunft, sondern eine gescheiterte
 *    Anfrage → wirft `PayPalAbfrageFehlgeschlagen`. Aufrufer (z. B. die
 *    Nachtwache) müssen das über try/catch von "nicht bezahlt" trennen und
 *    dürfen im Fehlerfall NICHTS abstempeln.
 */
async function holePayPalBestellung(orderId: string): Promise<any | null> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    throw new PayPalAbfrageFehlgeschlagen(
      `PayPal-Abfrage für Bestellung ${orderId} fehlgeschlagen: HTTP ${res.status}.`,
    )
  }
  return res.json()
}

/**
 * Confirms a PayPal order is COMPLETED and was paid for the expected amount.
 * Returns `true`/`false` nur bei einer verlässlichen Auskunft von PayPal
 * (inkl. "404 = existiert nicht" → `false`). Schlägt die Abfrage selbst
 * fehl (5xx, Rate-Limit, Netzwerk), wirft diese Funktion
 * `PayPalAbfrageFehlgeschlagen` — der Aufrufer MUSS das getrennt von "false"
 * behandeln (nicht als "nicht bezahlt" werten).
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
 *
 * Wie bei `verifyPayPalOrder`: Schlägt die Abfrage selbst fehl, wirft diese
 * Funktion `PayPalAbfrageFehlgeschlagen` statt `false` zurückzugeben.
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
