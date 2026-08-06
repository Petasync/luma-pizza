import { PAYPAL_AKTIV, VERFUEGBARE_ZAHLARTEN, istZahlartVerfuegbar } from '@/lib/zahlarten'
import { pruefeBestellung } from '@/lib/bestellung-pruefen'
import { CreateOrderPayload } from '@/lib/types'

// Öffnungszeiten laut lib/opening-hours.ts: täglich 15:00–24:00 Berliner Zeit.
const GEOEFFNET = new Date('2026-05-18T16:00:00+02:00')

function payload(over: Partial<CreateOrderPayload> = {}): CreateOrderPayload {
  return {
    type: 'pickup',
    customer_name: 'Test Kunde',
    customer_email: 'test@example.com',
    customer_phone: '0170 1234567',
    items: [{ menuItemId: 'pizza-margherita', name: 'x', size: '45cm', price: 0, quantity: 1 }],
    total_price: 17,
    payment_method: 'card',
    ...over,
  }
}

describe('Zahlarten', () => {
  it('lässt Karte und Barzahlung immer zu', () => {
    expect(istZahlartVerfuegbar('card')).toBe(true)
    expect(istZahlartVerfuegbar('cash')).toBe(true)
  })

  it('gibt PayPal nur frei, wenn der Schalter gesetzt ist', () => {
    expect(istZahlartVerfuegbar('paypal')).toBe(PAYPAL_AKTIV)
  })

  it('bietet im Bezahlschritt keine Zahlart an, die nicht funktioniert', () => {
    const angeboten = VERFUEGBARE_ZAHLARTEN.map(z => z.m)
    expect(angeboten).toContain('card')
    expect(angeboten).toContain('cash')
    expect(angeboten.includes('paypal')).toBe(PAYPAL_AKTIV)
  })

  it('weist eine abgeschaltete Zahlart auch serverseitig ab', () => {
    // Ohne diese Sperre könnte ein selbst gebauter Aufruf eine Bestellung mit
    // PayPal anlegen, obwohl es kein Konto gibt, auf dem Geld ankommt.
    const { fehler } = pruefeBestellung(payload({ payment_method: 'paypal' }), GEOEFFNET)
    if (PAYPAL_AKTIV) {
      expect(fehler).toBeUndefined()
    } else {
      expect(fehler?.status).toBe(400)
      expect(fehler?.nachricht).toMatch(/nicht zur Verfügung/)
    }
  })

  it('lässt eine Kartenzahlung unverändert durch', () => {
    const { fehler } = pruefeBestellung(payload(), GEOEFFNET)
    expect(fehler).toBeUndefined()
  })
})
