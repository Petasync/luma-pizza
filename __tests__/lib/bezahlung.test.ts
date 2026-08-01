/**
 * Kernstück der Absicherung: Browser und Stripe-Webhook melden dieselbe Zahlung
 * unabhängig voneinander. Genau einer von beiden darf die Bestellung auf
 * "bezahlt" setzen und die Mails auslösen — sonst bekommt Kadir jede Bestellung
 * doppelt oder (schlimmer) gar nicht.
 */

interface Zeile {
  id: string
  payment_status: string
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
  then(aufloesen: (r: { data: unknown; error: null }) => void) {
    const treffer = this.treffer()
    if (this.op === 'update') {
      treffer.forEach(z => Object.assign(z, this.patch))
      aufloesen({ data: this.gibZeilenZurueck ? treffer : null, error: null })
    } else {
      aufloesen({ data: this.einzeln ? (treffer[0] ?? null) : treffer, error: null })
    }
  }
}

jest.mock('@/lib/supabase-server', () => ({
  createSupabaseServer: () => ({ from: () => new MockAbfrage() }),
}))

const mockKundenMail = jest.fn()
const mockRestaurantMail = jest.fn()
const mockKorrekturAlarm = jest.fn()
jest.mock('@/lib/resend', () => ({
  sendOrderConfirmationToCustomer: (...a: unknown[]) => mockKundenMail(...a),
  sendNewOrderToRestaurant: (...a: unknown[]) => mockRestaurantMail(...a),
  sendeBezahlungKorrigiert: (...a: unknown[]) => mockKorrekturAlarm(...a),
}))

import { markiereAlsBezahlt } from '@/lib/bezahlung'

beforeEach(() => {
  mockSpeicher.zeilen = [
    { id: 'best-1', payment_status: 'pending', benachrichtigt_am: null, total_price: 51.5 },
  ]
  mockKundenMail.mockReset().mockResolvedValue(undefined)
  mockRestaurantMail.mockReset().mockResolvedValue(undefined)
  mockKorrekturAlarm.mockReset().mockResolvedValue(undefined)
})

describe('markiereAlsBezahlt', () => {
  it('setzt eine offene Bestellung auf bezahlt und verschickt beide Mails', async () => {
    const r = await markiereAlsBezahlt('best-1')

    expect(r.ergebnis).toBe('neu')
    expect(mockSpeicher.zeilen[0].payment_status).toBe('paid')
    expect(mockKundenMail).toHaveBeenCalledTimes(1)
    expect(mockRestaurantMail).toHaveBeenCalledTimes(1)
    expect(mockSpeicher.zeilen[0].benachrichtigt_am).not.toBeNull()
  })

  it('verschickt beim zweiten Aufruf KEINE zweite Mail', async () => {
    await markiereAlsBezahlt('best-1')
    const zweiter = await markiereAlsBezahlt('best-1')

    expect(zweiter.ergebnis).toBe('schon-bezahlt')
    expect(mockKundenMail).toHaveBeenCalledTimes(1)
    expect(mockRestaurantMail).toHaveBeenCalledTimes(1)
  })

  it('meldet eine unbekannte Bestellung als nicht gefunden', async () => {
    const r = await markiereAlsBezahlt('gibt-es-nicht')
    expect(r.ergebnis).toBe('nicht-gefunden')
    expect(mockKundenMail).not.toHaveBeenCalled()
  })

  // Eine hakende Mail darf die Zahlung nicht zurückrollen: die Bestellung muss
  // im Dashboard erscheinen. Der fehlende Stempel ist das Signal für die
  // nächtliche Nachtwache, den Versand nachzuholen.
  it('bucht trotz Mailfehler und lässt benachrichtigt_am leer', async () => {
    mockRestaurantMail.mockRejectedValue(new Error('Resend down'))

    const r = await markiereAlsBezahlt('best-1')

    expect(r.ergebnis).toBe('neu')
    expect(r.ergebnis === 'neu' && r.mailFehler).toBeTruthy()
    expect(mockSpeicher.zeilen[0].payment_status).toBe('paid')
    expect(mockSpeicher.zeilen[0].benachrichtigt_am).toBeNull()
  })

  // Review-Fund: Ein bestätigter Zahlungseingang (z. B. ein verspätet
  // eintreffender Webhook) muss eine zuvor fälschlich auf "failed" gesetzte
  // Bestellung noch korrigieren können — sonst bleibt eine tatsächlich
  // bezahlte Bestellung für immer "failed", ohne dass es je auffällt.
  describe('Korrektur einer fälschlich "failed" gesetzten Bestellung', () => {
    beforeEach(() => {
      mockSpeicher.zeilen = [
        { id: 'best-1', payment_status: 'failed', benachrichtigt_am: null, total_price: 51.5 },
      ]
    })

    it('ein bestätigter Zahlungseingang korrigiert "failed" auf "bezahlt", verschickt Mails und meldet die Korrektur', async () => {
      const r = await markiereAlsBezahlt('best-1')

      expect(r.ergebnis).toBe('korrigiert')
      expect(mockSpeicher.zeilen[0].payment_status).toBe('paid')
      expect(mockKundenMail).toHaveBeenCalledTimes(1)
      expect(mockRestaurantMail).toHaveBeenCalledTimes(1)
      // Das MUSS ausdrücklich gemeldet werden — es bedeutet, dass vorher etwas
      // schiefgelaufen ist (z. B. ein PayPal-/Stripe-API-Ausfall bei einer
      // früheren Prüfung).
      expect(mockKorrekturAlarm).toHaveBeenCalledTimes(1)
    })

    // Derselbe Webhook zweimal zugestellt (PayPal/Stripe garantieren keine
    // Einmalzustellung) darf weiterhin keine zweite Bestellung/Mail/Meldung
    // erzeugen — die Mehrfach-Absicherung muss über den Korrektur-Pfad hinweg
    // erhalten bleiben.
    it('derselbe Webhook zweimal: nur EINE Korrektur, EINE Mail, EIN Alarm — keine Bestellungsverdopplung', async () => {
      const erster = await markiereAlsBezahlt('best-1')
      const zweiter = await markiereAlsBezahlt('best-1')

      expect(erster.ergebnis).toBe('korrigiert')
      expect(zweiter.ergebnis).toBe('schon-bezahlt')
      expect(mockSpeicher.zeilen).toHaveLength(1) // keine zweite Zeile in der DB
      expect(mockSpeicher.zeilen[0].payment_status).toBe('paid')
      expect(mockKundenMail).toHaveBeenCalledTimes(1)
      expect(mockRestaurantMail).toHaveBeenCalledTimes(1)
      expect(mockKorrekturAlarm).toHaveBeenCalledTimes(1)
    })
  })
})
