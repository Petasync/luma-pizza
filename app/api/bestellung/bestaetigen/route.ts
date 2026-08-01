import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { verifyPayPalOrder } from '@/lib/paypal'
import { markiereAlsBezahlt } from '@/lib/bezahlung'
import { Order } from '@/lib/types'

/**
 * Der schnelle Weg: Der Browser meldet direkt nach erfolgreicher Zahlung, dass
 * die Bestellung bezahlt ist — damit der Kunde sofort seine Bestätigungsseite
 * sieht und die Küche nicht auf den Webhook warten muss. Gilt für Karte UND
 * PayPal.
 *
 * Das ist bewusst nur die **Abkürzung**. Das eigentliche Sicherheitsnetz ist bei
 * Karte der Stripe-Webhook (`/api/stripe/webhook`), bei PayPal der
 * PayPal-Webhook (`/api/paypal/webhook`) bzw. ersatzweise die nächtliche
 * Nachtwache: Sie kommen auch dann an, wenn dieser Aufruf nie passiert. Alle
 * rufen dieselbe idempotente Funktion auf, es kann also weder doppelt gemailt
 * noch doppelt gebucht werden.
 */
export async function POST(req: NextRequest) {
  const { order_id } = await req.json()
  if (!order_id || typeof order_id !== 'string') {
    return NextResponse.json({ error: 'Bestell-ID fehlt.' }, { status: 400 })
  }

  const supabase = createSupabaseServer()
  const { data } = await supabase.from('orders').select('*').eq('id', order_id).maybeSingle()
  if (!data) {
    return NextResponse.json({ error: 'Bestellung nicht gefunden.' }, { status: 404 })
  }
  const order = data as Order

  if (order.payment_status === 'paid') {
    return NextResponse.json({ id: order.id }, { status: 200 })
  }

  // Niemals dem Browser glauben, dass bezahlt wurde — immer beim Zahlungsdienst
  // selbst nachfragen. Welcher das ist, richtet sich nach der Bestellung, nicht
  // nach einer Angabe im Request.
  if (order.payment_method === 'card') {
    if (!order.stripe_payment_intent_id) {
      return NextResponse.json({ error: 'Zu dieser Bestellung gehört keine Kartenzahlung.' }, { status: 400 })
    }
    try {
      const intent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
      if (
        intent.status !== 'succeeded' ||
        intent.currency !== 'eur' ||
        intent.amount !== Math.round(Number(order.total_price) * 100)
      ) {
        return NextResponse.json({ error: 'Zahlung konnte nicht verifiziert werden.' }, { status: 402 })
      }
    } catch {
      return NextResponse.json({ error: 'Zahlung konnte nicht verifiziert werden.' }, { status: 402 })
    }
  } else if (order.payment_method === 'paypal') {
    if (!order.paypal_order_id) {
      return NextResponse.json({ error: 'Zu dieser Bestellung gehört keine PayPal-Zahlung.' }, { status: 400 })
    }
    let bezahlt: boolean
    try {
      bezahlt = await verifyPayPalOrder(order.paypal_order_id, Math.round(Number(order.total_price) * 100))
    } catch {
      bezahlt = false
    }
    if (!bezahlt) {
      return NextResponse.json({ error: 'Zahlung konnte nicht verifiziert werden.' }, { status: 402 })
    }
  } else {
    return NextResponse.json({ error: 'Bestätigen gilt nur für Karten- oder PayPal-Zahlung.' }, { status: 400 })
  }

  const ergebnis = await markiereAlsBezahlt(order.id)
  if (ergebnis.ergebnis === 'nicht-gefunden') {
    return NextResponse.json({ error: 'Bestellung nicht gefunden.' }, { status: 404 })
  }
  if (ergebnis.ergebnis === 'neu' && ergebnis.mailFehler) {
    // Die Bestellung steht — nur die Mail hakt. Die Nachtwache holt sie nach.
    console.error('Bestätigungsmail fehlgeschlagen:', ergebnis.mailFehler)
  }

  return NextResponse.json({ id: order.id }, { status: 200 })
}
