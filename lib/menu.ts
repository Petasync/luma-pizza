import { MenuItem } from './types'

export const MENU_CATEGORIES = [
  'Pizza',
  'Fisch Gerichte',
  'Suppen',
  'Burger',
  'Snacks',
  'Schnitzel Gerichte',
  'Beilagen',
  'Pasta',
  'Salate',
  'Nachspeisen',
  'Alkoholische Getränke',
  'Alkoholfreie Getränke',
] as const

export const MENU_ITEMS: MenuItem[] = [
  // --- PIZZA (priceSmall = 33 cm, priceLarge = 45 cm) ---
  { id: 'pizza-margherita', category: 'Pizza', name: 'Pizza Margherita', description: 'Tomatensauce, Edamer, Käse', priceSmall: 10.50, priceLarge: 17.00, available: true, tags: ['vegetarisch'] },
  { id: 'pizza-mozzarella', category: 'Pizza', name: 'Pizza Mozzarella', description: 'Tomatensauce, Mozzarella, Käse', priceSmall: 11.50, priceLarge: 18.00, available: true },
  { id: 'pizza-funghi', category: 'Pizza', name: 'Pizza Funghi', description: 'Tomatensauce, frische Champignons, Käse', priceSmall: 11.50, priceLarge: 18.00, available: true },
  { id: 'pizza-formaggio', category: 'Pizza', name: 'Pizza Formaggio', description: 'Tomatensauce, Mozzarella, Gorgonzola, Parmesan, Edamer', priceSmall: 12.50, priceLarge: 20.00, available: true, tags: ['vegetarisch'] },
  { id: 'pizza-salami', category: 'Pizza', name: 'Pizza Salami', description: 'Tomatensauce, Rinder- oder Schweinefleisch, Käse', priceSmall: 11.50, priceLarge: 19.00, available: true },
  { id: 'pizza-sucuk', category: 'Pizza', name: 'Pizza Sucuk', description: 'Tomatensauce, Knoblauchwurst, Käse', priceSmall: 12.50, priceLarge: 21.00, available: true },
  { id: 'pizza-schinken', category: 'Pizza', name: 'Pizza Schinken', description: 'Tomatensauce, Puten- oder Schweinefleisch, Käse', priceSmall: 12.00, priceLarge: 19.00, available: true },
  { id: 'pizza-spezial', category: 'Pizza', name: 'Pizza Spezial', description: 'Tomatensauce, Schinken, Champignons, Salami, Peperoni, Paprika, Käse', priceSmall: 12.50, priceLarge: 21.00, available: true },
  { id: 'pizza-luma', category: 'Pizza', name: 'Pizza Luma', description: 'Tomatensauce, Schinken (Pute oder Schwein), Rucola, Gorgonzola, Parmesan, gebratene Aubergine, Käse', priceSmall: 12.50, priceLarge: 21.00, available: true },
  { id: 'pizza-vegetaria', category: 'Pizza', name: 'Pizza Vegetaria', description: 'Tomatensauce, Champignons, Peperoni, Paprika, Artischocken, Zwiebeln, Oliven, Käse', priceSmall: 12.50, priceLarge: 21.00, available: true, tags: ['vegetarisch'] },
  { id: 'pizza-diavola', category: 'Pizza', name: 'Pizza Diavola', description: 'Tomatensauce, Schinken, Salami, Champignons, Rinderhackfleisch, Käse', priceSmall: 12.50, priceLarge: 21.00, available: true },
  { id: 'pizza-americano', category: 'Pizza', name: 'Pizza Americano', description: 'Tomatensauce, Schinken, Salami, Peperoni, Mais, Zwiebeln, Käse', priceSmall: 12.50, priceLarge: 21.00, available: true },
  { id: 'pizza-mexicano', category: 'Pizza', name: 'Pizza Mexicano', description: 'Tomatensauce, Salami, Bohnen, Peperoni, Mais, Zwiebeln, Käse', priceSmall: 12.00, priceLarge: 20.00, available: true },
  { id: 'pizza-hawai', category: 'Pizza', name: 'Pizza Hawai', description: 'Tomatensauce, Schinken, Ananas, Käse', priceSmall: 12.50, priceLarge: 19.00, available: true },
  { id: 'pizza-tonno', category: 'Pizza', name: 'Pizza Tonno', description: 'Tomatensauce, Thunfisch, Knoblauch, Zwiebeln, Käse', priceSmall: 12.50, priceLarge: 21.00, available: true },
  { id: 'pizza-gam', category: 'Pizza', name: 'Pizza Gam', description: 'Tomatensauce, Shrimps, Knoblauch, Käse', priceSmall: 12.50, priceLarge: 21.00, available: true },
  { id: 'pizza-meeresfruchte', category: 'Pizza', name: 'Pizza Meeresfrüchte', description: 'Tomatensauce, Meeresfrüchte, Knoblauch, Käse', priceSmall: 12.50, priceLarge: 21.00, available: true },
  { id: 'pizza-botanik', category: 'Pizza', name: 'Pizza Botanik', description: 'Tomatensauce, Brokkoli, Cherrytomaten, Mais, Käse', priceSmall: 12.00, priceLarge: 21.00, available: true, tags: ['vegetarisch'] },
  { id: 'pizza-calzone', category: 'Pizza', name: 'Pizza Calzone 30 cm - 33 cm', description: 'Tomatensauce, Schinken, Salami, Champignons', price: 12.50, available: true },
  { id: 'pizza-pastirma', category: 'Pizza', name: 'Pizza Pastirma', description: 'Tomatensauce, Kalbschinken, Rucola, Käse', priceSmall: 12.50, priceLarge: 21.00, available: false },
  // --- FISCH GERICHTE ---
  { id: 'fisch-kalamari', category: 'Fisch Gerichte', name: 'Kalamari', description: 'Wahlweise mit Pommes frites, Bratkartoffeln oder Gemüse', price: 15.00, available: true },
  { id: 'fisch-garnelen', category: 'Fisch Gerichte', name: 'Garnelenpfanne', description: 'Mit Paprika, Knoblauch (scharf)', price: 12.50, available: true, tags: ['scharf'] },
  { id: 'fisch-lachs', category: 'Fisch Gerichte', name: 'Lachs', description: 'Mit gekochten Kartoffeln und Gemüse', price: 15.50, available: true },
  { id: 'fisch-oktopus', category: 'Fisch Gerichte', name: 'Oktopus Salat', description: 'Mit Gemüse', price: 14.00, available: false },
  // --- SUPPEN ---
  { id: 'suppe-linsen', category: 'Suppen', name: 'Linsensuppe', description: '', price: 6.50, available: false },
  { id: 'suppe-kuttel', category: 'Suppen', name: 'Kuttelsuppe', description: '', price: 7.50, available: false },
  // --- BURGER ---
  { id: 'burger-classic', category: 'Burger', name: 'Classic Burger', description: 'Rinderfleisch, Salat, Tomaten, Gewürzgurke, Zwiebeln', price: 12.00, available: true },
  { id: 'burger-cheese', category: 'Burger', name: 'Cheese Burger', description: 'Rinderfleisch, Salat, Tomaten, Gewürzgurke, Käse', price: 12.50, available: true },
  { id: 'burger-luma-mersin', category: 'Burger', name: 'Luma Mersin Burger', description: 'Rinderfleisch, Salat, Tomaten, Gewürzgurke, gebratene Aubergine, Zwiebeln, Käse', price: 13.50, available: true },
  { id: 'burger-chili-cheese', category: 'Burger', name: 'Chili Cheese Burger', description: 'Rinderfleisch, Salat, Tomaten, Jalapenos, Burgersauce, Käse', price: 13.00, available: true, tags: ['scharf'] },
  { id: 'burger-chicken', category: 'Burger', name: 'Chicken Burger', description: 'Hähnchenfleisch, Salat, Tomaten, Gewürzgurke', price: 11.50, available: true },
  { id: 'burger-double-beef', category: 'Burger', name: 'Double Beef Burger', description: 'Rinderfleisch, Salat, Tomaten, Gewürzgurke', price: 15.00, available: true },
  // --- SNACKS ---
  { id: 'snack-wings', category: 'Snacks', name: 'Chicken Wings 9 Stück', description: '', price: 11.50, available: true },
  { id: 'snack-mozzarella-sticks', category: 'Snacks', name: 'Mozzarella Sticks 9 Stück', description: '', price: 9.50, available: true },
  // --- SCHNITZEL GERICHTE ---
  { id: 'schnitzel-puten', category: 'Schnitzel Gerichte', name: 'Putenschnitzel', description: 'Mit Salat, wahlweise Pommes frites oder Reis', price: 13.50, available: true },
  { id: 'schnitzel-schwein', category: 'Schnitzel Gerichte', name: 'Schweineschnitzel', description: 'Mit Salat, wahlweise Pommes frites oder Reis', price: 12.50, available: true },
  // --- BEILAGEN ---
  { id: 'beilage-pommes', category: 'Beilagen', name: 'Pommes Frites', description: '', price: 6.00, available: true },
  // --- PASTA ---
  { id: 'pasta-napoli', category: 'Pasta', name: 'Pasta Napoli', description: 'Tomatensauce', price: 10.50, available: true, tags: ['vegetarisch'] },
  { id: 'pasta-bolognese', category: 'Pasta', name: 'Pasta Bolognese', description: 'Tomatensauce, Rinderhackfleisch', price: 12.00, available: true },
  { id: 'pasta-al-pollo', category: 'Pasta', name: 'Pasta Al Pollo', description: 'Sahnesauce, Hähnchenbrust, Champignons, Brokkoli, Kirschtomaten', price: 12.50, available: true },
  { id: 'pasta-al-forno', category: 'Pasta', name: 'Pasta Al Forno', description: 'Tomatensauce, Hackfleisch, mit Käse überbacken', price: 12.50, available: true },
  { id: 'pasta-carbonara', category: 'Pasta', name: 'Pasta Carbonara', description: 'Sahnesauce, Schinken, Parmesan', price: 13.00, available: true },
  { id: 'pasta-al-curry', category: 'Pasta', name: 'Pasta Al Curry', description: 'Curry-Sahnesauce, Hähnchenbrust', price: 12.50, available: true },
  { id: 'pasta-tortellini-manti', category: 'Pasta', name: 'Tortellini Manti', description: 'Tomatensauce, Joghurtsauce', price: 12.50, available: false },
  // --- SALATE ---
  { id: 'salat-gemischter', category: 'Salate', name: 'Gemischter Salat', description: 'Tomaten, Gurken, Oliven, Zwiebeln', price: 9.50, available: true, tags: ['vegetarisch'] },
  { id: 'salat-bauern', category: 'Salate', name: 'Bauernsalat', description: 'Tomaten, Gurken, Schafskäse, Oliven', price: 10.50, available: true, tags: ['vegetarisch'] },
  { id: 'salat-mexico', category: 'Salate', name: 'Mexico Salat', description: 'Hähnchenbrust, Rucola, Cherrytomaten, Gurken, Röstzwiebeln', price: 11.50, available: true },
  // --- NACHSPEISEN ---
  { id: 'dessert-tiramisu', category: 'Nachspeisen', name: 'Tiramisu', description: '', price: 6.50, available: true },
  { id: 'dessert-kugel-eis', category: 'Nachspeisen', name: 'Kugel Eis', description: 'Pro Kugel — Erdbeer, Vanille, Schokolade, Zitrone, Stracciatella, Haselnuss, Marshmallow, Mango', price: 2.50, available: true },
  { id: 'dessert-baklava', category: 'Nachspeisen', name: 'Baklava', description: '', price: 6.00, available: false },
  { id: 'dessert-milchreis', category: 'Nachspeisen', name: 'Milchreis', description: '', price: 4.00, available: false },
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
  { id: 'drink-cola-033', category: 'Alkoholfreie Getränke', name: 'Coca-Cola 0,33l', description: '', price: 3.00, available: true },
  { id: 'drink-fanta-033', category: 'Alkoholfreie Getränke', name: 'Fanta 0,33l', description: '', price: 3.00, available: true },
  { id: 'drink-sprite-033', category: 'Alkoholfreie Getränke', name: 'Sprite 0,33l', description: '', price: 3.00, available: true },
  { id: 'drink-mezzo-033', category: 'Alkoholfreie Getränke', name: 'Mezzo Mix 0,33l', description: '', price: 3.00, available: true },
  { id: 'drink-arizona', category: 'Alkoholfreie Getränke', name: 'Arizona', description: '', price: 3.50, available: true },
  { id: 'drink-redbull', category: 'Alkoholfreie Getränke', name: 'Red Bull Energy Drink 0,25l', description: '', price: 2.50, available: true },
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
            { '@type': 'Offer', name: '33 cm', price: item.priceSmall!.toFixed(2), priceCurrency: 'EUR' },
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
