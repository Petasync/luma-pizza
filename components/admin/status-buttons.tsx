'use client'
import { useState } from 'react'
import { OrderStatus } from '@/lib/types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Ausstehend',
  confirmed: 'Bestätigt',
  preparing: 'Zubereitung',
  ready: 'Fertig',
  delivered: 'Abgeschlossen',
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-cream-200 text-charcoal-700',
  confirmed: 'bg-charcoal-700 text-cream-50',
  preparing: 'bg-gold-500 text-charcoal-900',
  ready: 'bg-wine-600 text-cream-50',
  delivered: 'bg-charcoal-900/15 text-charcoal-600',
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
  compact?: boolean
}

export default function StatusButtons({ orderId, currentStatus, onUpdate, compact = false }: Props) {
  const [loading, setLoading] = useState(false)
  // War vorher stumm: schlug die Aktualisierung fehl (z. B. abgelaufene
  // Sitzung → 401), verschwand einfach die Ladeanzeige und niemand erfuhr,
  // dass der Statuswechsel NICHT gespeichert wurde. Derselbe Fehlertyp wie
  // beim Terminal-Ausfall vom 26.07., nur beim Schreiben statt beim Lesen.
  const [fehler, setFehler] = useState(false)
  const next = NEXT_STATUS[currentStatus]

  async function advance() {
    if (!next) return
    setLoading(true)
    setFehler(false)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) onUpdate(next)
      else setFehler(true)
    } catch {
      setFehler(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap'}`}>
      <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 ${STATUS_STYLES[currentStatus]}`}>
        {STATUS_LABELS[currentStatus]}
      </span>
      {next && (
        <button
          onClick={advance}
          disabled={loading}
          className="text-[10px] uppercase tracking-widest border border-charcoal-900 text-charcoal-900 px-2.5 py-1 hover:bg-charcoal-900 hover:text-cream-50 disabled:opacity-50 transition-colors"
        >
          {loading ? '…' : `→ ${STATUS_LABELS[next]}`}
        </button>
      )}
      {fehler && (
        <span role="alert" className="text-[10px] text-wine-600 font-medium">
          Nicht gespeichert — bitte nochmal tippen.
        </span>
      )}
    </div>
  )
}

export { STATUS_LABELS, STATUS_STYLES }
