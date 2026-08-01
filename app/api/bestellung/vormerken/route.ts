import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { pruefePayPalVorabBetrag } from '@/lib/paypal'
import { pruefeBestellung, bestellungsZeile } from '@/lib/bestellung-pruefen'
import { PricedCart } from '@/lib/pricing'
import { CreateOrderPayload } from '@/lib/types'

/**
 * Legt die Bestellung an, BEVOR der Kunde bezahlt — für Karte (Stripe) UND
 * PayPal.
 *
 * Der Browser ruft das direkt vor dem eigentlichen Geldeinzug auf
 * (`stripe.confirmPayment()` bzw. `actions.order.capture()`). Damit ist die
 * Bestellung serverseitig vorhanden, sobald Geld fließt — Stripe-Webhook bzw.
 * `/api/bestellung/bestaetigen` müssen sie danach nur noch auf "bezahlt"
 * stellen. Selbst wenn der Kunde in genau diesem Moment den Tab schließt oder
 * das Handy den Empfang verliert, geht nichts mehr verloren.
 *
 * Gleichzeitig laufen hier ALLE Regeln (Öffnungszeiten, Liefergebiet,
 * Mindestbestellwert, Preise) — vor der Zahlung statt danach.
 */
export async function POST(req: NextRequest) {
  const body: CreateOrderPayload = await req.json()

  if (body.payment_method !== 'card' && body.payment_method !== 'paypal') {
    return NextResponse.json({ error: 'Vormerken gilt nur für Karten- oder PayPal-Zahlung.' }, { status: 400 })
  }

  const { fehler, priced } = pruefeBestellung(body)
  if (fehler || !priced) {
    return NextResponse.json({ error: fehler!.nachricht }, { status: fehler!.status })
  }

  return body.payment_method === 'card'
    ? vormerkeKartenzahlung(body, priced)
    : vormerkePayPalZahlung(body, priced)
}

async function vormerkeKartenzahlung(body: CreateOrderPayload, priced: PricedCart) {
  const intentId = body.stripe_payment_intent_id
  if (!intentId) {
    return NextResponse.json({ error: 'Zahlungsvorgang fehlt.' }, { status: 400 })
  }

  // Der Betrag des Zahlungsvorgangs muss zum neu berechneten Warenkorb passen —
  // sonst würde der Kunde einen anderen Betrag zahlen als bestellt.
  try {
    const intent = await stripe.paymentIntents.retrieve(intentId)
    if (intent.currency !== 'eur' || intent.amount !== priced.totalCents) {
      return NextResponse.json({ error: 'Betrag stimmt nicht mit dem Warenkorb überein.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Zahlungsvorgang konnte nicht geprüft werden.' }, { status: 402 })
  }

  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...bestellungsZeile(body, priced),
      payment_status: 'pending',
      stripe_payment_intent_id: intentId,
    })
    .select('id')
    .single()

  let orderId = data?.id as string | undefined

  if (error) {
    // 23505 = der eindeutige Index auf stripe_payment_intent_id hat gegriffen.
    // Das passiert, wenn der Kunde nach einer abgelehnten Karte erneut auf
    // "Jetzt bezahlen" tippt: derselbe Zahlungsvorgang, dieselbe Bestellung.
    // Kein Fehler — wir geben die vorhandene Bestellung zurück.
    if (error.code === '23505') {
      const { data: vorhanden } = await supabase
        .from('orders')
        .select('id, payment_status')
        .eq('stripe_payment_intent_id', intentId)
        .maybeSingle()
      if (vorhanden) {
        if (vorhanden.payment_status === 'paid') {
          return NextResponse.json({ error: 'Diese Zahlung wurde bereits verwendet.' }, { status: 409 })
        }
        orderId = vorhanden.id as string
      }
    }
    if (!orderId) {
      console.error('Vormerken fehlgeschlagen:', error)
      return NextResponse.json({ error: 'Bestellung konnte nicht angelegt werden.' }, { status: 500 })
    }
  }

  // Die Bestell-ID an den Zahlungsvorgang hängen. Der Webhook findet die
  // Bestellung damit auch dann, wenn er vor dem Browser eintrifft.
  try {
    await stripe.paymentIntents.update(intentId, { metadata: { order_id: orderId! } })
  } catch (e) {
    // Nicht fatal: der Webhook sucht ersatzweise über stripe_payment_intent_id.
    console.error('Metadaten am Zahlungsvorgang konnten nicht gesetzt werden:', e)
  }

  return NextResponse.json({ id: orderId }, { status: 201 })
}

async function vormerkePayPalZahlung(body: CreateOrderPayload, priced: PricedCart) {
  const paypalOrderId = body.paypal_order_id
  if (!paypalOrderId) {
    return NextResponse.json({ error: 'PayPal-Bestellung fehlt.' }, { status: 400 })
  }

  // Der Betrag der PayPal-Bestellung muss zum neu berechneten Warenkorb passen
  // — und sie darf noch nicht abgeschlossen sein (siehe pruefePayPalVorabBetrag:
  // COMPLETED wird hier bewusst abgelehnt, das darf an dieser Stelle noch nicht
  // vorgekommen sein).
  const passt = await pruefePayPalVorabBetrag(paypalOrderId, priced.totalCents)
  if (!passt) {
    return NextResponse.json({ error: 'PayPal-Zahlung konnte nicht geprüft werden.' }, { status: 402 })
  }

  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...bestellungsZeile(body, priced),
      payment_status: 'pending',
      paypal_order_id: paypalOrderId,
    })
    .select('id')
    .single()

  let orderId = data?.id as string | undefined

  if (error) {
    // 23505 = der eindeutige Index auf paypal_order_id hat gegriffen — derselbe
    // Doppel-Klick-Fall wie bei Karte. Kein Fehler, vorhandene Bestellung nutzen.
    if (error.code === '23505') {
      const { data: vorhanden } = await supabase
        .from('orders')
        .select('id, payment_status')
        .eq('paypal_order_id', paypalOrderId)
        .maybeSingle()
      if (vorhanden) {
        if (vorhanden.payment_status === 'paid') {
          return NextResponse.json({ error: 'Diese Zahlung wurde bereits verwendet.' }, { status: 409 })
        }
        orderId = vorhanden.id as string
      }
    }
    if (!orderId) {
      console.error('Vormerken (PayPal) fehlgeschlagen:', error)
      return NextResponse.json({ error: 'Bestellung konnte nicht angelegt werden.' }, { status: 500 })
    }
  }

  return NextResponse.json({ id: orderId }, { status: 201 })
}
