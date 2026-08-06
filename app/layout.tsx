import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { CartProvider } from '@/components/cart/cart-context'
import MobileCart from '@/components/cart/mobile-cart'
import Footer from '@/components/footer'
import { getOpeningHoursSchema } from '@/lib/opening-hours'
import { DELIVERY_AREAS } from '@/lib/postal-codes'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.luma-pizza.de'),
  title: 'Luma Pizza Dietenhofen — Authentisch italienisch, frisch zubereitet',
  description: 'Luma Pizza in Dietenhofen. Hausgemachte Pizza, Burger, Pasta und mehr. Direkt online bestellen, abholen oder liefern lassen.',
  keywords: ['Pizza Dietenhofen', 'Pizza bestellen', 'Pizza Lieferservice', 'Pizzeria Dietenhofen', 'Luma Pizza', 'Pizza liefern lassen'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Luma Pizza',
    title: 'Luma Pizza Dietenhofen — Authentisch italienisch, frisch zubereitet',
    description: 'Hausgemachte Pizza, Burger und Pasta aus Dietenhofen. Jetzt online bestellen — zum Abholen oder Liefern.',
    url: 'https://www.luma-pizza.de',
  },
}

export const viewport: Viewport = {
  themeColor: '#1A1612',
}

// LocalBusiness structured data — helps Luma Pizza appear in Google's local
// results / maps. Öffnungszeiten kommen aus lib/opening-hours.ts (dieselbe
// Quelle wie die sichtbare Tabelle im Kontaktbereich), die Koordinaten aus dem
// OSM-Embed auf der Startseite (app/page.tsx) — beides bereits an anderer
// Stelle im Code verifiziert, hier nur wiederverwendet statt neu erfunden.
const restaurantJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Luma Pizza',
  servesCuisine: ['Pizza', 'Italienisch', 'Burger'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Warzfeldener Straße 1-3',
    postalCode: '90599',
    addressLocality: 'Dietenhofen',
    addressCountry: 'DE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 49.3970650,
    longitude: 10.6887029,
  },
  openingHoursSpecification: getOpeningHoursSchema(),
  url: 'https://www.luma-pizza.de',
  email: 'info@luma-pizza.de',
  telephone: '+4915124882899',
  // Ohne Bild zeigt Google den Eintrag in den lokalen Ergebnissen ohne Vorschau.
  image: 'https://www.luma-pizza.de/opengraph-image.png',
  // Preisniveau: Hauptgerichte zwischen 10 und 21 € → zweistufig.
  priceRange: '€€',
  hasMenu: 'https://www.luma-pizza.de/speisekarte',
  // PayPal fehlt hier bewusst — siehe lib/zahlarten.ts.
  paymentAccepted: 'Bargeld, Kreditkarte',
  currenciesAccepted: 'EUR',
  // Die Orte, in die wir liefern — die Grundlage für Suchen wie
  // „Pizza Lieferservice Heilsbronn".
  areaServed: DELIVERY_AREAS.map(a => ({
    '@type': 'City',
    name: a.name,
    address: {
      '@type': 'PostalAddress',
      postalCode: a.postalCode,
      addressLocality: a.name,
      addressCountry: 'DE',
    },
  })),
  hasDeliveryMethod: ['http://purl.org/goodrelations/v1#DeliveryModeOwnFleet', 'http://purl.org/goodrelations/v1#DeliveryModePickUp'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-cream-50 text-charcoal-900 flex flex-col min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
        <CartProvider>
          <div className="flex-1">{children}</div>
          <Footer />
          <MobileCart />
        </CartProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
