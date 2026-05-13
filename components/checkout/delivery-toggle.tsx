'use client'
import { OrderType } from '@/lib/types'

interface Props {
  value: OrderType
  onChange: (v: OrderType) => void
}

export default function DeliveryToggle({ value, onChange }: Props) {
  return (
    <div>
      <p className="eyebrow mb-3">Schritt 1</p>
      <h2 className="font-serif text-2xl text-charcoal-900 mb-5">Wie möchtest du bestellen?</h2>
      <div className="grid grid-cols-2 gap-3">
        {([
          { type: 'delivery' as const, title: 'Lieferung', desc: 'Wir kommen zu dir' },
          { type: 'pickup' as const, title: 'Abholung', desc: 'Komm vorbei' },
        ]).map(opt => (
          <button
            key={opt.type}
            onClick={() => onChange(opt.type)}
            className={`p-5 text-left border transition-all duration-200 ${
              value === opt.type
                ? 'border-charcoal-900 bg-charcoal-900 text-cream-50'
                : 'border-charcoal-900/15 bg-cream-50 text-charcoal-900 hover:border-charcoal-900/40'
            }`}
          >
            <p className="font-serif text-lg mb-1">{opt.title}</p>
            <p className={`text-xs uppercase tracking-widest ${
              value === opt.type ? 'text-gold-400' : 'text-charcoal-500'
            }`}>
              {opt.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
