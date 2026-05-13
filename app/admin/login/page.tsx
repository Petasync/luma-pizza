'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError('Falsches Passwort.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-charcoal-900 p-6">
      <form onSubmit={handleSubmit} className="bg-cream-50 p-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 border border-gold-500 text-gold-600 flex items-center justify-center font-serif text-xl">
            L
          </div>
          <p className="eyebrow mb-2">Restaurant-Bereich</p>
          <h1 className="font-serif text-2xl">Anmeldung</h1>
        </div>
        <label className="block text-xs uppercase tracking-widest text-charcoal-600 mb-2">
          Passwort
        </label>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="••••••••"
          className="w-full border border-charcoal-900/15 bg-cream-50 px-4 py-3 text-sm focus:outline-none focus:border-charcoal-900 transition-colors mb-3"
        />
        {error && <p className="text-wine-600 text-sm mb-3">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? 'Wird geprüft …' : 'Einloggen'}
        </button>
      </form>
    </main>
  )
}
