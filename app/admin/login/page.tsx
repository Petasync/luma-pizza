'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-8 w-full max-w-sm space-y-4">
        <h1 className="font-black text-xl text-gray-900">Admin Login</h1>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="Passwort"
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-primary text-white font-semibold py-2 rounded hover:bg-primary-dark">
          Einloggen
        </button>
      </form>
    </main>
  )
}
