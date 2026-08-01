/**
 * @jest-environment node
 *
 * Testet `lib/paypal.ts` direkt gegen eine gemockte `fetch()` — der Kern des
 * Review-Fundes war, dass eine echte HTTP-Fehlerantwort von PayPal (500, 429,
 * …) intern zu `null`/`false` = "nicht bezahlt" wurde, statt als eigener
 * Fehlerfall erkannt zu werden. Diese Tests liefern bewusst eine ECHTE, aber
 * fehlerhafte HTTP-Antwort (kein `mockRejectedValue`-Wurf) — genau der Fall,
 * den der Review als ungetestet bemängelte: die bisherigen Tests prüften nur,
 * dass der try/catch-Rahmen der Aufrufer funktioniert, nie dass `lib/paypal.ts`
 * selbst einen HTTP-Fehler korrekt als Fehler erkennt.
 *
 * `NEXT_PUBLIC_PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` werden pro Test neu
 * gesetzt und das Modul per `jest.resetModules()` + dynamischem Import neu
 * geladen, weil `lib/paypal.ts` diese Werte einmalig beim Modul-Laden in
 * Modul-Konstanten liest (`isPayPalConfigured()` müsste sonst immer `false`
 * liefern, und kein Test käme überhaupt bis zum `fetch`-Aufruf).
 */

const ORIGINAL_ENV = process.env

function tokenAntwort() {
  return { ok: true, status: 200, json: async () => ({ access_token: 'token-123' }) }
}

function bestellAntwort(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

async function ladePayPalModul() {
  jest.resetModules()
  process.env = {
    ...ORIGINAL_ENV,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: 'echte-test-client-id-123456',
    PAYPAL_CLIENT_SECRET: 'echtes-test-secret-123456',
    PAYPAL_MODE: 'sandbox',
  }
  return import('@/lib/paypal')
}

afterEach(() => {
  process.env = ORIGINAL_ENV
  jest.restoreAllMocks()
})

describe('lib/paypal — "nicht bezahlt" vs. "Abfrage selbst fehlgeschlagen"', () => {
  it('HTTP 500 von PayPal: verifyPayPalOrder wirft PayPalAbfrageFehlgeschlagen statt "false" (nicht bezahlt) zu melden', async () => {
    const paypal = await ladePayPalModul()
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(tokenAntwort()) // /v1/oauth2/token
      .mockResolvedValueOnce(bestellAntwort(500)) // /v2/checkout/orders/:id
    global.fetch = fetchMock as unknown as typeof fetch

    await expect(paypal.verifyPayPalOrder('PAYPAL-1', 1700)).rejects.toThrow(paypal.PayPalAbfrageFehlgeschlagen)
  })

  it('HTTP 429 (Rate-Limit) von PayPal: pruefePayPalVorabBetrag wirft, statt "false" zu melden', async () => {
    const paypal = await ladePayPalModul()
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(tokenAntwort())
      .mockResolvedValueOnce(bestellAntwort(429))
    global.fetch = fetchMock as unknown as typeof fetch

    await expect(paypal.pruefePayPalVorabBetrag('PAYPAL-1', 1700)).rejects.toThrow(paypal.PayPalAbfrageFehlgeschlagen)
  })

  it('HTTP 502 von PayPal: verifyPayPalOrder wirft ebenfalls (nicht nur 500 ist abgedeckt)', async () => {
    const paypal = await ladePayPalModul()
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(tokenAntwort())
      .mockResolvedValueOnce(bestellAntwort(502))
    global.fetch = fetchMock as unknown as typeof fetch

    await expect(paypal.verifyPayPalOrder('PAYPAL-1', 1700)).rejects.toThrow(paypal.PayPalAbfrageFehlgeschlagen)
  })

  it('HTTP 404 von PayPal (Bestellung existiert wirklich nicht): verifyPayPalOrder liefert false, OHNE zu werfen', async () => {
    const paypal = await ladePayPalModul()
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(tokenAntwort())
      .mockResolvedValueOnce(bestellAntwort(404))
    global.fetch = fetchMock as unknown as typeof fetch

    await expect(paypal.verifyPayPalOrder('PAYPAL-existiert-nicht', 1700)).resolves.toBe(false)
  })

  it('eine echte, abgeschlossene Zahlung mit passendem Betrag wird weiterhin korrekt als true erkannt', async () => {
    const paypal = await ladePayPalModul()
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(tokenAntwort())
      .mockResolvedValueOnce(
        bestellAntwort(200, {
          status: 'COMPLETED',
          purchase_units: [
            {
              payments: {
                captures: [{ status: 'COMPLETED', amount: { currency_code: 'EUR', value: '17.00' } }],
              },
            },
          ],
        }),
      )
    global.fetch = fetchMock as unknown as typeof fetch

    await expect(paypal.verifyPayPalOrder('PAYPAL-ok', 1700)).resolves.toBe(true)
  })
})
