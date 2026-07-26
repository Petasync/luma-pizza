import { pruefeBestellung } from '@/lib/bestellung-pruefen'
import { CreateOrderPayload } from '@/lib/types'

// Öffnungszeiten laut lib/opening-hours.ts: täglich 15:00–24:00 Berliner Zeit.
// 2026-05-18 ist ein Montag.
const GEOEFFNET = new Date('2026-05-18T16:00:00+02:00')
const GESCHLOSSEN = new Date('2026-05-18T11:00:00+02:00')

// pizza-margherita: 33 cm = 10,50 € / 45 cm = 17,00 €
function payload(over: Partial<CreateOrderPayload> = {}): CreateOrderPayload {
  return {
    type: 'pickup',
    customer_name: 'Kadir Test',
    customer_email: 'kadir@example.com',
    customer_phone: '0170 1234567',
    items: [{ menuItemId: 'pizza-margherita', name: 'x', size: '45cm', price: 0, quantity: 1 }],
    total_price: 17,
    payment_method: 'card',
    ...over,
  }
}

describe('pruefeBestellung', () => {
  it('lässt eine gültige Abholbestellung während der Öffnungszeit durch', () => {
    const { fehler, priced } = pruefeBestellung(payload(), GEOEFFNET)
    expect(fehler).toBeUndefined()
    expect(priced?.totalCents).toBe(1700)
  })

  // Der Kern des Vorfalls vom 26.07.2026: Diese Prüfung lief früher erst NACH
  // der Stripe-Zahlung. Sie muss vorher greifen — sonst ist das Geld weg und die
  // Bestellung abgelehnt.
  it('lehnt außerhalb der Öffnungszeiten mit 503 ab', () => {
    const { fehler } = pruefeBestellung(payload(), GESCHLOSSEN)
    expect(fehler?.status).toBe(503)
    expect(fehler?.nachricht).toMatch(/keine Bestellungen/i)
  })

  it('verlangt vollständige Kontaktdaten', () => {
    const { fehler } = pruefeBestellung(payload({ customer_phone: '' }), GEOEFFNET)
    expect(fehler?.status).toBe(400)
  })

  it('verlangt eine Lieferadresse bei Lieferung', () => {
    const { fehler } = pruefeBestellung(payload({ type: 'delivery' }), GEOEFFNET)
    expect(fehler?.status).toBe(400)
    expect(fehler?.nachricht).toMatch(/Lieferadresse/i)
  })

  it('lehnt eine PLZ außerhalb des Liefergebiets ab', () => {
    const { fehler } = pruefeBestellung(
      payload({ type: 'delivery', delivery_address: 'Teststr. 1', postal_code: '10115' }),
      GEOEFFNET,
    )
    expect(fehler?.status).toBe(400)
    expect(fehler?.nachricht).toMatch(/liefern leider nicht/i)
  })

  // Dietenhofen (90599) hat 15 € Mindestbestellwert, alle anderen Orte 30 €.
  it('setzt den ortsabhängigen Mindestbestellwert durch', () => {
    const zuKlein = pruefeBestellung(
      payload({
        type: 'delivery',
        delivery_address: 'Teststr. 1',
        postal_code: '90599',
        items: [{ menuItemId: 'pizza-margherita', name: 'x', size: '33cm', price: 0, quantity: 1 }],
      }),
      GEOEFFNET,
    )
    expect(zuKlein.fehler?.status).toBe(400)
    expect(zuKlein.fehler?.nachricht).toMatch(/Mindestbestellwert/i)

    const groß = pruefeBestellung(
      payload({
        type: 'delivery',
        delivery_address: 'Teststr. 1',
        postal_code: '90599',
        items: [{ menuItemId: 'pizza-margherita', name: 'x', size: '45cm', price: 0, quantity: 1 }],
      }),
      GEOEFFNET,
    )
    expect(groß.fehler).toBeUndefined()
  })

  it('rechnet die Preise selbst und ignoriert die Angaben des Browsers', () => {
    const { priced } = pruefeBestellung(
      payload({
        total_price: 0.01,
        items: [{ menuItemId: 'pizza-margherita', name: 'Gratis', size: '45cm', price: 0.01, quantity: 2 }],
      }),
      GEOEFFNET,
    )
    expect(priced?.totalCents).toBe(3400)
  })

  it('lehnt einen unbekannten Artikel ab', () => {
    const { fehler } = pruefeBestellung(
      payload({ items: [{ menuItemId: 'gibt-es-nicht', name: 'x', size: null, price: 1, quantity: 1 }] }),
      GEOEFFNET,
    )
    expect(fehler?.status).toBe(400)
  })
})
