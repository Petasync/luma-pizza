'use client'
import { useEffect, useState } from 'react'
import { getOpeningStatus, type OpeningStatus } from '@/lib/opening-hours'
import type { OrderType } from '@/lib/types'

interface Props {
  className?: string
  /** Heller Stil für dunkle Hintergründe (Navbar transparent, Footer). */
  light?: boolean
}

/**
 * Hook für die Bestell-Komponenten: liefert null bis nach dem ersten Mount
 * (vermeidet Hydration-Mismatch), danach true/false und aktualisiert minütlich.
 *
 * `type` mitgeben, wo es um eine konkrete Bestellung geht — Lieferung startet
 * sechs Stunden später als Abholung, ohne den Typ wäre die Antwort zu großzügig.
 */
export function useIsOpen(type?: OrderType): boolean | null {
  const [open, setOpen] = useState<boolean | null>(null)
  useEffect(() => {
    const update = () => setOpen(getOpeningStatus(new Date(), type).open)
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [type])
  return open
}

/**
 * Kleiner Live-Indikator: "Geöffnet bis 23:15" oder
 * "Geschlossen — öffnet Heute 17:00". Aktualisiert sich minütlich.
 *
 * Server- und Client-Rendering können um Minutengrenzen leicht differieren,
 * deshalb wird bis zum Mount nichts gerendert — vermeidet Hydration-Mismatch.
 */
export default function OpeningStatusBadge({ className = '', light = false }: Props) {
  const [status, setStatus] = useState<OpeningStatus | null>(null)

  useEffect(() => {
    setStatus(getOpeningStatus())
    const id = setInterval(() => setStatus(getOpeningStatus()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!status) {
    // Reserviert Platz, damit das Layout nicht springt.
    return <span className={`inline-block ${className}`} aria-hidden="true">&nbsp;</span>
  }

  const dotColor = status.open ? 'bg-gold-500' : 'bg-wine-600'
  const dotAnim = status.open ? 'animate-pulse' : ''
  const textColor = light ? 'text-cream-50/90' : 'text-charcoal-700'

  return (
    <span className={`inline-flex items-center gap-2 text-xs ${textColor} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${dotAnim}`} aria-hidden="true" />
      {status.open
        ? <>Geöffnet bis {status.closesAt}</>
        : <>Geschlossen — öffnet {status.nextOpenLabel} {status.nextOpenTime}</>}
    </span>
  )
}
