import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sendOrderConfirmationToCustomer, sendNewOrderToRestaurant } from '@/lib/resend'
import { CreateOrderPayload, Order } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body: CreateOrderPayload = await req.json()

  if (!body.customer_name || !body.customer_email || !body.customer_phone) {
    return NextResponse.json({ error: 'Kontaktdaten fehlen.' }, { status: 400 })
  }
  if (!body.items || body.items.length === 0) {
    return NextResponse.json({ error: 'Warenkorb ist leer.' }, { status: 400 })
  }
  if (body.type === 'delivery' && (!body.delivery_address || !body.postal_code)) {
    return NextResponse.json({ error: 'Lieferadresse fehlt.' }, { status: 400 })
  }

  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .insert({
      type: body.type,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      delivery_address: body.delivery_address ?? null,
      postal_code: body.postal_code ?? null,
      items: body.items,
      total_price: body.total_price,
      payment_method: body.payment_method,
      payment_status: body.payment_method === 'cash' ? 'pending' : 'paid',
      stripe_payment_intent_id: body.stripe_payment_intent_id ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (error) {
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
