/**
 * Allergene und Zusatzstoffe.
 *
 * ---------------------------------------------------------------------------
 * WARUM ES DAS GIBT
 * ---------------------------------------------------------------------------
 * Wer online bestellt, muss die 14 Hauptallergene VOR dem Absenden der
 * Bestellung sehen können (Art. 14 Abs. 1 lit. a LMIV i. V. m. Art. 9 Abs. 1
 * lit. c LMIV, § 4 LMIDV). Ein Hinweis „bitte anrufen" genügt beim Fernabsatz
 * nicht — die Angabe muss auf der Seite stehen und darf nichts kosten.
 *
 * ---------------------------------------------------------------------------
 * WARUM DIE ANZEIGE TROTZDEM AUS IST
 * ---------------------------------------------------------------------------
 * Die Zuordnung unten ist aus den Zutatenbeschreibungen der Speisekarte
 * ABGELEITET (Pizzateig → Gluten, Käse → Milch, Thunfisch → Fisch …). Was von
 * außen nicht erkennbar ist — Sellerie in der Gewürzmischung, Soja im
 * Backmittel, Sesam am Burgerbrötchen, Ei in der Sauce —, kann nur Kadir
 * beantworten. Eine falsche Allergenangabe ist gefährlicher als gar keine,
 * deshalb bleibt `ALLERGENE_FREIGEGEBEN` auf false, bis er die Liste in
 * `docs/allergene-pruefliste.md` durchgegangen ist. Danach ist es genau ein
 * Handgriff: Schalter auf true.
 */

import { MENU_ITEMS } from './menu'

/**
 * Der Schalter. Erst auf true stellen, wenn Kadir die Prüfliste bestätigt hat —
 * mit Datum im Commit, damit nachvollziehbar bleibt, wer wann freigegeben hat.
 */
export const ALLERGENE_FREIGEGEBEN = false

/** Kennbuchstaben nach der in Bayern/DEHOGA üblichen Konvention. */
export const ALLERGENE = {
  A: 'Glutenhaltiges Getreide',
  B: 'Krebstiere',
  C: 'Eier',
  D: 'Fisch',
  E: 'Erdnüsse',
  F: 'Soja',
  G: 'Milch (inkl. Laktose)',
  H: 'Schalenfrüchte (Nüsse)',
  I: 'Sellerie',
  J: 'Senf',
  K: 'Sesam',
  L: 'Schwefeldioxid und Sulfite',
  M: 'Lupinen',
  N: 'Weichtiere',
} as const

export type AllergenCode = keyof typeof ALLERGENE

/** Kennziffern für Zusatzstoffe (ZZulV / LMIV Anhang III). */
export const ZUSATZSTOFFE = {
  1: 'mit Farbstoff',
  2: 'mit Konservierungsstoff',
  3: 'mit Antioxidationsmittel',
  4: 'mit Geschmacksverstärker',
  5: 'geschwefelt',
  6: 'geschwärzt',
  7: 'gewachst',
  8: 'mit Phosphat',
  9: 'mit Süßungsmitteln',
  10: 'enthält eine Phenylalaninquelle',
  11: 'koffeinhaltig',
  12: 'chininhaltig',
} as const

export type ZusatzstoffCode = keyof typeof ZUSATZSTOFFE

export interface AllergenAngabe {
  allergene: AllergenCode[]
  zusatzstoffe?: ZusatzstoffCode[]
  /** Was Kadir klären muss — erscheint als offene Frage in der Prüfliste. */
  offeneFrage?: string
}

/**
 * Abgeleiteter Vorschlag je Artikel — NICHT bestätigt.
 *
 * Grundannahmen, die für alle Speisen gelten und in der Prüfliste stehen:
 *   Pizzateig, Panade, Pasta, Brötchen → A (Weizen)
 *   Käse, Sahne, Joghurt, Butter      → G (Milch)
 */
export const ALLERGEN_VORSCHLAG: Record<string, AllergenAngabe> = {
  // --- PIZZA: Teig (A) + Käse (G) sind bei allen gesetzt ---
  'pizza-margherita': { allergene: ['A', 'G'] },
  'pizza-mozzarella': { allergene: ['A', 'G'] },
  'pizza-funghi': { allergene: ['A', 'G'] },
  'pizza-formaggio': { allergene: ['A', 'G'] },
  'pizza-salami': { allergene: ['A', 'G'], offeneFrage: 'Salami: Senf/Sellerie in der Gewürzung? Nitritpökelsalz (Zusatzstoff 2)?' },
  'pizza-sucuk': { allergene: ['A', 'G'], offeneFrage: 'Sucuk: Knoblauchwurst enthält oft Konservierungsstoffe (2) und Senf.' },
  'pizza-schinken': { allergene: ['A', 'G'], offeneFrage: 'Schinken: Phosphat (8) und Konservierungsstoff (2) prüfen.' },
  'pizza-spezial': { allergene: ['A', 'G'] },
  'pizza-luma': { allergene: ['A', 'G'] },
  'pizza-vegetaria': { allergene: ['A', 'G'], offeneFrage: 'Artischocken/Oliven aus dem Glas: Sulfite (L)?' },
  'pizza-diavola': { allergene: ['A', 'G'] },
  'pizza-americano': { allergene: ['A', 'G'] },
  'pizza-mexicano': { allergene: ['A', 'G'] },
  'pizza-hawai': { allergene: ['A', 'G'] },
  'pizza-tonno': { allergene: ['A', 'D', 'G'] },
  'pizza-gam': { allergene: ['A', 'B', 'G'] },
  'pizza-meeresfruchte': { allergene: ['A', 'B', 'G', 'N'] },
  'pizza-botanik': { allergene: ['A', 'G'] },
  'pizza-calzone': { allergene: ['A', 'G'] },
  'pizza-pastirma': { allergene: ['A', 'G'] },

  // --- FISCH ---
  'fisch-kalamari': { allergene: ['A', 'N'], offeneFrage: 'Panade: Ei (C) enthalten? Fritteuse auch für Fisch/Panade mit Gluten?' },
  'fisch-garnelen': { allergene: ['B'] },
  'fisch-lachs': { allergene: ['D'] },
  'fisch-oktopus': { allergene: ['N'] },

  // --- SUPPEN (aktuell nicht im Angebot) ---
  'suppe-linsen': { allergene: [], offeneFrage: 'Suppe: Brühe mit Sellerie (I)? Mehlschwitze (A)?' },
  'suppe-kuttel': { allergene: [], offeneFrage: 'Suppe: Brühe mit Sellerie (I)? Mehlschwitze (A)?' },

  // --- BURGER: Brötchen (A) ---
  'burger-classic': { allergene: ['A'], offeneFrage: 'Burgerbrötchen: Sesam (K), Ei (C), Soja (F)? Sauce mit Senf (J)/Ei (C)?' },
  'burger-cheese': { allergene: ['A', 'G'], offeneFrage: 'Burgerbrötchen: Sesam (K), Ei (C), Soja (F)?' },
  'burger-luma-mersin': { allergene: ['A', 'G'], offeneFrage: 'Burgerbrötchen: Sesam (K), Ei (C), Soja (F)?' },
  'burger-chili-cheese': { allergene: ['A', 'G'], offeneFrage: 'Burgersauce: Ei (C) und Senf (J) sehr wahrscheinlich — bitte Etikett prüfen.' },
  'burger-chicken': { allergene: ['A'], offeneFrage: 'Hähnchen paniert? Dann zusätzlich Ei (C) prüfen.' },
  'burger-double-beef': { allergene: ['A'], offeneFrage: 'Burgerbrötchen: Sesam (K), Ei (C), Soja (F)?' },

  // --- SNACKS ---
  'snack-wings': { allergene: [], offeneFrage: 'Chicken Wings: paniert oder mariniert? Panade = A, evtl. C. Marinade: Soja (F)?' },
  'snack-mozzarella-sticks': { allergene: ['A', 'G'], offeneFrage: 'Panade: Ei (C) enthalten?' },

  // --- SCHNITZEL: Panade = A + meist C ---
  'schnitzel-puten': { allergene: ['A', 'C'], offeneFrage: 'Panade mit Milch (G) angerührt? Salatdressing: Senf (J)?' },
  'schnitzel-schwein': { allergene: ['A', 'C'], offeneFrage: 'Panade mit Milch (G) angerührt? Salatdressing: Senf (J)?' },

  // --- BEILAGEN ---
  'beilage-pommes': { allergene: [], offeneFrage: 'Pommes: Fritteuse gemeinsam mit paniertem Fisch/Fleisch? Dann Spurenhinweis nötig.' },

  // --- PASTA: Nudeln = A ---
  'pasta-napoli': { allergene: ['A'], offeneFrage: 'Tomatensauce: Sellerie (I) in der Gewürzmischung?' },
  'pasta-bolognese': { allergene: ['A'], offeneFrage: 'Bolognese: Sellerie (I) im Soffritto/in der Brühe?' },
  'pasta-al-pollo': { allergene: ['A', 'G'] },
  'pasta-al-forno': { allergene: ['A', 'G'] },
  'pasta-carbonara': { allergene: ['A', 'G'], offeneFrage: 'Carbonara: Ei (C) in der Sauce?' },
  'pasta-al-curry': { allergene: ['A', 'G'], offeneFrage: 'Currypulver: Senf (J)/Sellerie (I) enthalten?' },
  'pasta-tortellini-manti': { allergene: ['A', 'C', 'G'] },

  // --- SALATE ---
  'salat-gemischter': { allergene: [], offeneFrage: 'Dressing: Senf (J), Ei (C), Sulfite (L)? Oliven aus dem Glas: Sulfite (L)?' },
  'salat-bauern': { allergene: ['G'], offeneFrage: 'Dressing: Senf (J)? Oliven: Sulfite (L)?' },
  'salat-mexico': { allergene: [], offeneFrage: 'Röstzwiebeln enthalten Weizenmehl (A) — bestätigen. Dressing: Senf (J)?' },

  // --- NACHSPEISEN ---
  'dessert-tiramisu': { allergene: ['A', 'C', 'G'], offeneFrage: 'Löffelbiskuit: Soja (F)? Kaffee = koffeinhaltig (11).' },
  'dessert-kugel-eis': { allergene: ['G'], offeneFrage: 'Je Sorte unterschiedlich: Haselnuss = H, Stracciatella evtl. F/H, Marshmallow evtl. C. Sorten einzeln prüfen.' },
  'dessert-baklava': { allergene: ['A', 'G', 'H'] },
  'dessert-milchreis': { allergene: ['G'] },

  // --- ALKOHOLISCHE GETRÄNKE ---
  'drink-rotwein': { allergene: ['L'], offeneFrage: 'Etikett prüfen: manche Weine sind mit Ei (C) oder Milch (G) geschönt.' },
  'drink-weisswein': { allergene: ['L'], offeneFrage: 'Etikett prüfen: Schönung mit Ei (C)/Milch (G)?' },
  'drink-emilia-rotwein': { allergene: ['L'], offeneFrage: 'Etikett prüfen: Schönung mit Ei (C)/Milch (G)?' },
  'drink-warsteiner': { allergene: ['A'] },
  'drink-becks': { allergene: ['A'] },
  'drink-gruner': { allergene: ['A'] },
  'drink-gutman': { allergene: ['A'] },
  'drink-zindorfer': { allergene: ['A'] },
  'drink-radler': { allergene: ['A'] },

  // --- ALKOHOLFREIE GETRÄNKE ---
  'drink-cola-l': { allergene: [], zusatzstoffe: [1, 11] },
  'drink-cola-033': { allergene: [], zusatzstoffe: [1, 11] },
  'drink-fanta-l': { allergene: [] },
  'drink-fanta-033': { allergene: [] },
  'drink-sprite-l': { allergene: [] },
  'drink-sprite-033': { allergene: [] },
  'drink-mezzo-l': { allergene: [], zusatzstoffe: [1, 11] },
  'drink-mezzo-033': { allergene: [], zusatzstoffe: [1, 11] },
  'drink-arizona': { allergene: [], offeneFrage: 'Arizona: welche Sorte? Eistee ist meist koffeinhaltig (11).' },
  'drink-redbull': { allergene: [], zusatzstoffe: [11] },
  'drink-wasser': { allergene: [] },
  'drink-stilles-wasser': { allergene: [] },
  'drink-ayran': { allergene: ['G'] },
}

/**
 * Allergene eines Artikels — leer, solange die Liste nicht freigegeben ist.
 * So kann die Anzeige überall bedenkenlos eingebaut werden und bleibt bis zur
 * Freigabe automatisch unsichtbar.
 */
export function getAllergene(itemId: string): AllergenAngabe | null {
  if (!ALLERGENE_FREIGEGEBEN) return null
  return ALLERGEN_VORSCHLAG[itemId] ?? null
}

/** „A, G" — kompakte Kennzeichnung für die Speisekarte. */
export function formatAllergenCodes(angabe: AllergenAngabe): string {
  const teile = [...angabe.allergene, ...(angabe.zusatzstoffe ?? []).map(String)]
  return teile.join(', ')
}

/** Artikel ohne Eintrag im Vorschlag — Schutz vor vergessenen Neuzugängen. */
export function artikelOhneAllergenangabe(): string[] {
  return MENU_ITEMS.filter(i => !ALLERGEN_VORSCHLAG[i.id]).map(i => i.id)
}
