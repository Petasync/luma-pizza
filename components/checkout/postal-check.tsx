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
      setError(`Wir liefern leider nicht in PLZ ${plz.trim()}. Bitte Abholung wählen.`)
      return
    }
    onConfirm(plz.trim())
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Deine Postleitzahl</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={plz}
          onChange={e => setPlz(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCheck()}
          maxLength={5}
          placeholder="z.B. 90599"
          className="border border-gray-200 rounded px-3 py-2 text-sm flex-1 focus:outline-none focus:border-primary"
        />
        <button
          onClick={handleCheck}
          className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          Prüfen
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  )
}
