import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import AllergenHinweis from '@/components/menu/allergen-hinweis'
import { MENU_CATEGORIES, MENU_ITEMS, menuJsonLd } from '@/lib/menu'
import { getScheduleRows } from '@/lib/opening-hours'
import { DELIVERY_ETA_MINUTES, PICKUP_ETA_MINUTES, formatEta, formatEuro, MIN_ORDER_DIETENHOFEN, MIN_ORDER_OTHER } from '@/lib/business'

/**
 * Speisekarte zum Nachlesen — vollständig, ohne Bestellvorgang.
 *
 * Die Bestellseite zeigt immer nur eine Rubrik gleichzeitig; im ausgelieferten
 * HTML steht deshalb nur die erste. Suchmaschinen sehen von den übrigen rund 60
 * Gerichten nichts, und wer nach „Bauernsalat Dietenhofen" sucht, findet die
 * Seite nicht. Hier steht alles als reiner Text — schnell geladen, vorlesbar,
 * und für Google vollständig lesbar.
 */

const BESCHREIBUNG =
  `Die komplette Speisekarte von Luma Pizza in Dietenhofen: Pizza (33 und 45 cm), Burger, ` +
  `Pasta, Schnitzel, Fisch, Salate, Nachspeisen und Getränke — mit allen Preisen.`

export const metadata: Metadata = {
  title: 'Speisekarte mit Preisen — Luma Pizza Dietenhofen',
  description: BESCHREIBUNG,
  alternates: { canonical: '/speisekarte' },
  openGraph: {
    title: 'Speisekarte mit Preisen — Luma Pizza Dietenhofen',
    description: BESCHREIBUNG,
    url: 'https://www.luma-pizza.de/speisekarte',
  },
}

const MENU_JSON_LD = JSON.stringify(menuJsonLd())

/** „10,50 €" bzw. „10,50 € / 17,00 €" bei Pizzen mit zwei Größen. */
function preisText(item: (typeof MENU_ITEMS)[number]): string {
  if (item.priceSmall !== undefined && item.priceLarge !== undefined) {
    return `${formatEuro(item.priceSmall)} · ${formatEuro(item.priceLarge)}`
  }
  return item.price !== undefined ? formatEuro(item.price) : ''
}

export default function SpeisekartePage() {
  // Rubriken, in denen gerade nichts bestellbar ist (z. B. Suppen), bekommen
  // weder eine Sprungmarke noch einen Abschnitt — sonst zeigt der Chip ins Leere.
  const rubriken = MENU_CATEGORIES.filter(cat =>
    MENU_ITEMS.some(i => i.category === cat && i.available),
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: MENU_JSON_LD }} />
      <Navbar />
      <main className="pt-20 min-h-screen bg-cream-50">
        <section className="bg-charcoal-900 text-cream-50 py-16 px-4 sm:px-6 lg:px-12">
          <div className="container-narrow text-center">
            <p className="eyebrow text-gold-400 mb-4">Zum Nachlesen</p>
            <h1 className="heading-serif text-4xl md:text-5xl">Speisekarte</h1>
            <p className="text-cream-100/70 mt-4 max-w-xl mx-auto">
              Alle Gerichte und Preise auf einen Blick. Zum Bestellen geht es{' '}
              <Link href="/bestellen" className="text-gold-400 underline underline-offset-4">
                hier entlang
              </Link>
              .
            </p>
            <p className="text-cream-100/50 text-xs mt-3">
              Alle Preise sind Endpreise. Es kommen keine weiteren Kosten hinzu.
            </p>
          </div>
        </section>

        <div className="container-narrow px-4 sm:px-6 lg:px-12 py-12">
          {/* Sprungmarken — bei 12 Rubriken auf dem Handy Gold wert */}
          <nav aria-label="Rubriken" className="flex flex-wrap gap-2 mb-10">
            {rubriken.map(cat => (
              <a
                key={cat}
                href={`#${slug(cat)}`}
                className="px-3 py-1.5 text-xs uppercase tracking-widest border border-charcoal-900/15 text-charcoal-700 hover:bg-charcoal-900 hover:text-cream-50 transition-colors"
              >
                {cat}
              </a>
            ))}
          </nav>

          {rubriken.map(cat => {
            const items = MENU_ITEMS.filter(i => i.category === cat && i.available)
            return (
              <section key={cat} id={slug(cat)} className="mb-14 scroll-mt-24">
                <h2 className="heading-serif text-3xl mb-2">{cat}</h2>
                {cat === 'Pizza' && (
                  <p className="text-sm text-charcoal-500 mb-6">
                    Preise für 33 cm · 45 cm
                  </p>
                )}
                <ul className="divide-y divide-charcoal-900/8">
                  {items.map(item => (
                    <li key={item.id} className="py-4 flex gap-6 items-baseline justify-between">
                      <div className="min-w-0">
                        <h3 className="font-medium text-charcoal-900">
                          {item.name}
                          {item.tags?.includes('vegetarisch') && (
                            <span className="ml-2 text-[10px] uppercase tracking-wider text-charcoal-500">
                              vegetarisch
                            </span>
                          )}
                          {item.tags?.includes('scharf') && (
                            <span className="ml-2 text-[10px] uppercase tracking-wider text-wine-600">
                              scharf
                            </span>
                          )}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-charcoal-600 leading-relaxed mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <p className="font-serif text-gold-600 whitespace-nowrap tabular-nums">
                        {preisText(item)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}

          <AllergenHinweis className="mb-10" />

          {/* Die Eckdaten, nach denen sonst im Impressum gesucht wird */}
          <section className="border border-charcoal-900/10 p-6 mb-10">
            <h2 className="heading-serif text-2xl mb-5">Gut zu wissen</h2>
            <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-widest text-gold-600 mb-1">Lieferung</dt>
                <dd className="text-charcoal-700">
                  Gratis im gesamten Liefergebiet, {formatEta(DELIVERY_ETA_MINUTES)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-gold-600 mb-1">Abholung</dt>
                <dd className="text-charcoal-700">
                  Täglich ab {getScheduleRows('pickup')[0].hours.split(' – ')[0]} Uhr,{' '}
                  {formatEta(PICKUP_ETA_MINUTES)}, ohne Mindestbestellwert
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-gold-600 mb-1">Mindestbestellwert</dt>
                <dd className="text-charcoal-700">
                  {formatEuro(MIN_ORDER_DIETENHOFEN)} in Dietenhofen,{' '}
                  {formatEuro(MIN_ORDER_OTHER)} in den übrigen Orten
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-gold-600 mb-1">Wir liefern</dt>
                <dd className="text-charcoal-700">
                  {getScheduleRows('delivery')[0].hours} Uhr, täglich —{' '}
                  <Link href="/liefergebiet" className="text-gold-600 hover:underline">
                    ins gesamte Liefergebiet
                  </Link>
                </dd>
              </div>
            </dl>
          </section>

          <div className="text-center">
            <Link href="/bestellen" className="btn-primary">
              Jetzt online bestellen
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

/** „Alkoholfreie Getränke" → „alkoholfreie-getraenke" (Anker für die Sprungmarken). */
function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
