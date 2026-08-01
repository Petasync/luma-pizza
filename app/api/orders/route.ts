import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { CreateOrderPayload, Order, PaymentStatus } from '@/lib/types'
import { stripe } from '@/lib/stripe'
import { verifyPayPalOrder } from '@/lib/paypal'
import { pruefeBestellung, bestellungsZeile } from '@/lib/bestellung-pruefen'
import { markiereAlsBezahlt, verschickeBestaetigungen } from '@/lib/bezahlung'

/**
 * Bestellung anlegen.
 *
 * Für **Barzahlung** und **PayPal** ist das nach wie vor der einzige Weg.
 *
 * Für **Kartenzahlung** gilt seit dem 26.07.2026 ein anderer Ablauf: die
 * Bestellung wird über `/api/bestellung/vormerken` VOR der Zahlung angelegt und
 * danach vom Stripe-Webhook auf "bezahlt" gesetzt. Diese Route bleibt für Karten
 * nur als Auffanglösung — etwa wenn ein Kunde die Seite noch in der alten
 * Fassung offen hat.
 */
export async function POST(req: NextRequest) {
  const body: CreateOrderPayload = await req.json()

  const { fehler, priced } = pruefeBestellung(body)
  if (fehler || !priced) {
    return NextResponse.json({ error: fehler!.nachricht }, { status: fehler!.status })
  }

  // --- Zahlung prüfen: niemals dem Browser glauben, dass bezahlt wurde ---
  let paymentStatus: PaymentStatus
  if (body.payment_method === 'cash') {
    paymentStatus = 'pending'
  } else if (body.payment_method === 'card') {
    if (!body.stripe_payment_intent_id) {
      return NextResponse.json({ error: 'Zahlung nicht bestätigt.' }, { status: 400 })
    }
    if (!(await zahlungIstEcht(body.stripe_payment_intent_id, priced.totalCents))) {
      return NextResponse.json({ error: 'Zahlung konnte nicht verifiziert werden.' }, { status: 402 })
    }

    // Gibt es zu diesem Zahlungsvorgang schon eine Vormerkung? Dann ist das hier
    // ein Doppel-Aufruf — die vorhandene Bestellung bestätigen statt eine zweite
    // anzulegen (der eindeutige Index würde das ohnehin ablehnen).
    const supabaseVorab = createSupabaseServer()
    const { data: vorhanden } = await supabaseVorab
      .from('orders')
      .select('id')
      .eq('stripe_payment_intent_id', body.stripe_payment_intent_id)
      .maybeSingle()

    if (vorhanden) {
      const ergebnis = await markiereAlsBezahlt(vorhanden.id as string)
      if (ergebnis.ergebnis === 'neu' && ergebnis.mailFehler) {
        console.error('Bestätigungsmail fehlgeschlagen:', ergebnis.mailFehler)
      }
      return NextResponse.json({ id: vorhanden.id }, { status: 200 })
    }

    paymentStatus = 'paid'
  } else if (body.payment_method === 'paypal') {
    let ok = false
    try {
      ok = await verifyPayPalOrder(body.paypal_order_id ?? '', priced.totalCents)
    } catch {
      ok = false
    }
    if (!ok) {
      return NextResponse.json({ error: 'PayPal-Zahlung konnte nicht verifiziert werden.' }, { status: 402 })
    }
    paymentStatus = 'paid'
  } else {
    return NextResponse.json({ error: 'Ungültige Zahlungsart.' }, { status: 400 })
  }

  // --- speichern (Preise/Artikel kommen aus priceCart, nicht aus dem Request) ---
  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .insert({
      ...bestellungsZeile(body, priced),
      payment_status: paymentStatus,
      stripe_payment_intent_id: body.stripe_payment_intent_id ?? null,
      paypal_order_id: body.paypal_order_id ?? null,
    })
    .select()
    .single()

  if (error) {
    // Unique-index violation on the payment id => the payment was already used.
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Diese Zahlung wurde bereits verwendet.' }, { status: 409 })
    }
    console.error('Supabase error:', error)
    return NextResponse.json({ error: 'Bestellung konnte nicht gespeichert werden.' }, { status: 500 })
  }

  const order = data as Order
  const mailFehler = await verschickeBestaetigungen(order)
  if (mailFehler) {
    // Nicht fatal — die Bestellung steht. Die Nachtwache holt den Versand nach.
    console.error('Bestätigungsmail fehlgeschlagen:', mailFehler)
  }

  return NextResponse.json({ id: order.id }, { status: 201 })
}

async function zahlungIstEcht(intentId: string, erwarteteCents: number): Promise<boolean> {
  try {
    const intent = await stripe.paymentIntents.retrieve(intentId)
    return intent.status === 'succeeded' && intent.currency === 'eur' && intent.amount === erwarteteCents
  } catch {
    return false
  }
}
