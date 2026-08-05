import { createSupabaseServer } from '@/lib/supabase-server'
import { Order } from '@/lib/types'
import Navbar from '@/components/navbar'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DELIVERY_ETA_MINUTES, PICKUP_ETA_MINUTES, formatEta, formatEuro } from '@/lib/business'
import OrderStatusTracker from '@/components/order-status-tracker'

export default async function OrderConfirmationPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()
  const order = data as Order
  const eta = formatEta(order.type === 'delivery' ? DELIVERY_ETA_MINUTES : PICKUP_ETA_MINUTES)
  const etaLabel = order.type === 'delivery' ? 'Voraussichtliche Lieferzeit' : 'Voraussichtlich bereit in'

  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-cream-100">
        <section className="bg-charcoal-900 text-cream-50 py-16 px-4 sm:px-6 lg:px-12">
          <div className="container-narrow text-center">
            <p className="eyebrow text-gold-400 mb-4">Bestellbestätigung</p>
            <h1 className="heading-serif text-5xl mb-3">
              Vielen Dank, <span className="italic text-gold-400">{order.customer_name.split(' ')[0]}!</span>
            </h1>
            <p className="text-cream-100/75 max-w-md mx-auto">
              Deine Bestellung ist eingegangen — wir starten direkt mit der Zubereitung.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 px-5 py-3 border border-gold-400/40 bg-charcoal-800">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" aria-hidden="true" />
              <span className="text-xs uppercase tracking-widest text-gold-400">{etaLabel}</span>
              <span className="text-cream-50 font-medium tabular-nums">{eta}</span>
            </div>
          </div>
        </section>

        <div className="container-narrow px-4 sm:px-6 lg:px-12 py-12 space-y-6">
          <OrderStatusTracker
            orderId={order.id}
            initialStatus={order.status}
            initialChangedAt={order.status_changed_at ?? order.created_at}
            orderType={order.type}
          />
          <div className="bg-cream-50 border border-charcoal-900/10 p-8 md:p-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-charcoal-900/10 mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-charcoal-500 mb-1">Bestellnummer</p>
                <p className="font-serif text-2xl text-charcoal-900">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs uppercase tracking-widest text-charcoal-500 mb-1">Zahlungsstatus</p>
                <p className={`font-medium ${order.payment_status === 'paid' ? 'text-gold-600' : 'text-charcoal-700'}`}>
                  {order.payment_status === 'paid' ? '✓ Bezahlt' : 'Bar bei Lieferung/Abholung'}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pb-6 border-b border-charcoal-900/10 mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-charcoal-500 mb-1">Art</p>
                <p className="text-charcoal-900">
                  {order.type === 'delivery' ? `Lieferung an ${order.delivery_address}, ${order.postal_code}` : 'Abholung im Restaurant'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-charcoal-500 mb-1">Bestätigung an</p>
                <p className="text-charcoal-900">{order.customer_email}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="eyebrow">Bestellte Artikel</p>
              {(order.items as Order['items']).map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-charcoal-900/8 last:border-0">
                  <div>
                    <p className="text-charcoal-900">
                      <span className="text-gold-600">{item.quantity}×</span> {item.name}
                    </p>
                    {item.size && <p className="text-xs text-charcoal-500">{item.size}</p>}
                  </div>
                  <p className="font-serif text-charcoal-900">
                    {formatEuro(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-charcoal-900/10">
              <p className="font-serif text-xl">Gesamt</p>
              <p className="font-serif text-2xl text-gold-600">{formatEuro(Number(order.total_price))}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/bestellen" className="btn-primary">
              Weitere Bestellung
            </Link>
            <Link href="/" className="btn-outline-dark">
              Zur Startseite
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
