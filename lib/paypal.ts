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
 * Confirms a PayPal order is COMPLETED and was paid for the expected amount.
 * Returns true only on a fully verified match.
 */
export async function verifyPayPalOrder(orderId: string, expectedCents: number): Promise<boolean> {
  if (!isPayPalConfigured()) return false
  if (!orderId) return false

  const token = await getAccessToken()
  const res = await fetch(`${BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return false
  const order = await res.json()

  if (order.status !== 'COMPLETED') return false

  const capture = order.purchase_units?.[0]?.payments?.captures?.[0]
  if (!capture || capture.status !== 'COMPLETED') return false

  const amount = capture.amount
  if (!amount || amount.currency_code !== 'EUR') return false

  const paidCents = Math.round(parseFloat(amount.value) * 100)
  return paidCents === expectedCents
}
