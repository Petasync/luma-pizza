'use client'
import { useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { Order, OrderStatus } from '@/lib/types'
import StatsHeader from '@/components/admin/stats-header'
import RevenueChart from '@/components/admin/revenue-chart'
import OrderCard from '@/components/admin/order-card'

type Filter = 'aktiv' | 'alle' | OrderStatus

const FILTER_LABELS: Record<Filter, string> = {
  aktiv: 'Aktiv',
  alle: 'Alle',
  pending: 'Ausstehend',
  confirmed: 'Bestätigt',
  preparing: 'Zubereitung',
  ready: 'Fertig',
  delivered: 'Abgeschlossen',
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('aktiv')

  useEffect(() => {
    const supabase = createSupabaseBrowser()

    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
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

  const filteredOrders = useMemo(() => {
    if (filter === 'aktiv') return orders.filter(o => o.status !== 'delivered')
    if (filter === 'alle') return orders
    return orders.filter(o => o.status === filter)
  }, [orders, filter])

  const counts = useMemo(() => ({
    aktiv: orders.filter(o => o.status !== 'delivered').length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  }), [orders])

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-cream-100">
        <p className="text-charcoal-500 text-sm">Daten werden geladen …</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream-100 p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="eyebrow mb-2">Restaurant-Dashboard</p>
            <h1 className="heading-serif text-4xl">Bestellungen.</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-charcoal-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></span>
              Live verbunden
            </span>
          </div>
        </header>

        {/* Stats */}
        <div className="mb-8">
          <StatsHeader orders={orders} />
        </div>

        {/* Chart + active summary */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RevenueChart orders={orders} />
          </div>
          <div className="bg-charcoal-900 text-cream-50 p-6">
            <p className="text-[10px] uppercase tracking-widest text-gold-400 mb-4">Aktive Bestellungen</p>
            <div className="space-y-3">
              {([
                ['Ausstehend', counts.pending, 'bg-cream-200/20'],
                ['Bestätigt', counts.confirmed, 'bg-cream-200/20'],
                ['In Zubereitung', counts.preparing, 'bg-gold-500/25'],
                ['Fertig', counts.ready, 'bg-wine-600/30'],
              ] as const).map(([label, count, cls]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-cream-100/80">{label}</span>
                  <span className={`font-serif text-lg w-10 text-center ${cls}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 border-b border-charcoal-900/10">
          {(['aktiv', 'pending', 'confirmed', 'preparing', 'ready', 'alle'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-3 text-xs uppercase tracking-widest font-medium transition-colors relative ${
                filter === f ? 'text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-900'
              }`}
            >
              {FILTER_LABELS[f]}
              {filter === f && (
                <span className="absolute bottom-0 left-2 right-2 h-px bg-gold-500" />
              )}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {filteredOrders.length === 0 ? (
          <div className="bg-cream-50 border border-charcoal-900/10 py-16 text-center">
            <p className="text-charcoal-500 text-sm">Keine Bestellungen in dieser Ansicht.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={s => setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: s, status_changed_at: new Date().toISOString() } : o))}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
