'use client'
import { MENU_CATEGORIES } from '@/lib/menu'

interface Props {
  active: string
  onChange: (cat: string) => void
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Pizza': '🍕',
  'Burger': '🍔',
  'Pasta': '🍝',
  'Fisch Gerichte': '🐟',
  'Schnitzel Gerichte': '🍖',
  'Snacks': '🍗',
  'Beilagen': '🍟',
  'Salate': '🥗',
  'Nachspeisen': '🍰',
  'Alkoholische Getränke': '🍺',
  'Alkoholfreie Getränke': '🥤',
}

export default function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {MENU_CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-colors ${
            active === cat
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary'
          }`}
        >
          <span>{CATEGORY_EMOJIS[cat] ?? '•'}</span>
          <span>{cat}</span>
        </button>
      ))}
    </div>
  )
}
