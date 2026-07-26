import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { pruefeBestellung, bestellungsZeile } from '@/lib/bestellung-pruefen'
import { CreateOrderPayload } from '@/lib/types'

/**
 * Legt die Bestellung an, BEVOR der Kunde bezahlt.
 *
 * Der Browser ruft das direkt vor `stripe.confirmPayment()` auf. Damit ist die
 * Bestellung serverseitig vorhanden, sobald Geld fließt — der Stripe-Webhook
 * muss sie danach nur noch auf "bezahlt" stellen. Selbst wenn der Kunde in
 * genau diesem Moment den Tab schließt oder das Handy den Empfang verliert,
 * geht nichts mehr verloren.
 *
 * Gleichzeitig laufen hier ALLE Regeln (Öffnungszeiten, Liefergebiet,
 * Mindestbestellwert, Preise) — vor der Zahlung statt danach.
 */
export async function POST(req: NextRequest) {
  const body: CreateOrderPayload = await req.json()

  if (body.payment_method !== 'card') {
    return NextResponse.json({ error: 'Vormerken gilt nur für Kartenzahlung.' }, { status: 400 })
  }
  const intentId = body.stripe_payment_intent_id
  if (!intentId) {
    return NextResponse.json({ error: 'Zahlungsvorgang fehlt.' }, { status: 400 })
  }

  const { fehler, priced } = pruefeBestellung(body)
  if (fehler || !priced) {
    return NextResponse.json({ error: fehler!.nachricht }, { status: fehler!.status })
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
