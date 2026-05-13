'use client'
import { useState } from 'react'
import { OrderStatus } from '@/lib/types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ausstehend',
  confirmed: 'Bestätigt',
  preparing: 'In Zubereitung',
  ready: 'Fertig',
  delivered: 'Geliefert/Abgeholt',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-600',
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
}

interface Props {
  orderId: string
  currentStatus: OrderStatus
  onUpdate: (s: OrderStatus) => void
}

export default function StatusButtons({ orderId, currentStatus, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)
  const next = NEXT_STATUS[currentStatus]

  async function advance() {
    if (!next) return
    setLoading(true)
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    onUpdate(next)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-semibold px-2 py-1 rounded ${STATUS_COLORS[currentStatus]}`}>
        {STATUS_LABELS[currentStatus]}
      </span>
      {next && (
        <button
          onClick={advance}
          disabled={loading}
          className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : `→ ${STATUS_LABELS[next]}`}
        </button>
      )}
    </div>
  )
}
