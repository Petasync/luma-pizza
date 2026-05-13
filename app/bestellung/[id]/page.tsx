import { createSupabaseServer } from '@/lib/supabase-server'
import { Order } from '@/lib/types'
import Navbar from '@/components/navbar'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  const order = data as Order

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Bestellung erhalten!</h1>
          <p className="text-gray-500 mb-6">
            Wir haben dir eine Bestätigung an <strong>{order.customer_email}</strong> geschickt.
          </p>

          <div className="bg-gray-50 rounded p-4 text-left text-sm space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Bestellung</span>
              <span className="font-mono font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Art</span>
              <span>{order.type === 'delivery' ? `Lieferung an ${order.delivery_address}` : 'Abholung'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Zahlung</span>
              <span className={order.payment_status === 'paid' ? 'text-green-600 font-semibold' : ''}>
                {order.payment_status === 'paid' ? '✓ Bezahlt' : 'Bar bei Lieferung/Abholung'}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              {(order.items as Order['items']).map((item, i) => (
                <div key={i} className="flex justify-between text-gray-600">
                  <span>{item.quantity}× {item.name}{item.size ? ` (${item.size})` : ''}</span>
                  <span>{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
                <span>Gesamt</span><span>{Number(order.total_price).toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <Link href="/bestellen" className="bg-primary text-white font-semibold px-6 py-3 rounded hover:bg-primary-dark transition-colors inline-block">
            Weitere Bestellung aufgeben
          </Link>
        </div>
      </main>
    </>
  )
}
