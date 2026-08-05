import { MENU_ITEMS } from '@/lib/menu'
import {
  ALLERGENE,
  ALLERGEN_VORSCHLAG,
  ALLERGENE_FREIGEGEBEN,
  ZUSATZSTOFFE,
  artikelOhneAllergenangabe,
  formatAllergenCodes,
  getAllergene,
} from '@/lib/allergene'

describe('Allergen-Angaben', () => {
  it('deckt jeden Artikel der Speisekarte ab', () => {
    // Neue Gerichte ohne Allergen-Eintrag fallen hier auf, bevor sie live gehen.
    expect(artikelOhneAllergenangabe()).toEqual([])
  })

  it('enthält keine Einträge für gelöschte Artikel', () => {
    const ids = new Set(MENU_ITEMS.map(i => i.id))
    const verwaist = Object.keys(ALLERGEN_VORSCHLAG).filter(id => !ids.has(id))
    expect(verwaist).toEqual([])
  })

  it('verwendet nur gültige Kennbuchstaben und -ziffern', () => {
    for (const [id, angabe] of Object.entries(ALLERGEN_VORSCHLAG)) {
      for (const code of angabe.allergene) {
        expect(Object.keys(ALLERGENE)).toContain(code)
      }
      for (const code of angabe.zusatzstoffe ?? []) {
        expect(Object.keys(ZUSATZSTOFFE)).toContain(String(code))
      }
      expect(id).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('nennt bei Fisch, Krebs- und Weichtieren das passende Allergen', () => {
    // Stichproben, die sich direkt aus der Speisekarte ergeben.
    expect(ALLERGEN_VORSCHLAG['pizza-tonno'].allergene).toContain('D')
    expect(ALLERGEN_VORSCHLAG['fisch-garnelen'].allergene).toContain('B')
    expect(ALLERGEN_VORSCHLAG['pizza-meeresfruchte'].allergene).toContain('N')
    expect(ALLERGEN_VORSCHLAG['fisch-lachs'].allergene).toContain('D')
  })

  it('kennzeichnet jede Pizza mit Gluten und Milch', () => {
    for (const item of MENU_ITEMS.filter(i => i.category === 'Pizza')) {
      expect(ALLERGEN_VORSCHLAG[item.id].allergene).toEqual(expect.arrayContaining(['A', 'G']))
    }
  })

  it('gibt vor der Freigabe durch den Inhaber nichts aus', () => {
    // Solange die Liste nicht bestätigt ist, darf nichts angezeigt werden —
    // eine falsche Allergenangabe wäre gefährlicher als gar keine.
    if (!ALLERGENE_FREIGEGEBEN) {
      expect(getAllergene('pizza-margherita')).toBeNull()
    } else {
      expect(getAllergene('pizza-margherita')).not.toBeNull()
    }
  })

  it('formatiert Allergene und Zusatzstoffe als Kennzeichenliste', () => {
    expect(formatAllergenCodes({ allergene: ['A', 'G'] })).toBe('A, G')
    expect(formatAllergenCodes({ allergene: [], zusatzstoffe: [1, 11] })).toBe('1, 11')
    expect(formatAllergenCodes({ allergene: [] })).toBe('')
  })
})
