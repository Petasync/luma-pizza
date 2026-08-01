/**
 * @jest-environment node
 *
 * Testet den geänderten Teil 4 der nächtlichen Nachtwache
 * (`app/api/cron/nachtwache/route.ts`): Vormerkungen älter als 24 h dürfen
 * NICHT mehr blind auf "failed" gesetzt werden — vorher muss beim jeweiligen
 * Zahlungsdienst geprüft werden, ob nicht doch bezahlt wurde. War bezahlt
 * worden, muss die Bestellung auf "bezahlt" nachgetragen werden statt
 * fälschlich als fehlgeschlagen abgestempelt zu werden.
 *
 * Teile 1–3 (Wecker, Mail-Nachversand, Stripe-48h-Abgleich) sind hier bewusst
 * neutral gehalten (leere Ergebnisse), damit sich der Test auf Teil 4
 * konzentriert.
 */
import { NextRequest } from 'next/server'

interface Zeile {
  id: string
  payment_status: string
  payment_method: string
  stripe_payment_intent_id?: string | null
  paypal_order_id?: string | null
  total_price: number
  benachrichtigt_am: string | null
  created_at: string
  [k: string]: unknown
}

const mockSpeicher: { zeilen: Zeile[] } = { zeilen: [] }

/** Minimaler Nachbau der genutzten Supabase-Kette (select mit count/head, select mit Filtern, update). */
class MockAbfrage {
  private op: 'update' | 'select' | null = null
  private patch: Record<string, unknown> = {}
  private filter: [string, unknown][] = []
  private headCount = false
  private einzeln = false

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    if (this.op !== 'update') this.op = 'select'
    if (opts?.head) this.headCount = true
    return this
  }
  update(patch: Record<string, unknown>) {
    this.op = 'update'
    this.patch = patch
    return this
  }
  eq(spalte: string, wert: unknown) {
    this.filter.push([spalte, wert])
    return this
  }
  neq(spalte: string, wert: unknown) {
    this.filter.push([`!${spalte}`, wert])
    return this
  }
  is(spalte: string, wert: unknown) {
    this.filter.push([spalte, wert])
    return this
  }
  // Zeitfilter werden im Mock bewusst NICHT ausgewertet — welche Zeilen
  // "älter als 24h" sind, wird hier über die Testdaten selbst gesteuert
  // (die Route bekommt ohnehin nur, was wir als mockSpeicher.zeilen anlegen).
  gte() {
    return this
  }
  lt() {
    return this
  }
  maybeSingle() {
    this.einzeln = true
    return this
  }
  private erfuellt(z: Zeile, [spalte, wert]: [string, unknown]): boolean {
    if (spalte.startsWith('!')) return z[spalte.slice(1)] !== wert
    return z[spalte] === wert
  }
  private treffer(): Zeile[] {
    return mockSpeicher.zeilen.filter(z => this.filter.every(f => this.erfuellt(z, f)))
  }
  then(resolve: (r: { data: unknown; count?: number; error: null }) => void) {
    if (this.headCount) {
      resolve({ count: mockSpeicher.zeilen.length, data: null, error: null })
      return
    }
    const treffer = this.treffer()
    if (this.op === 'update') {
      treffer.forEach(z => Object.assign(z, this.patch))
      resolve({ data: treffer, error: null })
      return
    }
    resolve({ data: this.einzeln ? (treffer[0] ?? null) : treffer, error: null })
  }
}

jest.mock('@/lib/supabase-server', () => ({
  createSupabaseServer: () => ({ from: () => new MockAbfrage() }),
}))

const mockStripeRetrieve = jest.fn()
const mockStripeList = jest.fn()
jest.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: {
      retrieve: (...a: unknown[]) => mockStripeRetrieve(...a),
      list: (...a: unknown[]) => mockStripeList(...a),
    },
  },
}))

const mockVerifyPayPalOrder = jest.fn()
jest.mock('@/lib/paypal', () => ({
  verifyPayPalOrder: (...a: unknown[]) => mockVerifyPayPalOrder(...a),
}))

const mockMarkiereAlsBezahlt = jest.fn()
const mockVerschickeBestaetigungen = jest.fn()
jest.mock('@/lib/bezahlung', () => ({
  markiereAlsBezahlt: (...a: unknown[]) => mockMarkiereAlsBezahlt(...a),
  verschickeBestaetigungen: (...a: unknown[]) => mockVerschickeBestaetigungen(...a),
}))

const mockSendeNachtwacheBericht = jest.fn()
jest.mock('@/lib/resend', () => ({
  sendeNachtwacheBericht: (...a: unknown[]) => mockSendeNachtwacheBericht(...a),
}))

import { GET } from '@/app/api/cron/nachtwache/route'

const CRON_SECRET = 'test-cron-secret'

function req() {
  return {
    headers: { get: (name: string) => (name === 'authorization' ? `Bearer ${CRON_SECRET}` : null) },
  } as unknown as NextRequest
}

beforeEach(() => {
  process.env.CRON_SECRET = CRON_SECRET
  mockSpeicher.zeilen = []
  mockStripeRetrieve.mockReset()
  mockStripeList.mockReset().mockResolvedValue({ data: [] }) // Teil 3 (48h-Abgleich): neutral halten
  mockVerifyPayPalOrder.mockReset()
  mockMarkiereAlsBezahlt.mockReset().mockResolvedValue({ ergebnis: 'neu' })
  mockVerschickeBestaetigungen.mockReset().mockResolvedValue(null)
  mockSendeNachtwacheBericht.mockReset().mockResolvedValue(undefined)
})

describe('GET /api/cron/nachtwache — Teil 4 (Vormerkungen älter als 24h)', () => {
  it('eine tatsächlich per Stripe bezahlte, aber noch "pending" Vormerkung wird NICHT als failed abgelegt, sondern nachgetragen', async () => {
    mockSpeicher.zeilen.push({
      id: 'best-card-bezahlt',
      payment_status: 'pending',
      payment_method: 'card',
      stripe_payment_intent_id: 'pi_123',
      total_price: 17,
      benachrichtigt_am: null,
      created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    })
    mockStripeRetrieve.mockResolvedValue({ status: 'succeeded', currency: 'eur', amount: 1700 })

    const res = await GET(req())
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(mockSpeicher.zeilen[0].payment_status).toBe('pending') // Update passiert über markiereAlsBezahlt (gemockt), nicht direkt
    expect(mockMarkiereAlsBezahlt).toHaveBeenCalledWith('best-card-bezahlt')
    expect(data.meldungen.some((m: string) => m.includes('war tatsächlich bezahlt'))).toBe(true)
    expect(data.meldungen.some((m: string) => m.startsWith('🚨'))).toBe(true)
    expect(mockSendeNachtwacheBericht).toHaveBeenCalled() // Alarm ausgelöst
  })

  it('eine wirklich nicht bezahlte Kartenvormerkung wird ganz normal auf failed gesetzt', async () => {
    mockSpeicher.zeilen.push({
      id: 'best-card-offen',
      payment_status: 'pending',
      payment_method: 'card',
      stripe_payment_intent_id: 'pi_456',
      total_price: 17,
      benachrichtigt_am: null,
      created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    })
    mockStripeRetrieve.mockResolvedValue({ status: 'canceled', currency: 'eur', amount: 1700 })

    const res = await GET(req())
    const data = await res.json()

    expect(mockSpeicher.zeilen[0].payment_status).toBe('failed')
    expect(mockMarkiereAlsBezahlt).not.toHaveBeenCalled()
    expect(data.meldungen.some((m: string) => m.includes('abgebrochene Zahlung'))).toBe(true)
  })

  it('eine tatsächlich per PayPal bezahlte, aber noch "pending" Vormerkung wird nachgetragen statt failed gesetzt', async () => {
    mockSpeicher.zeilen.push({
      id: 'best-paypal-bezahlt',
      payment_status: 'pending',
      payment_method: 'paypal',
      paypal_order_id: 'PAYPAL-XYZ',
      total_price: 17,
      benachrichtigt_am: null,
      created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    })
    mockVerifyPayPalOrder.mockResolvedValue(true)

    const res = await GET(req())
    const data = await res.json()

    expect(mockSpeicher.zeilen[0].payment_status).toBe('pending')
    expect(mockMarkiereAlsBezahlt).toHaveBeenCalledWith('best-paypal-bezahlt')
    expect(mockVerifyPayPalOrder).toHaveBeenCalledWith('PAYPAL-XYZ', 1700)
    expect(data.meldungen.some((m: string) => m.includes('war tatsächlich bezahlt'))).toBe(true)
  })

  it('eine wirklich nicht bezahlte PayPal-Vormerkung wird auf failed gesetzt', async () => {
    mockSpeicher.zeilen.push({
      id: 'best-paypal-offen',
      payment_status: 'pending',
      payment_method: 'paypal',
      paypal_order_id: 'PAYPAL-ABC',
      total_price: 17,
      benachrichtigt_am: null,
      created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    })
    mockVerifyPayPalOrder.mockResolvedValue(false)

    const res = await GET(req())

    expect(mockSpeicher.zeilen[0].payment_status).toBe('failed')
    expect(mockMarkiereAlsBezahlt).not.toHaveBeenCalled()
  })

  it('schlägt die Prüfung selbst fehl (z. B. Stripe nicht erreichbar), bleibt die Bestellung unangetastet', async () => {
    mockSpeicher.zeilen.push({
      id: 'best-card-unklar',
      payment_status: 'pending',
      payment_method: 'card',
      stripe_payment_intent_id: 'pi_789',
      total_price: 17,
      benachrichtigt_am: null,
      created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    })
    mockStripeRetrieve.mockRejectedValue(new Error('Stripe nicht erreichbar'))

    const res = await GET(req())
    const data = await res.json()

    expect(mockSpeicher.zeilen[0].payment_status).toBe('pending') // weder failed noch paid
    expect(mockMarkiereAlsBezahlt).not.toHaveBeenCalled()
    expect(data.meldungen.some((m: string) => m.includes('vorerst nicht angefasst'))).toBe(true)
  })

  it('eine Vormerkung ohne Zahlungs-ID wird sicher auf failed gesetzt (kann nie bezahlt worden sein)', async () => {
    mockSpeicher.zeilen.push({
      id: 'best-ohne-id',
      payment_status: 'pending',
      payment_method: 'card',
      stripe_payment_intent_id: null,
      total_price: 17,
      benachrichtigt_am: null,
      created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    })

    const res = await GET(req())

    expect(mockSpeicher.zeilen[0].payment_status).toBe('failed')
    expect(mockStripeRetrieve).not.toHaveBeenCalled()
  })
})
