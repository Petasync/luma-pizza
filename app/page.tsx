import Link from 'next/link'
import Navbar from '@/components/navbar'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary to-violet-800 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-violet-300 text-sm font-semibold uppercase tracking-widest mb-4">
              Luma Pizza · Dietenhofen
            </p>
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              Frisch. Lecker.<br />
              <span className="text-accent">Direkt zu dir.</span>
            </h1>
            <p className="text-violet-200 text-lg mb-8 max-w-xl mx-auto">
              Pizza, Burger, Pasta & mehr — jetzt direkt online bestellen und bezahlen. Keine Liefergebühr.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/bestellen"
                className="bg-accent text-white font-bold px-8 py-4 rounded hover:bg-accent-dark transition-colors text-lg"
              >
                Jetzt bestellen
              </Link>
              <Link
                href="/bestellen"
                className="border border-violet-400 text-white font-semibold px-8 py-4 rounded hover:bg-white/10 transition-colors"
              >
                Speisekarte ansehen
              </Link>
            </div>
          </div>
        </section>

        {/* Info Strip */}
        <section className="bg-white border-b border-gray-200 py-6 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-black text-accent">4.7 ⭐</p>
              <p className="text-sm text-gray-500 mt-1">Bewertung</p>
            </div>
            <div>
              <p className="text-2xl font-black text-accent">0 €</p>
              <p className="text-sm text-gray-500 mt-1">Liefergebühr</p>
            </div>
            <div>
              <p className="text-2xl font-black text-accent">~30 min</p>
              <p className="text-sm text-gray-500 mt-1">Lieferzeit</p>
            </div>
            <div>
              <p className="text-2xl font-black text-accent">60+</p>
              <p className="text-sm text-gray-500 mt-1">Gerichte</p>
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="bg-gray-50 py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wo wir sind</h2>
            <p className="text-gray-600">Warzfeldener Straße 1-3 · 90599 Dietenhofen</p>
            <p className="text-gray-500 text-sm mt-1">
              Öffnungszeiten: bitte beim Restaurant erfragen
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
