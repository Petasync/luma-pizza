'use client'
import { useEffect, useState } from 'react'
import { getOpeningStatus, type OpeningStatus } from '@/lib/opening-hours'

/**
 * Banner, das nur erscheint, wenn die Pizzeria gerade geschlossen ist.
 * Wird stündlich aktualisiert (Mount + alle 60 s) — siehe OpeningStatusBadge
 * für die Hydration-Begründung.
 */
export default function ClosedBanner({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState<OpeningStatus | null>(null)

  useEffect(() => {
    setStatus(getOpeningStatus())
    const id = setInterval(() => setStatus(getOpeningStatus()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!status || status.open) return null

  return (
    <div
      role="status"
      className={`bg-wine-600/10 border border-wine-600/30 text-charcoal-900 px-5 py-4 ${className}`}
    >
      <p className="text-xs uppercase tracking-widest text-wine-600 mb-1">Aktuell geschlossen</p>
      <p className="text-sm text-charcoal-800">
        Wir öffnen <span className="font-medium">{status.nextOpenLabel}</span> um{' '}
        <span className="font-medium tabular-nums">{status.nextOpenTime} Uhr</span>. Du kannst
        die Speisekarte gerne schon ansehen — Bestellungen nehmen wir ab Öffnung wieder an.
      </p>
    </div>
  )
}
