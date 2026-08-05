import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.luma-pizza.de'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}/bestellen`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/speisekarte`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/liefergebiet`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/impressum`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/datenschutz`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
