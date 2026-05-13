import { createSupabaseServer } from '@/lib/supabase-server'
import { Order } from '@/lib/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const { data, error } = await supabase.from('orders').select('*').eq('id', params.id).single()
  if (error || !data) notFound()
  const order = data as Order

  return (
    <main className="min-h-screen bg-cream-100 p-4 sm:p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <Link href="/admin" className="text-xs uppercase tracking-widest text-charcoal-600 hover:text-gold-600 transition-colors">
          ← Zurück zum Dashboard
        </Link>

        <div className="mt-6 mb-8">
          <p className="eyebrow mb-2">Bestellung</p>
          <h1 className="heading-serif text-3xl">#{order.id.slice(0, 8).toUpperCase()}</h1>
        </div>

        <div className="bg-cream-50 border border-charcoal-900/10 p-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6 pb-6 border-b border-charcoal-900/10">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-charcoal-500 mb-1">Kunde</p>
              <p className="text-charcoal-900">{order.customer_name}</p>
              <p className="text-sm text-charcoal-600">{order.customer_email}</p>
              <p className="text-sm text-charcoal-600">{order.customer_phone}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-charcoal-500 mb-1">Bestelltyp</p>
              <p className="text-charcoal-900">
                {order.type === 'delivery' ? 'Lieferung' : 'Abholung'}
              </p>
              {order.type === 'delivery' && (
                <p className="text-sm text-charcoal-600">
                  {order.delivery_address}<br />
                  {order.postal_code}
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-charcoal-500 mb-1">Zahlung</p>
              <p className="text-charcoal-900 capitalize">{order.payment_method}</p>
              <p className={`text-sm ${order.payment_status === 'paid' ? 'text-gold-600 font-medium' : 'text-charcoal-600'}`}>
                {order.payment_status === 'paid' ? '✓ Bezahlt' : 'Offen'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-charcoal-500 mb-1">Eingang</p>
              <p className="text-charcoal-900">
                {new Date(order.created_at).toLocaleString('de-DE')}
              </p>
            </div>
          </div>

          {order.notes && (
            <div className="pb-6 border-b border-charcoal-900/10">
              <p className="text-[10px] uppercase tracking-widest text-charcoal-500 mb-2">Anmerkung des Kunden</p>
              <p className="text-charcoal-800 italic">&laquo;{order.notes}&raquo;</p>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-widest text-charcoal-500 mb-4">Artikel</p>
            <div className="space-y-2">
              {(order.items as Order['items']).map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-charcoal-900/8 last:border-0">
                  <div>
                    <p className="text-charcoal-900">
                      <span className="text-gold-600">{item.quantity}×</span> {item.name}
                    </p>
                    {item.size && <p className="text-xs text-charcoal-500">{item.size}</p>}
                  </div>
                  <p className="font-serif text-charcoal-900">{(item.price * item.quantity).toFixed(2)} €</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-charcoal-900/10">
              <p className="font-serif text-lg">Gesamt</p>
              <p className="font-serif text-2xl text-gold-600">{Number(order.total_price).toFixed(2)} €</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
