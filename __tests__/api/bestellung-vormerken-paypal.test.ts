/**
 * @jest-environment node
 *
 * Testet den neuen PayPal-Zweig von POST /api/bestellung/vormerken: Die
 * Bestellung muss VOR dem Kassieren angelegt werden, und der Betrag/Status der
 * PayPal-Bestellung wird serverseitig geprüft — nie dem Browser vertraut.
 *
 * Öffnungszeiten/Preisrechnung (`lib/bestellung-pruefen`) sind bereits in
 * `__tests__/lib/bestellung-pruefen.test.ts` abgedeckt und hier bewusst
 * gemockt, damit dieser Test nicht von der aktuellen Uhrzeit abhängt.
 */
import { NextRequest } from 'next/server'

interface Zeile {
  id: string
  payment_status: string
  payment_method?: string
  paypal_order_id?: string | null
  stripe_payment_intent_id?: string | null
  [k: string]: unknown
}

const mockSpeicher: { zeilen: Zeile[]; naechsteId: number } = { zeilen: [], naechsteId: 1 }

/** Minimaler Nachbau der genutzten Supabase-Kette — inklusive Unique-Konflikt (23505). */
class MockAbfrage {
  private op: 'insert' | 'update' | 'select' | null = null
  private insertWerte: Record<string, unknown> | null = null
  private filter: [string, unknown][] = []
  private einzeln = false

  insert(werte: Record<string, unknown>) {
    this.op = 'insert'
    this.insertWerte = werte
    return this
  }
  select() {
    if (this.op === null) this.op = 'select'
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
  single() {
    this.einzeln = true
    return this
  }
  private treffer(): Zeile[] {
    return mockSpeicher.zeilen.filter(z => this.filter.every(([s, w]) => z[s] === w))
  }
  then(resolve: (r: { data: unknown; error: unknown }) => void) {
    if (this.op === 'insert') {
      const werte = this.insertWerte!
      const konflikt = mockSpeicher.zeilen.find(
        z =>
          (werte.paypal_order_id != null && z.paypal_order_id === werte.paypal_order_id) ||
          (werte.stripe_payment_intent_id != null && z.stripe_payment_intent_id === werte.stripe_payment_intent_id),
      )
      if (konflikt) {
        resolve({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } })
        return
      }
      // Die Route setzt payment_status immer mit; TypeScript sieht das der
      // generischen Record-Signatur von `werte` aber nicht an.
      const neu = { id: `best-${mockSpeicher.naechsteId++}`, ...werte } as Zeile
      mockSpeicher.zeilen.push(neu)
      resolve({ data: { id: neu.id }, error: null })
      return
    }
    const treffer = this.treffer()
    resolve({ data: this.einzeln ? (treffer[0] ?? null) : treffer, error: null })
  }
}

jest.mock('@/lib/supabase-server', () => ({
  createSupabaseServer: () => ({ from: () => new MockAbfrage() }),
}))

const mockPruefePayPalVorabBetrag = jest.fn()
jest.mock('@/lib/paypal', () => ({
  pruefePayPalVorabBetrag: (...a: unknown[]) => mockPruefePayPalVorabBetrag(...a),
}))

// Nicht benutzt in diesen Tests, aber von der Route importiert.
jest.mock('@/lib/stripe', () => ({ stripe: { paymentIntents: { retrieve: jest.fn(), update: jest.fn() } } }))

jest.mock('@/lib/bestellung-pruefen', () => ({
  pruefeBestellung: jest.fn(() => ({
    priced: {
      total: 17,
      totalCents: 1700,
      items: [{ menuItemId: 'pizza-margherita', name: 'x', size: '45cm', price: 17, quantity: 1 }],
    },
  })),
  bestellungsZeile: jest.fn((body: any, priced: any) => ({
    type: body.type,
    customer_name: body.customer_name,
    customer_email: body.customer_email,
    customer_phone: body.customer_phone,
    items: priced.items,
    total_price: priced.total,
    payment_method: body.payment_method,
    notes: body.notes ?? null,
  })),
}))

import { POST } from '@/app/api/bestellung/vormerken/route'
import { CreateOrderPayload } from '@/lib/types'

function payload(over: Partial<CreateOrderPayload> = {}): CreateOrderPayload {
  return {
    type: 'pickup',
    customer_name: 'Kadir Test',
    customer_email: 'kadir@example.com',
    customer_phone: '0170 1234567',
    items: [{ menuItemId: 'pizza-margherita', name: 'x', size: '45cm', price: 0, quantity: 1 }],
    total_price: 17,
    payment_method: 'paypal',
    paypal_order_id: 'PAYPAL-ORDER-1',
    ...over,
  }
}

function req(body: unknown) {
  return { json: async () => body } as unknown as NextRequest
}

beforeEach(() => {
  mockSpeicher.zeilen = []
  mockSpeicher.naechsteId = 1
  mockPruefePayPalVorabBetrag.mockReset()
})

describe('POST /api/bestellung/vormerken (PayPal)', () => {
  it('legt bei gültiger, noch nicht kassierter PayPal-Bestellung eine pending-Bestellung an', async () => {
    mockPruefePayPalVorabBetrag.mockResolvedValue(true)

    const res = await POST(req(payload()))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.id).toBeTruthy()
    expect(mockSpeicher.zeilen).toHaveLength(1)
    expect(mockSpeicher.zeilen[0].payment_status).toBe('pending')
    expect(mockSpeicher.zeilen[0].paypal_order_id).toBe('PAYPAL-ORDER-1')
    // Der geprüfte Betrag kommt aus dem serverseitig neu berechneten Warenkorb
    // (1700 Cent), nicht aus dem Request.
    expect(mockPruefePayPalVorabBetrag).toHaveBeenCalledWith('PAYPAL-ORDER-1', 1700)
  })

  it('lehnt ab, wenn Betrag/Status bei PayPal nicht passt — legt KEINE Bestellung an', async () => {
    mockPruefePayPalVorabBetrag.mockResolvedValue(false)

    const res = await POST(req(payload()))

    expect(res.status).toBe(402)
    expect(mockSpeicher.zeilen).toHaveLength(0)
  })

  it('lehnt ohne paypal_order_id ab, bevor überhaupt bei PayPal nachgefragt wird', async () => {
    const res = await POST(req(payload({ paypal_order_id: undefined })))

    expect(res.status).toBe(400)
    expect(mockPruefePayPalVorabBetrag).not.toHaveBeenCalled()
  })

  it('ein zweiter Vormerk-Aufruf für dieselbe PayPal-Bestellung erzeugt keine zweite Zeile', async () => {
    mockPruefePayPalVorabBetrag.mockResolvedValue(true)

    const erster = await POST(req(payload()))
    const ersteId = (await erster.json()).id

    const zweiter = await POST(req(payload()))
    const zweiteId = (await zweiter.json()).id

    expect(zweiter.status).toBe(201)
    expect(zweiteId).toBe(ersteId)
    expect(mockSpeicher.zeilen).toHaveLength(1)
  })

  it('lehnt eine bereits bezahlte PayPal-Bestellung mit 409 ab', async () => {
    mockPruefePayPalVorabBetrag.mockResolvedValue(true)
    mockSpeicher.zeilen.push({
      id: 'best-alt',
      payment_status: 'paid',
      paypal_order_id: 'PAYPAL-ORDER-1',
    })

    const res = await POST(req(payload()))

    expect(res.status).toBe(409)
    expect(mockSpeicher.zeilen).toHaveLength(1)
  })
})
