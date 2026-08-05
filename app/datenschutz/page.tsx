import type { Metadata } from 'next'
import Navbar from '@/components/navbar'

export const metadata: Metadata = {
  title: 'Datenschutz — Luma Pizza Dietenhofen',
  description: 'Datenschutzerklärung von Luma Pizza in Dietenhofen: welche Daten bei einer Bestellung erhoben werden und wie sie verarbeitet werden (DSGVO).',
  alternates: { canonical: '/datenschutz' },
}

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
              Warzfeldener Straße 1-3, 90599 Dietenhofen<br />
              E-Mail: <a href="mailto:info@luma-pizza.de" className="text-gold-600 hover:underline">info@luma-pizza.de</a>
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Erhobene Daten bei Bestellungen</p>
            <p className="text-charcoal-700 leading-relaxed">
              Bei einer Bestellung erheben wir Name, E-Mail-Adresse, Telefonnummer und —
              im Falle einer Lieferung — die Lieferadresse. Diese Daten werden auf Basis
              von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) ausschließlich zur
              Bestellabwicklung verarbeitet und nicht zu Werbezwecken verwendet.
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Hosting</p>
            <p className="text-charcoal-700 leading-relaxed">
              Diese Seite wird bei Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, USA)
              gehostet. Beim Aufruf werden technisch notwendige Verbindungsdaten (IP-Adresse,
              Zeitpunkt, aufgerufene Ressource, User-Agent) in Server-Logs gespeichert.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am
              sicheren Betrieb der Website).
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Datenbank</p>
            <p className="text-charcoal-700 leading-relaxed">
              Bestelldaten werden in einer Datenbank von Supabase Inc. (970 Toa Payoh North
              #07-04, Singapur) gespeichert, mit Verarbeitung in der EU (Region Frankfurt).
              Mit Supabase besteht ein Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO.
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Zahlungsdienstleister</p>
            <p className="text-charcoal-700 leading-relaxed">
              Für Online-Zahlungen nutzen wir Stripe (Stripe Payments Europe Ltd., Dublin) und
              PayPal (PayPal (Europe) S.à r.l. et Cie, Luxemburg). Diese Anbieter verarbeiten
              Zahlungsdaten in eigener Verantwortung gemäß ihren jeweiligen Datenschutz­
              richtlinien. Wir selbst speichern keine Karten- oder Kontodaten.
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">E-Mail-Versand</p>
            <p className="text-charcoal-700 leading-relaxed">
              Bestellbestätigungen werden über Resend (Resend Inc., USA) versendet. Dabei
              wird die E-Mail-Adresse des Bestellers zum Zweck des Versands an Resend
              übermittelt. Mit Resend besteht ein Auftragsverarbeitungsvertrag mit
              EU-Standardvertragsklauseln.
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Reichweitenmessung</p>
            <p className="text-charcoal-700 leading-relaxed">
              Zur anonymen Reichweitenmessung und Performance-Analyse nutzen wir
              Vercel Web Analytics und Vercel Speed Insights. Diese Dienste arbeiten
              <strong> ohne Cookies</strong> und ohne dauerhaftes Tracking. Es werden lediglich
              aggregierte, anonymisierte Werte (besuchte Seite, Ladezeit, Browser-Typ)
              erfasst. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Kartendarstellung</p>
            <p className="text-charcoal-700 leading-relaxed">
              Auf der Startseite können Sie eine Karte von OpenStreetMap (OpenStreetMap
              Foundation, UK) einblenden. Die Karte wird <strong>erst nach einem Klick auf
              „Karte laden"</strong> geladen — vorher findet keine Verbindung zu
              OpenStreetMap statt. Mit dem Klick übermittelt Ihr Browser Ihre IP-Adresse an
              die OpenStreetMap-Server. Rechtsgrundlage ist Ihre Einwilligung
              (Art. 6 Abs. 1 lit. a DSGVO), die Sie durch das Nichtladen der Karte jederzeit
              verweigern können. Details siehe{' '}
              <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:underline">Datenschutzerklärung von OpenStreetMap</a>.
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Cookies & lokale Speicherung</p>
            <p className="text-charcoal-700 leading-relaxed">
              Wir verwenden ausschließlich technisch notwendige Funktionen: Der Warenkorb
              wird im Local Storage Ihres Browsers gehalten (verlässt Ihr Gerät nicht),
              und für den geschützten Restaurant-Bereich wird ein Session-Cookie gesetzt.
              Tracking-Cookies setzen wir nicht ein.
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Speicherdauer</p>
            <p className="text-charcoal-700 leading-relaxed">
              Bestelldaten werden für die Dauer der gesetzlichen Aufbewahrungsfristen
              (10 Jahre gem. § 147 AO / § 257 HGB) gespeichert und danach gelöscht.
            </p>
          </section>

          <section className="pt-8 border-t border-charcoal-900/10">
            <p className="eyebrow mb-3">Ihre Rechte</p>
            <p className="text-charcoal-700 leading-relaxed">
              Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
              Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
              Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf
              Grundlage berechtigter Interessen (Art. 21 DSGVO). Anfragen richten Sie
              bitte an{' '}
              <a href="mailto:info@luma-pizza.de" className="text-gold-600 hover:underline">info@luma-pizza.de</a>.
            </p>
            <p className="text-charcoal-700 leading-relaxed mt-4">
              Außerdem können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren.
              Für uns zuständig ist das Bayerische Landesamt für Datenschutzaufsicht,
              Promenade 18, 91522 Ansbach.
            </p>
          </section>
        </article>
      </main>
    </>
  )
}
