// Unsplash CDN food images (free to use, hotlinked)
// Replace with restaurant's own photos when going live.

import { MenuItem } from './types'

const UNSPLASH_PARAMS = '?w=800&h=600&fit=crop&auto=format&q=80'

const CATEGORY_FALLBACK: Record<string, string> = {
  'Pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002',
  'Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
  'Pasta': 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9',
  'Fisch Gerichte': 'https://images.unsplash.com/photo-1535140728325-a4d3707eee94',
  'Schnitzel Gerichte': 'https://images.unsplash.com/photo-1599921841143-819065280020',
  'Snacks': 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f',
  'Beilagen': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877',
  'Salate': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
  'Nachspeisen': 'https://images.unsplash.com/photo-1551024506-0bccd828d307',
  'Alkoholische Getränke': 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559',
  'Alkoholfreie Getränke': 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13',
}

// Per-item overrides for variety
const ITEM_IMAGES: Record<string, string> = {
  'pizza-margherita': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002',
  'pizza-funghi': 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca',
  'pizza-diavola': 'https://images.unsplash.com/photo-1628840042765-356cda07504e',
  'pizza-hawai': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
  'pizza-tonno': 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47',
  'pizza-vegetaria': 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
  'pizza-calzone': 'https://images.unsplash.com/photo-1601924928438-2f80aff8da13',
  'burger-classic': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
  'burger-cheese': 'https://images.unsplash.com/photo-1550317138-10000687a72b',
  'burger-double-beef': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d',
  'burger-chicken': 'https://images.unsplash.com/photo-1606755962773-d324e0a13086',
  'pasta-bolognese': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141',
  'pasta-carbonara': 'https://images.unsplash.com/photo-1612874742237-6526221588e3',
  'pasta-al-pollo': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8',
  'snack-wings': 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f',
  'beilage-pommes': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877',
  'dessert-tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9',
  'dessert-baklava': 'https://images.unsplash.com/photo-1598110750624-207050c4f28c',
}

export function getImageForItem(item: Pick<MenuItem, 'id' | 'category'>): string {
  const base = ITEM_IMAGES[item.id] ?? CATEGORY_FALLBACK[item.category] ?? CATEGORY_FALLBACK['Pizza']
  return base + UNSPLASH_PARAMS
}

export function getCategoryImage(category: string): string {
  const base = CATEGORY_FALLBACK[category] ?? CATEGORY_FALLBACK['Pizza']
  return base + UNSPLASH_PARAMS
}

// Hero / gallery / about images
export const HERO_IMAGE = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920&h=1080&fit=crop&auto=format&q=85'
export const STORY_IMAGE = 'https://images.unsplash.com/photo-1542528180-a1208c5169a5?w=1200&h=900&fit=crop&auto=format&q=85'
export const KITCHEN_IMAGE = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&h=900&fit=crop&auto=format&q=85'

export const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=600&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=600&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1542834291-c514e77b215f?w=600&h=600&fit=crop&auto=format&q=80',
  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&h=600&fit=crop&auto=format&q=80',
]
