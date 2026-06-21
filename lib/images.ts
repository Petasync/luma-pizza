// Unsplash CDN food images (free to use, hotlinked).
//
// Jedes Produkt bekommt ein Bild: pro Kategorie ein Pool aus geprüften Fotos,
// die deterministisch über die Artikel der Kategorie verteilt werden (→ innerhalb
// einer Kategorie keine Dubletten, solange der Pool groß genug ist). Für einzelne
// Artikel gibt es exakte Treffer (ITEM_OVERRIDE), die Vorrang haben.
//
// Alle hier referenzierten Foto-IDs wurden auf Erreichbarkeit (HTTP 200) geprüft.
// Es bleiben Stockfotos — echte Produktfotos von Kadir ersetzen sie später.

import { MenuItem } from './types'
import { MENU_ITEMS } from './menu'

const UNSPLASH = '?w=800&h=600&fit=crop&auto=format&q=80'
const url = (id: string) => `https://images.unsplash.com/photo-${id}${UNSPLASH}`

// Geprüfte Foto-Pools je Kategorie (Reihenfolge = Zuteilungsreihenfolge).
const CATEGORY_POOL: Record<string, string[]> = {
  'Pizza': [
    '1574071318508-1cdbab80d002', '1604068549290-dea0e4a305ca', '1628840042765-356cda07504e',
    '1565299624946-b28f40a0ae38', '1571407970349-bc81e7e96d47', '1513104890138-7c749659a591',
    '1593560708920-61dd98c46a4e', '1590947132387-155cc02f3212', '1566843972142-a7fcb70de55a',
    '1571066811602-716837d681de',
  ],
  'Burger': [
    '1568901346375-23c9450c58cd', '1550317138-10000687a72b', '1551782450-a2132b4ba21d',
    '1606755962773-d324e0a13086', '1572802419224-296b0aeee0d9', '1553979459-d2229ba7433b',
    '1610440042657-612c34d95e9f',
  ],
  'Pasta': [
    '1551183053-bf91a1d81141', '1612874742237-6526221588e3', '1563379926898-05f4575a45d8',
    '1621996346565-e3dbc646d9a9', '1556761223-4c4282c73f77', '1645112411341-6c4fd023714a',
    '1580959375944-abd7e991f971',
  ],
  'Fisch Gerichte': [
    '1599084993091-1cb5c0721cc6', '1565680018434-b513d5e5fd47',
    '1559737558-2f5a35f4523b', '1599487488170-d11ec9c172f0',
  ],
  'Schnitzel Gerichte': [
    '1432139509613-5c4255815697', '1544025162-d76694265947', '1565557623262-b51c2513a641',
  ],
  // Suppen sind aktuell nicht verfügbar — wir nutzen geprüfte Pasta-Bilder als Platzhalter.
  'Suppen': ['1556761223-4c4282c73f77', '1645112411341-6c4fd023714a'],
  'Snacks': ['1567620832903-9fc6debc209f', '1608039755401-742074f0548d'],
  'Beilagen': ['1630384060421-cb20d0e0649d', '1573080496219-bb080dd4f877'],
  'Salate': ['1512621776951-a57141f2eefd', '1473093295043-cdd812d0e601'],
  'Nachspeisen': [
    '1571877227200-a0d98ea607e9', '1598110750624-207050c4f28c', '1551024506-0bccd828d307',
  ],
  'Alkoholische Getränke': [
    '1558001373-7b93ee48ffa0', '1566995541428-f2246c17cda1',
    '1608270586620-248524c67de9', '1535958636474-b021ee887b13',
  ],
  'Alkoholfreie Getränke': [
    '1554866585-cd94860890b7', '1625772299848-391b6a87d7b3', '1499638673689-79a0b5115d87',
    '1616118132534-381148898bb4', '1571212515416-fef01fc43637', '1581636625402-29b2a704ef13',
    '1629203851122-3726ecdf080e',
  ],
}

// Exakte Foto-Treffer für bestimmte Artikel (haben Vorrang vor dem Pool).
const ITEM_OVERRIDE: Record<string, string> = {
  'pizza-luma': '1593560708920-61dd98c46a4e',        // Pizza mit Rucola
  'pizza-diavola': '1628840042765-356cda07504e',     // Salami/Peperoni
  'pizza-hawai': '1565299624946-b28f40a0ae38',
  'fisch-lachs': '1599084993091-1cb5c0721cc6',       // Lachs
  'fisch-kalamari': '1559737558-2f5a35f4523b',       // Calamari
  'fisch-garnelen': '1565680018434-b513d5e5fd47',    // Garnelen
  'fisch-oktopus': '1599487488170-d11ec9c172f0',
  'drink-cola-l': '1554866585-cd94860890b7',         // Coca-Cola
  'drink-sprite-l': '1625772299848-391b6a87d7b3',
  'drink-mezzo-l': '1629203851122-3726ecdf080e',
  'drink-arizona': '1499638673689-79a0b5115d87',     // Eistee
  'drink-wasser': '1616118132534-381148898bb4',
  'drink-stilles-wasser': '1616118132534-381148898bb4',
  'drink-ayran': '1571212515416-fef01fc43637',
  'drink-rotwein': '1558001373-7b93ee48ffa0',
  'drink-emilia-rotwein': '1558001373-7b93ee48ffa0',
  'drink-weisswein': '1566995541428-f2246c17cda1',
  'drink-radler': '1535958636474-b021ee887b13',
}

const FALLBACK_ID = '1574071318508-1cdbab80d002'

// Auflösung einmalig beim Laden: Overrides zuerst, dann Pool-Rotation pro Kategorie.
const RESOLVED_ID: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  const counter: Record<string, number> = {}
  for (const item of MENU_ITEMS) {
    if (ITEM_OVERRIDE[item.id]) {
      out[item.id] = ITEM_OVERRIDE[item.id]
      continue
    }
    const pool = CATEGORY_POOL[item.category]
    if (!pool || pool.length === 0) {
      out[item.id] = FALLBACK_ID
      continue
    }
    const n = counter[item.category] ?? 0
    out[item.id] = pool[n % pool.length]
    counter[item.category] = n + 1
  }
  return out
})()

export function getImageForItem(item: Pick<MenuItem, 'id' | 'category'>): string {
  const id = RESOLVED_ID[item.id] ?? CATEGORY_POOL[item.category]?.[0] ?? FALLBACK_ID
  return url(id)
}

export function getCategoryImage(category: string): string {
  return url(CATEGORY_POOL[category]?.[0] ?? FALLBACK_ID)
}

// Hero / gallery / about images (eigene Crops/Größen).
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
