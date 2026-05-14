import type { MetadataRoute } from 'next'

// Public pages are crawlable; the admin area, checkout and API are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/checkout', '/bestellung/', '/api/'],
    },
    sitemap: 'https://luma-pizza.de/sitemap.xml',
  }
}
