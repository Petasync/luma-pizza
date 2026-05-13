import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart/cart-context'
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
  title: 'Luma Pizza — Authentisch italienisch, frisch zubereitet',
  description: 'Luma Pizza in Dietenhofen. Hausgemachte Pizza, Burger, Pasta und mehr. Direkt online bestellen, abholen oder liefern lassen.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-cream-50 text-charcoal-900 flex flex-col min-h-screen">
        <CartProvider>
          <div className="flex-1">{children}</div>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
