'use client'
import { Order } from '@/lib/types'
import { ordersToday, revenueByHour } from '@/lib/order-priority'
import { formatEuro } from '@/lib/business'

interface Props {
  orders: Order[]
}

export default function RevenueChart({ orders }: Props) {
  const data = revenueByHour(ordersToday(orders))
  const max = Math.max(1, ...data.map(d => d.total))
  // Display only relevant hours (10:00 to 23:00)
  const visible = data.filter(d => d.hour >= 10 && d.hour <= 23)
  const total = visible.reduce((s, d) => s + d.total, 0)
  const nowHour = new Date().getHours()

  return (
    <div className="bg-cream-50 border border-charcoal-900/10 p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-charcoal-500 mb-1">
            Umsatz heute · stündlich
          </p>
          <p className="font-serif text-2xl text-charcoal-900">{formatEuro(total)}</p>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gold-600">
          Live
        </p>
      </div>

      <div className="flex items-end gap-1 h-32 mb-2">
        {visible.map(d => {
          const heightPct = (d.total / max) * 100
          const isPast = d.hour < nowHour
          const isNow = d.hour === nowHour
          return (
            <div key={d.hour} className="flex-1 flex flex-col justify-end items-center gap-1 group relative">
              {d.total > 0 && (
                <span className="absolute -top-5 text-[9px] text-charcoal-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {d.total.toFixed(0)} €
                </span>
              )}
              <div
                style={{ height: `${Math.max(heightPct, d.total > 0 ? 8 : 2)}%` }}
                className={`w-full transition-all ${
                  isNow
                    ? 'bg-gold-500'
                    : isPast && d.total > 0
                    ? 'bg-charcoal-900'
                    : 'bg-charcoal-900/15'
                }`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[9px] text-charcoal-500 uppercase tracking-widest">
        <span>10</span>
        <span>13</span>
        <span>16</span>
        <span>19</span>
        <span>22</span>
      </div>
    </div>
  )
}
