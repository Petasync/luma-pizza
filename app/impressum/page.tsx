import type { Metadata } from 'next'
import Navbar from '@/components/navbar'

export const metadata: Metadata = {
  title: 'Impressum — Luma Pizza Dietenhofen',
  description: 'Impressum von Luma Pizza in Dietenhofen: Anbieterkennzeichnung, Kontaktdaten und rechtliche Angaben gemäß § 5 DDG.',
  alternates: { canonical: '/impressum' },
}

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
              Telefon: <a href="tel:+4915124882899" className="font-medium text-gold-600 hover:underline">0151 24882899</a><br />
              E-Mail: <a href="mailto:info@luma-pizza.de" className="text-gold-600 hover:underline">info@luma-pizza.de</a>
            </p>
          </section>

          <section>
            <p className="eyebrow mb-3">Aufsichtsbehörde</p>
            <p className="text-charcoal-700 leading-relaxed">
              Landratsamt Ansbach<br />
              Crailsheimstraße 1, 91522 Ansbach
            </p>
            <p className="text-charcoal-600 text-sm mt-2">
              Zuständig für die Erlaubnis nach dem Gaststättengesetz.
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Verbraucherstreitbeilegung</p>
            <p className="text-charcoal-700 leading-relaxed text-sm">
              Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor
              einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).
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
