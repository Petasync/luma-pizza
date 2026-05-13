'use client'
import { Order } from '@/lib/types'
import { ordersToday, calcAvgPrepTime, formatMinutes } from '@/lib/order-priority'

interface Props {
  orders: Order[]
}

export default function StatsHeader({ orders }: Props) {
  const today = ordersToday(orders)
  const revenue = today.reduce((s, o) => s + Number(o.total_price), 0)
  const active = orders.filter(o => o.status !== 'delivered').length
  const avgPrep = calcAvgPrepTime(today)

  const cards = [
    {
      label: 'Bestellungen heute',
      value: today.length.toString(),
      hint: `${active} aktiv`,
    },
    {
      label: 'Umsatz heute',
      value: `${revenue.toFixed(2)} €`,
      hint: today.length > 0 ? `Ø ${(revenue / today.length).toFixed(2)} €` : 'Heute noch keine',
    },
    {
      label: 'Ø Bearbeitungszeit',
      value: avgPrep !== null ? formatMinutes(avgPrep) : '—',
      hint: 'Annahme → fertig',
    },
    {
      label: 'Aktive Bestellungen',
      value: active.toString(),
      hint: active > 0 ? 'In Bearbeitung' : 'Alles erledigt',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`p-5 ${
            i === 0 ? 'bg-charcoal-900 text-cream-50' : 'bg-cream-50 border border-charcoal-900/10'
          }`}
        >
          <p className={`text-[10px] uppercase tracking-widest mb-2 ${
            i === 0 ? 'text-gold-400' : 'text-charcoal-500'
          }`}>
            {c.label}
          </p>
          <p className={`font-serif text-3xl ${i === 0 ? 'text-cream-50' : 'text-charcoal-900'}`}>
            {c.value}
          </p>
          <p className={`text-xs mt-1 ${i === 0 ? 'text-cream-100/60' : 'text-charcoal-500'}`}>
            {c.hint}
          </p>
        </div>
      ))}
    </div>
  )
}
