'use client'
import { useEffect, useState } from 'react'
import type { OrderStatus, OrderType } from '@/lib/types'

interface Props {
  orderId: string
  initialStatus: OrderStatus
  initialChangedAt: string
  orderType: OrderType
}

interface StatusResponse {
  status: OrderStatus
  status_changed_at: string
}

const ORDER: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

const LABELS: Record<OrderStatus, { delivery: string; pickup: string }> = {
  pending:   { delivery: 'Eingegangen',     pickup: 'Eingegangen' },
  confirmed: { delivery: 'Bestätigt',       pickup: 'Bestätigt' },
  preparing: { delivery: 'In Zubereitung',  pickup: 'In Zubereitung' },
  ready:     { delivery: 'Unterwegs',       pickup: 'Bereit zur Abholung' },
  delivered: { delivery: 'Geliefert',       pickup: 'Abgeholt' },
}

const POLL_MS = 8_000

/**
 * Live-Tracker auf der Bestellbestätigungsseite: pollt /api/orders/[id] alle
 * paar Sekunden und visualisiert den aktuellen Stand als Stepper. So sieht
 * der Kunde ohne F5 wann seine Pizza im Ofen ist und wann sie rausgeht.
 */
export default function OrderStatusTracker({ orderId, initialStatus, initialChangedAt, orderType }: Props) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus)
  const [changedAt, setChangedAt] = useState<string>(initialChangedAt)

  useEffect(() => {
    // Wenn die Bestellung schon abgeschlossen ist, lohnt sich kein Polling.
    if (initialStatus === 'delivered') return
    let active = true
    let id: ReturnType<typeof setInterval>

    async function load() {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' })
        if (!res.ok || !active) return
        const data = (await res.json()) as StatusResponse
        if (!active) return
        setStatus(data.status)
        setChangedAt(data.status_changed_at)
        // Endzustand erreicht — weiteres Pollen bringt nichts mehr.
        if (data.status === 'delivered') clearInterval(id)
      } catch {
        /* network glitch — nächster Tick versucht es neu */
      }
    }

    id = setInterval(load, POLL_MS)
    return () => { active = false; clearInterval(id) }
  }, [orderId, initialStatus])

  const currentIndex = ORDER.indexOf(status)
  const sinceMinutes = Math.max(0, Math.floor((Date.now() - new Date(changedAt).getTime()) / 60_000))

  return (
    <div className="bg-cream-50 border border-charcoal-900/10 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <p className="eyebrow">Live-Status</p>
        <span className="text-[10px] uppercase tracking-widest text-charcoal-500">
          aktualisiert seit {sinceMinutes} Min.
        </span>
      </div>

      <ol className="flex items-start gap-1 sm:gap-3">
        {ORDER.map((step, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          const label = LABELS[step][orderType]
          return (
            <li key={step} className="flex-1 min-w-0 flex flex-col items-center text-center">
              <div className="w-full flex items-center mb-2">
                <span className={`flex-1 h-px ${i === 0 ? 'opacity-0' : done ? 'bg-gold-500' : 'bg-charcoal-900/15'}`} />
                <span
                  className={`flex items-center justify-center w-7 h-7 text-[10px] font-medium border ${
                    done
                      ? 'bg-gold-500 text-charcoal-900 border-gold-500'
                      : active
                        ? 'bg-charcoal-900 text-cream-50 border-charcoal-900 animate-pulse'
                        : 'bg-cream-50 text-charcoal-500 border-charcoal-900/15'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className={`flex-1 h-px ${i === ORDER.length - 1 ? 'opacity-0' : done ? 'bg-gold-500' : 'bg-charcoal-900/15'}`} />
              </div>
              <span
                className={`text-[10px] sm:text-xs uppercase tracking-widest leading-tight ${
                  active ? 'text-charcoal-900 font-medium' : done ? 'text-charcoal-700' : 'text-charcoal-400'
                }`}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
