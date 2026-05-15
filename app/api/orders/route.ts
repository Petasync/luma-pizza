import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sendOrderConfirmationToCustomer, sendNewOrderToRestaurant } from '@/lib/resend'
import { CreateOrderPayload, Order, PaymentStatus } from '@/lib/types'
import { priceCart, PricingError } from '@/lib/pricing'
import { stripe } from '@/lib/stripe'
import { verifyPayPalOrder } from '@/lib/paypal'
import { isDeliverable } from '@/lib/postal-codes'
import { isOpen, getOpeningStatus } from '@/lib/opening-hours'
import { MIN_ORDER_VALUE_DELIVERY } from '@/lib/business'

export async function POST(req: NextRequest) {
  const body: CreateOrderPayload = await req.json()

  // --- Öffnungszeiten: außerhalb keine Bestellungen annehmen ---
  if (!isOpen()) {
    const status = getOpeningStatus()
    const next = status.open ? '' : ` Wir öffnen ${status.nextOpenLabel} um ${status.nextOpenTime} Uhr.`
    return NextResponse.json(
      { error: `Wir nehmen aktuell keine Bestellungen entgegen.${next}` },
      { status: 503 },
    )
  }

  // --- basic field validation ---
  if (!body.customer_name || !body.customer_email || !body.customer_phone) {
    return NextResponse.json({ error: 'Kontaktdaten fehlen.' }, { status: 400 })
  }
  if (body.type === 'delivery') {
    if (!body.delivery_address || !body.postal_code) {
      return NextResponse.json({ error: 'Lieferadresse fehlt.' }, { status: 400 })
    }
    if (!isDeliverable(body.postal_code)) {
      return NextResponse.json({ error: 'Wir liefern leider nicht an diese PLZ.' }, { status: 400 })
    }
  }

  // --- authoritative pricing: the browser is not trusted, recompute everything ---
  let priced
  try {
    priced = priceCart(body.items)
  } catch (e) {
    const msg = e instanceof PricingError ? e.message : 'Warenkorb ungültig.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // --- Mindestbestellwert bei Lieferung ---
  if (body.type === 'delivery' && priced.total < MIN_ORDER_VALUE_DELIVERY) {
    return NextResponse.json(
      { error: `Mindestbestellwert für Lieferung: ${MIN_ORDER_VALUE_DELIVERY},00 €.` },
      { status: 400 },
    )
  }

  // --- payment verification: never mark an order paid on the client's word ---
  let paymentStatus: PaymentStatus
  if (body.payment_method === 'cash') {
    paymentStatus = 'pending'
  } else if (body.payment_method === 'card') {
    if (!body.stripe_payment_intent_id) {
      return NextResponse.json({ error: 'Zahlung nicht bestätigt.' }, { status: 400 })
    }
    try {
      const intent = await stripe.paymentIntents.retrieve(body.stripe_payment_intent_id)
      if (
        intent.status !== 'succeeded' ||
        intent.currency !== 'eur' ||
        intent.amount !== priced.totalCents
      ) {
        return NextResponse.json({ error: 'Zahlung konnte nicht verifiziert werden.' }, { status: 402 })
      }
    } catch {
      return NextResponse.json({ error: 'Zahlung konnte nicht verifiziert werden.' }, { status: 402 })
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

  // --- persist (prices/items come from priceCart, not the request body) ---
  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .insert({
      type: body.type,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      delivery_address: body.type === 'delivery' ? body.delivery_address : null,
      postal_code: body.type === 'delivery' ? body.postal_code : null,
      items: priced.items,
      total_price: priced.total,
      payment_method: body.payment_method,
      payment_status: paymentStatus,
      stripe_payment_intent_id: body.stripe_payment_intent_id ?? null,
      paypal_order_id: body.paypal_order_id ?? null,
      notes: body.notes ?? null,
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
  try {
    await Promise.all([
      sendOrderConfirmationToCustomer(order),
      sendNewOrderToRestaurant(order),
    ])
  } catch (emailError) {
    console.error('Email error (non-fatal):', emailError)
  }

  return NextResponse.json({ id: order.id }, { status: 201 })
}
