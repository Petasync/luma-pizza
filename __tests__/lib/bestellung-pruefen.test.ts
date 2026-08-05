import { pruefeBestellung } from '@/lib/bestellung-pruefen'
import { CreateOrderPayload } from '@/lib/types'

// Öffnungszeiten laut lib/opening-hours.ts (Berliner Zeit): Abholung täglich
// 11:00–23:00, Lieferung 17:00–23:00. 2026-05-18 ist ein Montag.
const GEOEFFNET = new Date('2026-05-18T18:00:00+02:00') // beides möglich
const GESCHLOSSEN = new Date('2026-05-18T10:00:00+02:00') // noch gar nichts
const NUR_ABHOLUNG = new Date('2026-05-18T12:00:00+02:00') // Küche offen, Lieferung nicht

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
    expect(fehler?.nachricht).toMatch(/keine Abholbestellungen/i)
  })

  // Abholung und Lieferung haben getrennte Fenster. Vor 17:00 darf eine
  // Lieferung nicht durchgehen, obwohl die Küche längst offen ist — und
  // umgekehrt darf die Abholung dann nicht mit abgewiesen werden.
  it('lehnt mittags eine Lieferung ab, lässt die Abholung aber zu', () => {
    const lieferung = pruefeBestellung(
      payload({ type: 'delivery', delivery_address: 'Teststr. 1', postal_code: '90599' }),
      NUR_ABHOLUNG,
    )
    expect(lieferung.fehler?.status).toBe(503)
    expect(lieferung.fehler?.nachricht).toMatch(/liefern gerade nicht/i)
    // Der Kunde soll erfahren, dass Abholen schon geht.
    expect(lieferung.fehler?.nachricht).toMatch(/Abholen kannst du jetzt schon/i)

    const abholung = pruefeBestellung(payload(), NUR_ABHOLUNG)
    expect(abholung.fehler).toBeUndefined()
  })

  // PayPal ist seit 05.08.2026 abgeschaltet (business.ts PAYPAL_AKTIV). Der
  // Knopf ist an der Kasse weg — die Ablehnung muss aber serverseitig greifen.
  it('lehnt eine PayPal-Bestellung ab, solange PayPal abgeschaltet ist', () => {
    const { fehler } = pruefeBestellung(payload({ payment_method: 'paypal' }), GEOEFFNET)
    expect(fehler?.status).toBe(400)
    expect(fehler?.nachricht).toMatch(/PayPal/i)
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
