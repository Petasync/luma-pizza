'use client'
import { useEffect, useRef } from 'react'
import { MENU_CATEGORIES } from '@/lib/menu'

interface Props {
  active: string
  onChange: (cat: string) => void
}

export default function CategoryTabs({ active, onChange }: Props) {
  const activeRef = useRef<HTMLButtonElement>(null)

  // Auf Mobile (horizontaler Scroll) den aktiven Tab in den sichtbaren Bereich
  // zentrieren, damit auch die rechten Rubriken gut erreichbar sind.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [active])

  return (
    <div className="relative">
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-charcoal-900/10 md:flex-wrap md:justify-center md:overflow-visible">
        {MENU_CATEGORIES.map(cat => (
          <button
            key={cat}
            ref={active === cat ? activeRef : null}
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
      {/* Fade rechts: signalisiert auf Mobile, dass horizontal weitergescrollt werden kann */}
      <div className="pointer-events-none absolute top-0 bottom-px right-0 w-12 bg-gradient-to-l from-cream-50 to-transparent md:hidden" />
    </div>
  )
}
