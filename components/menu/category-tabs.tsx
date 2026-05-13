'use client'
import { MENU_CATEGORIES } from '@/lib/menu'

interface Props {
  active: string
  onChange: (cat: string) => void
}

export default function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-charcoal-900/10">
      {MENU_CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`flex-shrink-0 px-5 py-4 text-xs uppercase tracking-widest font-medium transition-colors relative ${
            active === cat
              ? 'text-charcoal-900'
              : 'text-charcoal-500 hover:text-charcoal-900'
          }`}
        >
          {cat}
          {active === cat && (
            <span className="absolute bottom-0 left-3 right-3 h-px bg-gold-500" />
          )}
        </button>
      ))}
    </div>
  )
}
