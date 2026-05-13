import Navbar from '@/components/navbar'

export default function ImpressumPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-cream-50">
        <section className="bg-charcoal-900 text-cream-50 py-16 px-4 sm:px-6 lg:px-12">
          <div className="container-narrow text-center">
            <p className="eyebrow text-gold-400 mb-3">Rechtliches</p>
            <h1 className="heading-serif text-5xl">Impressum</h1>
          </div>
        </section>

        <article className="container-narrow px-4 sm:px-6 lg:px-12 py-16 space-y-10">
          <section>
            <p className="eyebrow mb-3">Anbieter</p>
            <p className="font-serif text-2xl text-charcoal-900 mb-2">Luma Pizza</p>
            <p className="text-charcoal-700 leading-relaxed">
              Warzfeldener Straße 1-3<br />
              90599 Dietenhofen<br />
              Deutschland
            </p>
          </section>

          <section>
            <p className="eyebrow mb-3">Inhaber</p>
            <p className="text-charcoal-700">Kadir Kizisar</p>
          </section>

          <section>
            <p className="eyebrow mb-3">Kontakt</p>
            <p className="text-charcoal-700">
              Telefon: <span className="font-medium">(noch eintragen)</span><br />
              E-Mail: <a href="mailto:info@luma-pizza.de" className="text-gold-600 hover:underline">info@luma-pizza.de</a>
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Haftungsausschluss</p>
            <p className="text-charcoal-700 leading-relaxed text-sm">
              Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die
              Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich
              deren Betreiber verantwortlich.
            </p>
          </section>
        </article>
      </main>
    </>
  )
}
