'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Order } from '@/lib/types'
import { getPriority, minutesSince, formatMinutes } from '@/lib/order-priority'
import StatusButtons, { STATUS_LABELS } from './status-buttons'
import { formatEuro } from '@/lib/business'

interface Props {
  order: Order
  onStatusUpdate: (s: Order['status']) => void
}

const PRIORITY_STYLES = {
  normal: 'border-charcoal-900/10',
  attention: 'border-gold-500',
  urgent: 'border-wine-600',
} as const

const PRIORITY_BADGES = {
  normal: null,
  attention: { label: 'Hinweis', cls: 'bg-gold-500 text-charcoal-900' },
  urgent: { label: 'Dringend', cls: 'bg-wine-600 text-cream-50' },
} as const

export default function OrderCard({ order, onStatusUpdate }: Props) {
  // Tick every 30s so the "X min in status" updates without realtime
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const priority = getPriority(order, now)
  const timeSinceCreated = minutesSince(order.created_at, now)
  const timeInStatus = minutesSince(order.status_changed_at ?? order.created_at, now)
  const badge = PRIORITY_BADGES[priority]

  return (
    <article className={`bg-cream-50 border-l-4 ${PRIORITY_STYLES[priority]} border-y border-r border-charcoal-900/10 p-5`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <Link
              href={`/admin/bestellungen/${order.id}`}
              className="font-serif text-lg text-charcoal-900 hover:text-gold-600 transition-colors"
            >
              #{order.id.slice(0, 8).toUpperCase()}
            </Link>
            {badge && (
              <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 ${badge.cls}`}>
                {badge.label}
              </span>
            )}
            <span className="text-[10px] uppercase tracking-widest text-charcoal-500">
              {order.type === 'delivery' ? 'Lieferung' : 'Abholung'}
            </span>
          </div>
          <p className="text-sm text-charcoal-700">
            <span className="font-medium">{order.customer_name}</span>
            <span className="text-charcoal-500"> · {order.customer_phone}</span>
            {order.type === 'delivery' && (
              <span className="text-charcoal-500"> · {order.delivery_address}, {order.postal_code}</span>
            )}
          </p>
          <p className="text-xs text-charcoal-500 mt-2 line-clamp-1">
            {(order.items as Order['items']).map(i => `${i.quantity}× ${i.name}`).join(' · ')}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="font-serif text-xl text-gold-600">{formatEuro(Number(order.total_price))}</p>
          <p className="text-[10px] uppercase tracking-widest text-charcoal-500 mt-1">
            {order.payment_method} · {order.payment_status === 'paid' ? '✓' : 'offen'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-charcoal-900/10">
        <div className="flex items-center gap-4 text-[11px] text-charcoal-600">
          <span>
            <span className="text-charcoal-400">Eingang:</span>{' '}
            <span className="font-medium">vor {formatMinutes(timeSinceCreated)}</span>
          </span>
          {order.status !== 'pending' && order.status !== 'delivered' && (
            <span>
              <span className="text-charcoal-400">In {STATUS_LABELS[order.status]}:</span>{' '}
              <span className={`font-medium ${priority === 'urgent' ? 'text-wine-600' : priority === 'attention' ? 'text-gold-700' : ''}`}>
                {formatMinutes(timeInStatus)}
              </span>
            </span>
          )}
        </div>
        <StatusButtons
          orderId={order.id}
          currentStatus={order.status}
          onUpdate={onStatusUpdate}
          compact
        />
      </div>
    </article>
  )
}
