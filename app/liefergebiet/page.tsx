import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import { DELIVERY_AREAS } from '@/lib/postal-codes'
import { getScheduleRows } from '@/lib/opening-hours'
import {
  DELIVERY_ETA_MINUTES,
  PICKUP_ETA_MINUTES,
  formatEta,
  formatEuro,
  MIN_ORDER_DIETENHOFEN,
  MIN_ORDER_OTHER,
} from '@/lib/business'

/**
 * Liefergebiet + häufige Fragen.
 *
 * Wer Pizza bestellt, sucht fast immer mit Ortsnamen („Pizza Lieferservice
 * Heilsbronn"). Bisher stand kein einziger der 13 Lieferorte im Text der Seite —
 * für diese Suchen war Luma damit unsichtbar. Bewusst EINE Seite mit allen
 * Orten statt 13 fast identischer Ortsseiten: dünne, austauschbare Seiten
 * bewertet Google als Brückenseiten ab.
 *
 * Die Fragen unten sind zusätzlich als FAQ-Daten ausgezeichnet — das ist das
 * Format, aus dem Google und KI-Assistenten direkt zitieren.
 */

const ORTE_TEXT = DELIVERY_AREAS.map(a => a.name).join(', ')

const BESCHREIBUNG =
  `Luma Pizza liefert gratis nach ${DELIVERY_AREAS.slice(0, 6).map(a => a.name).join(', ')} ` +
  `und in weitere Orte rund um Dietenhofen. Lieferzeit ${formatEta(DELIVERY_ETA_MINUTES)}, täglich ab 15 Uhr.`

export const metadata: Metadata = {
  title: 'Liefergebiet & häufige Fragen — Luma Pizza Dietenhofen',
  description: BESCHREIBUNG,
  alternates: { canonical: '/liefergebiet' },
  openGraph: {
    title: 'Liefergebiet — Luma Pizza Dietenhofen',
    description: BESCHREIBUNG,
    url: 'https://www.luma-pizza.de/liefergebiet',
  },
}

const FAQ: { frage: string; antwort: string }[] = [
  {
    frage: 'In welche Orte liefert Luma Pizza?',
    antwort: `Wir liefern nach ${ORTE_TEXT}. Ob deine Adresse dabei ist, prüft der Bestellvorgang automatisch anhand deiner Postleitzahl.`,
  },
  {
    frage: 'Was kostet die Lieferung?',
    antwort: 'Nichts. Die Lieferung ist im gesamten Liefergebiet kostenlos — unabhängig von der Entfernung.',
  },
  {
    frage: 'Wie hoch ist der Mindestbestellwert?',
    antwort: `In Dietenhofen ${formatEuro(MIN_ORDER_DIETENHOFEN)}, in allen übrigen Orten ${formatEuro(MIN_ORDER_OTHER)}. Bei Abholung gibt es keinen Mindestbestellwert.`,
  },
  {
    frage: 'Wie lange dauert die Lieferung?',
    antwort: `In der Regel ${formatEta(DELIVERY_ETA_MINUTES)} ab Bestelleingang. Zur Abholung ist dein Essen nach ${formatEta(PICKUP_ETA_MINUTES)} fertig.`,
  },
  {
    frage: 'Wann habt ihr geöffnet? Gibt es einen Ruhetag?',
    antwort: `Wir liefern täglich von ${getScheduleRows('delivery')[0].hours} Uhr — auch sonntags. Einen Ruhetag gibt es nicht. Abholen kannst du schon ab ${getScheduleRows('pickup')[0].hours.split(' – ')[0]} Uhr.`,
  },
  {
    frage: 'Wie kann ich bezahlen?',
    antwort: 'Online per Kreditkarte oder PayPal — oder bar bei der Lieferung beziehungsweise bei der Abholung.',
  },
  {
    frage: 'Kann ich auch telefonisch bestellen?',
    antwort: 'Ja, unter 0151 24882899. Online geht es meist schneller, weil die Bestellung direkt in der Küche landet.',
  },
  {
    frage: 'Ich habe eine Allergie — an wen wende ich mich?',
    antwort: 'Ruf uns bitte vor der Bestellung kurz an (0151 24882899). Wir sagen dir genau, was in jedem Gericht steckt.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(f => ({
    '@type': 'Question',
    name: f.frage,
    acceptedAnswer: { '@type': 'Answer', text: f.antwort },
  })),
}

export default function LiefergebietPage() {
  const orte = [...DELIVERY_AREAS].sort((a, b) => a.name.localeCompare(b.name, 'de'))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <main className="pt-20 min-h-screen bg-cream-50">
        <section className="bg-charcoal-900 text-cream-50 py-16 px-4 sm:px-6 lg:px-12">
          <div className="container-narrow text-center">
            <p className="eyebrow text-gold-400 mb-4">Liefergebiet</p>
            <h1 className="heading-serif text-4xl md:text-5xl">
              Wir liefern rund um Dietenhofen
            </h1>
            <p className="text-cream-100/70 mt-4 max-w-xl mx-auto">
              In {DELIVERY_AREAS.length} Orte — gratis, täglich ab 15 Uhr, in der Regel
              innerhalb von {formatEta(DELIVERY_ETA_MINUTES)}.
            </p>
          </div>
        </section>

        <div className="container-narrow px-4 sm:px-6 lg:px-12 py-12">
          <section className="mb-14">
            <h2 className="heading-serif text-3xl mb-6">Diese Orte beliefern wir</h2>
            <ul className="grid sm:grid-cols-2 gap-x-10 divide-y divide-charcoal-900/8 sm:divide-y-0">
              {orte.map(ort => (
                <li
                  key={ort.postalCode}
                  className="py-3 flex items-baseline justify-between gap-4 sm:border-b sm:border-charcoal-900/8"
                >
                  <span className="text-charcoal-900">{ort.name}</span>
                  <span className="text-sm text-charcoal-500 tabular-nums whitespace-nowrap">
                    {ort.postalCode} · ab{' '}
                    {formatEuro(
                      ort.postalCode === '90599' ? MIN_ORDER_DIETENHOFEN : MIN_ORDER_OTHER,
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-charcoal-600 mt-6 leading-relaxed">
              Deine Postleitzahl ist nicht dabei? Ruf uns an —{' '}
              <a href="tel:+4915124882899" className="text-gold-600 hover:underline">
                0151 24882899
              </a>
              . Für Abholer gibt es keine Grenze und keinen Mindestbestellwert.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="heading-serif text-3xl mb-6">Häufige Fragen</h2>
            <div className="divide-y divide-charcoal-900/8">
              {FAQ.map(f => (
                <div key={f.frage} className="py-5">
                  <h3 className="font-medium text-charcoal-900 mb-2">{f.frage}</h3>
                  <p className="text-charcoal-700 leading-relaxed">{f.antwort}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-charcoal-900 text-cream-50 p-8 sm:p-10 text-center">
            <h2 className="heading-serif text-3xl mb-4">Hunger?</h2>
            <p className="text-cream-100/80 mb-8 max-w-md mx-auto leading-relaxed">
              Über 60 Gerichte, frisch zubereitet. Erst die{' '}
              <Link href="/speisekarte" className="text-gold-400 underline underline-offset-4">
                Speisekarte ansehen
              </Link>{' '}
              oder direkt loslegen.
            </p>
            <Link href="/bestellen" className="btn-gold">
              Jetzt bestellen
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
