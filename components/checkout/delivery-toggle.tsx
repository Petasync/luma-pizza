'use client'
import { OrderType } from '@/lib/types'

interface Props {
  value: OrderType
  onChange: (v: OrderType) => void
}

export default function DeliveryToggle({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="font-bold text-gray-900 mb-3">Wie möchtest du bestellen?</h2>
      <div className="flex gap-3">
        {(['delivery', 'pickup'] as OrderType[]).map(type => (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`flex-1 py-3 rounded border text-sm font-semibold transition-colors ${
              value === type
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
            }`}
          >
            {type === 'delivery' ? '🛵 Lieferung' : '🏠 Abholung'}
          </button>
        ))}
      </div>
    </div>
  )
}
