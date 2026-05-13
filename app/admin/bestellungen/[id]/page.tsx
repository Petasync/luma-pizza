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
    <main className="max-w-2xl mx-auto p-6">
      <Link href="/admin" className="text-primary text-sm hover:underline">← Zurück</Link>
      <h1 className="text-xl font-black mt-4 mb-6">Bestellung #{order.id.slice(0,8).toUpperCase()}</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3 text-sm">
        <div><span className="text-gray-500 w-32 inline-block">Kunde</span> {order.customer_name}</div>
        <div><span className="text-gray-500 w-32 inline-block">E-Mail</span> {order.customer_email}</div>
        <div><span className="text-gray-500 w-32 inline-block">Telefon</span> {order.customer_phone}</div>
        <div><span className="text-gray-500 w-32 inline-block">Typ</span> {order.type === 'delivery' ? `Lieferung: ${order.delivery_address}, ${order.postal_code}` : 'Abholung'}</div>
        <div><span className="text-gray-500 w-32 inline-block">Zahlung</span> {order.payment_method} / {order.payment_status}</div>
        {order.notes && <div><span className="text-gray-500 w-32 inline-block">Anmerkung</span> {order.notes}</div>}
        <div className="border-t border-gray-100 pt-3">
          {(order.items as Order['items']).map((item, i) => (
            <div key={i} className="flex justify-between">
              <span>{item.quantity}× {item.name}{item.size ? ` (${item.size})` : ''}</span>
              <span>{(item.price * item.quantity).toFixed(2)} €</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-2 border-t border-gray-100 mt-2">
            <span>Gesamt</span><span>{Number(order.total_price).toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </main>
  )
}
