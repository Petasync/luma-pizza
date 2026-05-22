import { MenuItem } from './types'

export const MENU_CATEGORIES = [
  'Pizza',
  'Burger',
  'Pasta',
  'Fisch Gerichte',
  'Schnitzel Gerichte',
  'Snacks',
  'Beilagen',
  'Salate',
  'Nachspeisen',
  'Alkoholische Getränke',
  'Alkoholfreie Getränke',
] as const

export const MENU_ITEMS: MenuItem[] = [
  // --- TEMPORÄRER STRIPE-LIVE-TEST (vor Go-Live wieder entfernen!) ---
  { id: 'zzz-stripe-test', category: 'Snacks', name: 'TEST-Artikel – bitte NICHT bestellen', description: 'Interner Stripe-Test, wird wieder entfernt', price: 1.00, available: true },
  // --- PIZZA ---
  { id: 'pizza-margherita', category: 'Pizza', name: 'Pizza Margherita', description: 'Tomatensauce, Edamer, Käse', priceSmall: 8.50, priceLarge: 9.50, available: true, tags: ['vegetarisch'] },
  { id: 'pizza-mozzarella', category: 'Pizza', name: 'Pizza Mozzarella', description: 'Tomatensauce, Mozzarella, Käse', priceSmall: 8.50, priceLarge: 9.50, available: true },
  { id: 'pizza-funghi', category: 'Pizza', name: 'Pizza Funghi', description: 'Tomatensauce, frische Champignons, Käse', priceSmall: 8.50, priceLarge: 9.50, available: true },
  { id: 'pizza-formaggio', category: 'Pizza', name: 'Pizza Formaggio', description: 'Tomatensauce, Gorgonzola, Parmesan, Edamer', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-luma', category: 'Pizza', name: 'Pizza Luma', description: 'Tomatensauce, Schinken, Rucola, Gorgonzola, Parmesan, gebratene Aubergine, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-vegetaria', category: 'Pizza', name: 'Pizza Vegetaria', description: 'Tomatensauce, Champignons, Peperoni, Paprika, Artischocken, Zwiebeln, Oliven, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true, tags: ['vegetarisch'] },
  { id: 'pizza-diavola', category: 'Pizza', name: 'Pizza Diavola', description: 'Tomatensauce, Schinken, Salami, Champignons, Rinderhackfleisch, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-americano', category: 'Pizza', name: 'Pizza Americano', description: 'Tomatensauce, Schinken, Salami, Peperoni, Mais, Zwiebeln, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-mexicano', category: 'Pizza', name: 'Pizza Mexicano', description: 'Tomatensauce, Salami, Bohnen, Peperoni, Mais, Zwiebeln, Käse', priceSmall: 9.00, priceLarge: 10.50, available: true },
  { id: 'pizza-hawai', category: 'Pizza', name: 'Pizza Hawai', description: 'Tomatensauce, Schinken, Ananas, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-tonno', category: 'Pizza', name: 'Pizza Tonno', description: 'Tomatensauce, Thunfisch, Knoblauch, Zwiebeln, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-gam', category: 'Pizza', name: 'Pizza Gam', description: 'Tomatensauce, Shrimps, Knoblauch, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-meeresfruchte', category: 'Pizza', name: 'Pizza Meeresfrüchte', description: 'Tomatensauce, Meeresfrüchte, Knoblauch, Käse', priceSmall: 9.50, priceLarge: 11.00, available: true },
  { id: 'pizza-botanik', category: 'Pizza', name: 'Pizza Botanik', description: 'Tomatensauce, Cherrytomaten, Mais, Käse', priceSmall: 8.50, priceLarge: 10.00, available: true, tags: ['vegetarisch'] },
  { id: 'pizza-calzone', category: 'Pizza', name: 'Pizza Calzone 30 cm', description: 'Tomatensauce, Schinken, Salami, Champignons', price: 10.00, available: true },
  { id: 'pizza-pastirma', category: 'Pizza', name: 'Pizza Pastirma', description: 'Tomatensauce, Kalbschinken, Rucola, Käse', priceSmall: 9.50, priceLarge: 11.00, available: false },
  // --- BURGER ---
  { id: 'burger-classic', category: 'Burger', name: 'Classic Burger', description: 'Rinderfleisch, Salat, Tomaten, Gewürzgurke, Zwiebeln', price: 10.00, available: true },
  { id: 'burger-cheese', category: 'Burger', name: 'Cheese Burger', description: 'Rinderfleisch, Salat, Tomaten, Gewürzgurke, Käse', price: 11.00, available: true },
  { id: 'burger-luma-mersin', category: 'Burger', name: 'Luma Mersin Burger', description: 'Rinderfleisch, Salat, Tomaten, Gewürzgurke, gebratene Aubergine, Zwiebeln, Käse', price: 11.50, available: true },
  { id: 'burger-chili-cheese', category: 'Burger', name: 'Chili Cheese Burger', description: 'Rinderfleisch, Salat, Tomaten, Jalapenos, Burgersauce, Käse', price: 11.00, available: true, tags: ['scharf'] },
  { id: 'burger-chicken', category: 'Burger', name: 'Chicken Burger', description: 'Hähnchenfleisch, Salat, Tomaten, Gewürzgurke', price: 10.00, available: true },
  { id: 'burger-double-beef', category: 'Burger', name: 'Double Beef Burger', description: 'Rinderfleisch, Salat, Tomaten, Gewürzgurke', price: 13.00, available: true },
  // --- PASTA ---
  { id: 'pasta-napoli', category: 'Pasta', name: 'Pasta Napoli', description: 'Tomatensauce', price: 8.50, available: true, tags: ['vegetarisch'] },
  { id: 'pasta-bolognese', category: 'Pasta', name: 'Pasta Bolognese', description: 'Tomatensauce, Rinderhackfleisch', price: 9.50, available: true },
  { id: 'pasta-al-pollo', category: 'Pasta', name: 'Pasta Al Pollo', description: 'Sahnesauce, Hähnchenbrust, Champignons, Brokkoli, Kirschtomaten', price: 9.50, available: true },
  { id: 'pasta-al-forno', category: 'Pasta', name: 'Pasta Al Forno', description: 'Tomatensauce, Hackfleisch, mit Käse überbacken', price: 9.50, available: true },
  { id: 'pasta-carbonara', category: 'Pasta', name: 'Pasta Carbonara', description: 'Sahnesauce, Schinken, Parmesan', price: 9.50, available: true },
  { id: 'pasta-al-curry', category: 'Pasta', name: 'Pasta Al Curry', description: 'Curry-Sahnesauce, Hähnchenbrust', price: 9.50, available: true },
  { id: 'pasta-tortellini-manti', category: 'Pasta', name: 'Tortellini Manti', description: 'Tomatensauce, Joghurtsauce', price: 12.50, available: true },
  // --- FISCH ---
  { id: 'fisch-kalamari', category: 'Fisch Gerichte', name: 'Kalamari', description: '', price: 13.00, available: true },
  { id: 'fisch-garnelen', category: 'Fisch Gerichte', name: 'Garnelenpfanne', description: 'Mit Paprika, Knoblauch (scharf)', price: 12.50, available: true, tags: ['scharf'] },
  { id: 'fisch-lachs', category: 'Fisch Gerichte', name: 'Lachs', description: 'Mit gekochten Kartoffeln und Gemüse', price: 14.00, available: false },
  { id: 'fisch-oktopus', category: 'Fisch Gerichte', name: 'Oktopus Salat', description: 'Mit Gemüse', price: 13.00, available: false },
  // --- SCHNITZEL ---
  { id: 'schnitzel-puten', category: 'Schnitzel Gerichte', name: 'Putenschnitzel', description: 'Mit Salat', price: 11.00, available: true },
  { id: 'schnitzel-schwein', category: 'Schnitzel Gerichte', name: 'Schweineschnitzel', description: 'Mit Salat', price: 12.50, available: true },
  // --- SNACKS ---
  { id: 'snack-wings', category: 'Snacks', name: 'Chicken Wings 12 Stück', description: '', price: 9.50, available: true },
  { id: 'snack-mozzarella-sticks', category: 'Snacks', name: 'Mozzarella Sticks 9 Stück', description: '', price: 7.00, available: true },
  // --- BEILAGEN ---
  { id: 'beilage-pommes', category: 'Beilagen', name: 'Pommes Frites', description: '', price: 4.50, available: true },
  // --- SALATE ---
  { id: 'salat-mexico', category: 'Salate', name: 'Mexico Salat', description: 'Hähnchenbrust, Rucola, Cherrytomaten, Gurken, Röstzwiebeln', price: 9.50, available: true },
  // --- NACHSPEISEN ---
  { id: 'dessert-baklava', category: 'Nachspeisen', name: 'Baklava', description: '', price: 6.00, available: true },
  { id: 'dessert-tiramisu', category: 'Nachspeisen', name: 'Tiramisu', description: '', price: 6.50, available: true },
  { id: 'dessert-milchreis', category: 'Nachspeisen', name: 'Milchreis', description: '', price: 5.00, available: false },
  { id: 'dessert-ice', category: 'Nachspeisen', name: 'Ice Kugel', description: '', price: 2.00, available: false },
  // --- ALKOHOLISCHE GETRÄNKE ---
  { id: 'drink-rotwein', category: 'Alkoholische Getränke', name: 'Rotwein Flasche', description: '', price: 11.00, available: true, tags: ['18+'] },
  { id: 'drink-weisswein', category: 'Alkoholische Getränke', name: 'Weißwein Flasche', description: '', price: 11.00, available: true, tags: ['18+'] },
  { id: 'drink-emilia-rotwein', category: 'Alkoholische Getränke', name: 'Emilia Süß Rotwein', description: '', price: 10.00, available: true, tags: ['18+'] },
  { id: 'drink-warsteiner', category: 'Alkoholische Getränke', name: 'Warsteiner', description: '', price: 4.00, available: true, tags: ['18+'] },
  { id: 'drink-becks', category: 'Alkoholische Getränke', name: 'Becks', description: '', price: 4.00, available: true, tags: ['18+'] },
  { id: 'drink-gruner', category: 'Alkoholische Getränke', name: 'Grüner', description: '', price: 4.00, available: true, tags: ['18+'] },
  { id: 'drink-gutman', category: 'Alkoholische Getränke', name: 'Gutman Weizen', description: '', price: 4.00, available: true, tags: ['18+'] },
  { id: 'drink-zindorfer', category: 'Alkoholische Getränke', name: 'Zindorfer 0,5l', description: '', price: 4.00, available: true, tags: ['18+'] },
  { id: 'drink-radler', category: 'Alkoholische Getränke', name: 'Radler', description: '', price: 3.50, available: true, tags: ['18+'] },
  // --- ALKOHOLFREIE GETRÄNKE ---
  { id: 'drink-cola-l', category: 'Alkoholfreie Getränke', name: 'Coca-Cola 1,0l', description: '', price: 5.00, available: true },
  { id: 'drink-fanta-l', category: 'Alkoholfreie Getränke', name: 'Fanta 1,0l', description: '', price: 5.00, available: true },
  { id: 'drink-sprite-l', category: 'Alkoholfreie Getränke', name: 'Sprite 1,0l', description: '', price: 5.00, available: true },
  { id: 'drink-mezzo-l', category: 'Alkoholfreie Getränke', name: 'Mezzo Mix 1,0l', description: '', price: 5.00, available: true },
  { id: 'drink-cola-s', category: 'Alkoholfreie Getränke', name: 'Coca-Cola 0,33l', description: '', price: 3.00, available: true },
  { id: 'drink-fanta-s', category: 'Alkoholfreie Getränke', name: 'Fanta 0,33l', description: '', price: 3.00, available: true },
  { id: 'drink-sprite-s', category: 'Alkoholfreie Getränke', name: 'Sprite 0,33l', description: '', price: 3.00, available: true },
  { id: 'drink-mezzo-s', category: 'Alkoholfreie Getränke', name: 'Mezzo Mix 0,33l', description: '', price: 3.00, available: true },
  { id: 'drink-arizona', category: 'Alkoholfreie Getränke', name: 'Arizona', description: '', price: 3.50, available: true },
  { id: 'drink-redbull', category: 'Alkoholfreie Getränke', name: 'Red Bull 0,25l', description: '', price: 2.50, available: true },
  { id: 'drink-wasser', category: 'Alkoholfreie Getränke', name: 'Mineralwasser', description: '', price: 2.50, available: true },
  { id: 'drink-stilles-wasser', category: 'Alkoholfreie Getränke', name: 'Stilles Wasser', description: '', price: 2.50, available: true },
  { id: 'drink-ayran', category: 'Alkoholfreie Getränke', name: 'Ayran', description: '', price: 2.50, available: true },
]

export function getItemsByCategory(category: string): MenuItem[] {
  return MENU_ITEMS.filter(item => item.category === category)
}

export function getItemById(id: string): MenuItem | undefined {
  return MENU_ITEMS.find(item => item.id === id)
}

/**
 * Schema.org Menu Structured Data — füttert Google für "Speisekarten-Karten"
 * in der lokalen Suche/Maps. Nur verfügbare Artikel; Preise in EUR.
 */
export function menuJsonLd() {
  const sections = MENU_CATEGORIES.map(cat => {
    const items = MENU_ITEMS.filter(i => i.category === cat && i.available).map(item => {
      const offers = item.priceSmall !== undefined && item.priceLarge !== undefined
        ? [
            { '@type': 'Offer', name: '30 cm', price: item.priceSmall!.toFixed(2), priceCurrency: 'EUR' },
            { '@type': 'Offer', name: '45 cm', price: item.priceLarge!.toFixed(2), priceCurrency: 'EUR' },
          ]
        : item.price !== undefined
          ? { '@type': 'Offer', price: item.price.toFixed(2), priceCurrency: 'EUR' }
          : undefined
      return {
        '@type': 'MenuItem',
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(offers ? { offers } : {}),
      }
    })
    return { '@type': 'MenuSection', name: cat, hasMenuItem: items }
  }).filter(s => Array.isArray(s.hasMenuItem) && s.hasMenuItem.length > 0)

  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: 'Speisekarte — Luma Pizza',
    hasMenuSection: sections,
  }
}
