import Link from 'next/link'
import Navbar from '@/components/navbar'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center px-6 py-16 max-w-md">
          <p className="font-serif text-7xl text-gold-600 mb-4">404</p>
          <p className="eyebrow mb-3">Seite nicht gefunden</p>
          <h1 className="heading-serif text-3xl text-charcoal-900 mb-4">
            Diese Seite gibt es nicht.
          </h1>
          <p className="text-charcoal-600 mb-8">
            Vielleicht ist sie noch in der Pfanne. Komm zurück zur Karte oder
            zur Startseite.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/bestellen" className="btn-primary">Zur Speisekarte</Link>
            <Link href="/" className="btn-outline-dark">Zur Startseite</Link>
          </div>
        </div>
      </main>
    </>
  )
}
