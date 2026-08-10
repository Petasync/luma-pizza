---
name: bestellflow-test
description: "Kompletten Bestellweg im Browser durchklicken: Speisekarte → Warenkorb → Checkout → Bestätigung. Nutzen bei: Änderungen an Bestellsystem, Checkout, Zahlung, vor jedem Deploy."
---

# Bestellflow im Browser testen

Den kompletten Bestellweg wie ein echter Kunde durchklicken — mit den
Playwright-Browser-Tools, Screenshots an jedem Schritt.

## Sicherheit zuerst — NIEMALS echte Zahlungen

- Vor dem Start prüfen, dass Stripe im **TESTMODUS** läuft:
  `STRIPE_SECRET_KEY` in `.env.local` muss mit `sk_test_` beginnen
  (nur den Präfix prüfen, den Schlüssel nie ausgeben). Beginnt er mit
  `sk_live_`: **sofort abbrechen** und melden — kein Test gegen Live-Keys.
- Testkarte: `4242 4242 4242 4242`, beliebiges zukünftiges Ablaufdatum,
  beliebige CVC, beliebige PLZ.
- Alternativ die Zahlart "Barzahlung" testen — die legt nur eine
  unbezahlte Bestellung an, ohne Zahlungsdienst.

## Ablauf

1. **Dev-Server starten:** `npm run dev` → http://localhost:3000
   (im Hintergrund laufen lassen, auf "Ready" warten).

2. **Bestellstrecke durchklicken** (Playwright: `browser_navigate`,
   `browser_click`, `browser_snapshot`, `browser_take_screenshot`):
   - `/bestellen` — Speisekarte mit Bestellfunktion. Artikel über die
     Menü-Karten in den Warenkorb legen; der Warenkorb ist die
     **Sidebar** (Desktop, `components/cart/cart-sidebar.tsx`) bzw. der
     **Mobile-Warenkorb** unten (`components/cart/mobile-cart.tsx`) —
     kein eigener Seitenpfad.
     (`/speisekarte` ist nur das Schaufenster ohne Bestellfunktion.)
   - Mindestbestellwert 15 € für Lieferung beachten — ggf. mehr Artikel
     hinzufügen oder Abholung wählen.
   - `/checkout` — Formular ausfüllen (Name, Telefon, bei Lieferung
     Adresse mit gültiger PLZ aus dem Liefergebiet), Zahlart wählen,
     mit Testkarte bezahlen.
   - `/bestellung/[id]` — Bestätigungs-/Statusseite, auf die nach der
     Bestellung weitergeleitet wird (Status-Stepper, pollt alle 8 s).

3. **Kernprüfung Zahlungssicherheit** (Vorfall 26.07.2026!):
   Eine Bestellung darf erst als **bezahlt** gelten, wenn die Zahlung
   serverseitig bestätigt wurde:
   - Beim Absenden entsteht zuerst nur eine Vormerkung
     (`payment_status: 'pending'`, `/api/bestellung/vormerken`).
   - Auf `paid` wechselt sie erst nach Zahlungsbestätigung
     (`/api/bestellung/bestaetigen` verifiziert direkt beim
     Zahlungsdienst, bzw. Stripe-Webhook).
   - Gegenprobe: Checkout beginnen, Zahlung abbrechen → die Bestellung
     darf NICHT als bezahlt in der Admin-Ansicht (`/admin`) auftauchen.

4. **Screenshots** von jedem Schritt machen (Speisekarte, gefüllter
   Warenkorb, Checkout, Bestätigungsseite) und im Ergebnis nennen.

5. **Aufräumen:** Dev-Server stoppen; Testbestellungen als solche nennen,
   damit sie in der Küche niemand ausliefert.

## Außerhalb der Öffnungszeiten

Bestellen ist serverseitig gesperrt (Mo 17:00 – So 14:00, jeweils bis
23:15). Erscheint der "Geschlossen"-Banner, ist das erwartetes Verhalten —
im Testbericht vermerken, nicht als Fehler werten.
