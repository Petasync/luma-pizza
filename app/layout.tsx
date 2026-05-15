import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { CartProvider } from '@/components/cart/cart-context'
import MobileCart from '@/components/cart/mobile-cart'
import Footer from '@/components/footer'

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
  metadataBase: new URL('https://luma-pizza.de'),
  title: 'Luma Pizza — Authentisch italienisch, frisch zubereitet',
  description: 'Luma Pizza in Dietenhofen. Hausgemachte Pizza, Burger, Pasta und mehr. Direkt online bestellen, abholen oder liefern lassen.',
  keywords: ['Pizza Dietenhofen', 'Pizza bestellen', 'Pizza Lieferservice', 'Pizzeria Dietenhofen', 'Luma Pizza', 'Pizza liefern lassen'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Luma Pizza',
    title: 'Luma Pizza — Authentisch italienisch, frisch zubereitet',
    description: 'Hausgemachte Pizza, Burger und Pasta aus Dietenhofen. Jetzt online bestellen — zum Abholen oder Liefern.',
    url: 'https://luma-pizza.de',
  },
}

export const viewport: Viewport = {
  themeColor: '#1A1612',
}

// LocalBusiness structured data — helps Luma Pizza appear in Google's local
// results / maps. Phone and openingHours can be added here once confirmed.
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
  url: 'https://luma-pizza.de',
  email: 'info@luma-pizza.de',
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
