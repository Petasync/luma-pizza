/**
 * @jest-environment node
 *
 * Testet den neuen PayPal-Zweig von POST /api/bestellung/bestaetigen: Die
 * Bestätigung muss serverseitig bei PayPal nachfragen, ob wirklich bezahlt
 * wurde — der Angabe des Browsers wird nie vertraut. Ein doppelter Aufruf
 * (z. B. weil der Browser die Antwort verpasst und es erneut versucht) darf
 * weder eine zweite Bestellung noch eine zweite Mail erzeugen.
 */
import { NextRequest } from 'next/server'

interface Zeile {
  id: string
  payment_status: string
  payment_method: string
  paypal_order_id?: string | null
  stripe_payment_intent_id?: string | null
  total_price: number
  benachrichtigt_am: string | null
  [k: string]: unknown
}

const mockSpeicher: { zeilen: Zeile[] } = { zeilen: [] }

/** Minimaler Nachbau der genutzten Supabase-Kette — inklusive bedingtem UPDATE. */
class MockAbfrage {
  private op: 'update' | 'select' | null = null
  private patch: Record<string, unknown> = {}
  private filter: [string, unknown][] = []
  private gibZeilenZurueck = false
  private einzeln = false

  update(patch: Record<string, unknown>) {
    this.op = 'update'
    this.patch = patch
    return this
  }
  select() {
    if (this.op === 'update') this.gibZeilenZurueck = true
    else this.op = 'select'
    return this
  }
  eq(spalte: string, wert: unknown) {
    this.filter.push([spalte, wert])
    return this
  }
  maybeSingle() {
    this.einzeln = true
    return this
  }
  private treffer(): Zeile[] {
    return mockSpeicher.zeilen.filter(z => this.filter.every(([s, w]) => z[s] === w))
  }
  then(resolve: (r: { data: unknown; error: null }) => void) {
    const treffer = this.treffer()
    if (this.op === 'update') {
      treffer.forEach(z => Object.assign(z, this.patch))
      resolve({ data: this.gibZeilenZurueck ? treffer : null, error: null })
    } else {
      resolve({ data: this.einzeln ? (treffer[0] ?? null) : treffer, error: null })
    }
  }
}

jest.mock('@/lib/supabase-server', () => ({
  createSupabaseServer: () => ({ from: () => new MockAbfrage() }),
}))

const mockKundenMail = jest.fn()
const mockRestaurantMail = jest.fn()
jest.mock('@/lib/resend', () => ({
  sendOrderConfirmationToCustomer: (...a: unknown[]) => mockKundenMail(...a),
  sendNewOrderToRestaurant: (...a: unknown[]) => mockRestaurantMail(...a),
}))

const mockVerifyPayPalOrder = jest.fn()
jest.mock('@/lib/paypal', () => ({
  verifyPayPalOrder: (...a: unknown[]) => mockVerifyPayPalOrder(...a),
}))

// Nicht benutzt in diesen Tests, aber von der Route importiert.
jest.mock('@/lib/stripe', () => ({ stripe: { paymentIntents: { retrieve: jest.fn() } } }))

import { POST } from '@/app/api/bestellung/bestaetigen/route'

function req(body: unknown) {
  return { json: async () => body } as unknown as NextRequest
}

beforeEach(() => {
  mockSpeicher.zeilen = [
    {
      id: 'best-paypal-1',
      payment_status: 'pending',
      payment_method: 'paypal',
      paypal_order_id: 'PAYPAL-ORDER-1',
      total_price: 17,
      benachrichtigt_am: null,
    },
  ]
  mockKundenMail.mockReset().mockResolvedValue(undefined)
  mockRestaurantMail.mockReset().mockResolvedValue(undefined)
  mockVerifyPayPalOrder.mockReset()
})

describe('POST /api/bestellung/bestaetigen (PayPal)', () => {
  it('PayPal-Zahlung erfolgreich: setzt auf bezahlt und verschickt beide Mails', async () => {
    mockVerifyPayPalOrder.mockResolvedValue(true)

    const res = await POST(req({ order_id: 'best-paypal-1' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.id).toBe('best-paypal-1')
    expect(mockSpeicher.zeilen[0].payment_status).toBe('paid')
    expect(mockKundenMail).toHaveBeenCalledTimes(1)
    expect(mockRestaurantMail).toHaveBeenCalledTimes(1)
    // Betrag kommt aus der Bestellung in der DB, nicht aus dem Request.
    expect(mockVerifyPayPalOrder).toHaveBeenCalledWith('PAYPAL-ORDER-1', 1700)
  })

  it('PayPal-Zahlung schlägt fehl: bleibt pending, KEINE Mail, dem Browser wird nicht vertraut', async () => {
    mockVerifyPayPalOrder.mockResolvedValue(false)

    const res = await POST(req({ order_id: 'best-paypal-1' }))
    const data = await res.json()

    expect(res.status).toBe(402)
    expect(data.error).toMatch(/nicht verifiziert/i)
    expect(mockSpeicher.zeilen[0].payment_status).toBe('pending')
    expect(mockKundenMail).not.toHaveBeenCalled()
    expect(mockRestaurantMail).not.toHaveBeenCalled()
  })

  it('meldet einen PayPal-Fehler (z. B. Netzwerkfehler) ebenfalls als nicht verifiziert, statt zu werfen', async () => {
    mockVerifyPayPalOrder.mockRejectedValue(new Error('PayPal down'))

    const res = await POST(req({ order_id: 'best-paypal-1' }))

    expect(res.status).toBe(402)
    expect(mockSpeicher.zeilen[0].payment_status).toBe('pending')
  })

  it('doppelter Aufruf: zweite Bestätigung erzeugt keine zweite Bestellung und keine zweite Mail', async () => {
    mockVerifyPayPalOrder.mockResolvedValue(true)

    const erster = await POST(req({ order_id: 'best-paypal-1' }))
    const zweiter = await POST(req({ order_id: 'best-paypal-1' }))

    expect(erster.status).toBe(200)
    expect(zweiter.status).toBe(200)
    expect(mockSpeicher.zeilen).toHaveLength(1) // keine zweite Zeile in der DB
    expect(mockKundenMail).toHaveBeenCalledTimes(1)
    expect(mockRestaurantMail).toHaveBeenCalledTimes(1)
    // Sobald "paid", fragt die Route gar nicht mehr erneut bei PayPal nach.
    expect(mockVerifyPayPalOrder).toHaveBeenCalledTimes(1)
  })

  it('meldet eine unbekannte Bestellung als nicht gefunden', async () => {
    const res = await POST(req({ order_id: 'gibt-es-nicht' }))
    expect(res.status).toBe(404)
  })

  it('lehnt eine PayPal-Bestätigung für eine Bestellung ohne paypal_order_id ab', async () => {
    mockSpeicher.zeilen[0].paypal_order_id = undefined
    const res = await POST(req({ order_id: 'best-paypal-1' }))
    expect(res.status).toBe(400)
    expect(mockVerifyPayPalOrder).not.toHaveBeenCalled()
  })
})
