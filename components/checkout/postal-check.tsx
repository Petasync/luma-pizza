'use client'
import { useState } from 'react'
import { isDeliverable } from '@/lib/postal-codes'

interface Props {
  onConfirm: (plz: string) => void
}

export default function PostalCheck({ onConfirm }: Props) {
  const [plz, setPlz] = useState('')
  const [error, setError] = useState('')

  function handleCheck() {
    setError('')
    if (!plz.trim()) { setError('Bitte PLZ eingeben.'); return }
    if (!isDeliverable(plz)) {
      setError(`Wir liefern aktuell nicht nach PLZ ${plz.trim()}. Wähle bitte Abholung.`)
      return
    }
    onConfirm(plz.trim())
  }

  return (
    <div className="mt-6 pt-6 border-t border-charcoal-900/10">
      <label className="block text-xs uppercase tracking-widest text-charcoal-600 mb-2">
        Deine Postleitzahl
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={plz}
          onChange={e => setPlz(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCheck()}
          maxLength={5}
          placeholder="z. B. 90599"
          className="border border-charcoal-900/15 bg-cream-50 px-4 py-3 text-sm flex-1 focus:outline-none focus:border-charcoal-900 transition-colors"
        />
        <button onClick={handleCheck} className="btn-primary">
          Prüfen
        </button>
      </div>
      {error && <p className="text-wine-600 text-sm mt-3">{error}</p>}
    </div>
  )
}
