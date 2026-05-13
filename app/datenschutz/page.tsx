import Navbar from '@/components/navbar'

export default function DatenschutzPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20 min-h-screen bg-cream-50">
        <section className="bg-charcoal-900 text-cream-50 py-16 px-4 sm:px-6 lg:px-12">
          <div className="container-narrow text-center">
            <p className="eyebrow text-gold-400 mb-3">Rechtliches</p>
            <h1 className="heading-serif text-5xl">Datenschutz</h1>
          </div>
        </section>

        <article className="container-narrow px-4 sm:px-6 lg:px-12 py-16 space-y-10">
          <section>
            <p className="eyebrow mb-3">Verantwortlicher</p>
            <p className="text-charcoal-700 leading-relaxed">
              Kadir Kizisar<br />
              Luma Pizza<br />
              Warzfeldener Straße 1-3, 90599 Dietenhofen
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Erhobene Daten</p>
            <p className="text-charcoal-700 leading-relaxed">
              Bei einer Bestellung erheben wir Name, E-Mail-Adresse, Telefonnummer und —
              im Falle einer Lieferung — die Lieferadresse. Diese Daten werden ausschließlich
              zur Bestellabwicklung verwendet und nicht an Dritte weitergegeben, mit Ausnahme
              unserer Zahlungsdienstleister.
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Zahlungsdienstleister</p>
            <p className="text-charcoal-700 leading-relaxed">
              Für die Zahlungsabwicklung nutzen wir Stripe (Stripe Payments Europe Ltd.) und
              PayPal (PayPal (Europe) S.à r.l. et Cie). Diese Dienste verarbeiten Zahlungs­
              daten gemäß ihren eigenen Datenschutzrichtlinien.
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Speicherdauer</p>
            <p className="text-charcoal-700 leading-relaxed">
              Bestelldaten werden für die Dauer der gesetzlichen Aufbewahrungsfristen
              (10 Jahre gem. HGB / AO) gespeichert und danach gelöscht.
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Ihre Rechte</p>
            <p className="text-charcoal-700 leading-relaxed">
              Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
              Verarbeitung und Datenübertragbarkeit. Anfragen richten Sie bitte an{' '}
              <a href="mailto:info@luma-pizza.de" className="text-gold-600 hover:underline">info@luma-pizza.de</a>.
            </p>
          </section>
        </article>
      </main>
    </>
  )
}
