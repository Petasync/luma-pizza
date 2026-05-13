'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { Order } from '@/lib/types'
import StatusButtons from '@/components/admin/status-buttons'
import Link from 'next/link'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseBrowser()

    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setOrders(data as Order[])
        setLoading(false)
      })

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev])
          try { new Audio('/notification.mp3').play() } catch {}
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === (payload.new as Order).id ? payload.new as Order : o))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) return <main className="p-8"><p className="text-gray-400">Laden...</p></main>

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Bestellungen</h1>
        <span className="text-sm text-gray-400">{orders.length} Bestellungen</span>
      </div>

      {orders.length === 0 && (
        <p className="text-gray-400 text-center py-12">Noch keine Bestellungen.</p>
      )}

      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Link href={`/admin/bestellungen/${order.id}`} className="font-bold text-primary hover:underline">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </Link>
                  <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString('de-DE')}</span>
                  <span className="text-sm font-semibold">{order.type === 'delivery' ? '🛵 Lieferung' : '🏠 Abholung'}</span>
                </div>
                <p className="text-sm text-gray-700">
                  {order.customer_name} · {order.customer_phone}
                  {order.type === 'delivery' && ` · ${order.delivery_address}, ${order.postal_code}`}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {(order.items as Order['items']).map(i => `${i.quantity}× ${i.name}`).join(', ')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="font-bold text-accent">{Number(order.total_price).toFixed(2)} €</span>
                <StatusButtons
                  orderId={order.id}
                  currentStatus={order.status}
                  onUpdate={s => setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: s } : o))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
