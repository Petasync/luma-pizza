import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { markiereAlsBezahlt } from '@/lib/bezahlung'
import { Order } from '@/lib/types'

/**
 * Der schnelle Weg: Der Browser meldet direkt nach erfolgreicher Zahlung, dass
 * die Bestellung bezahlt ist — damit der Kunde sofort seine Bestätigungsseite
 * sieht und die Küche nicht auf den Webhook warten muss.
 *
 * Das ist bewusst nur die **Abkürzung**. Das eigentliche Sicherheitsnetz ist der
 * Stripe-Webhook (`/api/stripe/webhook`): Er kommt auch dann an, wenn dieser
 * Aufruf nie passiert. Beide rufen dieselbe idempotente Funktion auf, es kann
 * also weder doppelt gemailt noch doppelt gebucht werden.
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
  if (!order.stripe_payment_intent_id) {
    return NextResponse.json({ error: 'Zu dieser Bestellung gehört keine Kartenzahlung.' }, { status: 400 })
  }

  // Niemals dem Browser glauben, dass bezahlt wurde — immer bei Stripe nachfragen.
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
