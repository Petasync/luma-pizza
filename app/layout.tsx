import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/cart/cart-context'

export const metadata: Metadata = {
  title: 'Luma Pizza — Online bestellen',
  description: 'Frische Pizza, Burger & Pasta direkt aus Dietenhofen — online bestellen und bezahlen.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="flex flex-col min-h-screen">
        <CartProvider>
          <div className="flex-1">{children}</div>
        </CartProvider>
        <footer className="border-t border-gray-200 bg-white py-6 px-4 text-center text-xs text-gray-400">
          <div className="flex justify-center gap-4">
            <a href="/impressum" className="hover:text-gray-600">Impressum</a>
            <a href="/datenschutz" className="hover:text-gray-600">Datenschutz</a>
          </div>
          <p className="mt-2">© {new Date().getFullYear()} Luma Pizza</p>
        </footer>
      </body>
    </html>
  )
}
