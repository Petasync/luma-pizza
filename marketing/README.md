# Marketing / Werbematerial — Luma Pizza

Druckfertige Werbe-Assets für Luma Pizza. Stand: 03.06.2026.

## Dateien

| Datei | Format | Inhalt |
|---|---|---|
| `luma-flyer.pdf` | A5 (148×210 mm) | Flyer: Kategorie-Preise, QR, Öffnungszeiten, Lieferung, Bezahlarten |
| `luma-flyer.html` | — | Bearbeitbare Quelle des Flyers (Logo + QR als Base64 eingebettet, eine Datei) |
| `luma-visitenkarte.pdf` | 85×55 mm, doppelseitig | Visitenkarte: Vorderseite Logo + Web, Rückseite Kontakt + QR |
| `luma-visitenkarte.html` | — | Bearbeitbare Quelle der Visitenkarte |
| `qr-luma-pizza.png` | 740×740 px | QR-Code einzeln → `https://www.luma-pizza.de` |

Die HTML-Dateien sind eigenständig (Logo `public/logo.png` + QR sind als Base64 eingebettet).
Zum Neu-Rendern als PDF: im Browser öffnen → Drucken → „Als PDF speichern", Format A5
(Flyer) bzw. 85×55 mm (Visitenkarte), Ränder „Keine". Erzeugt wurden sie via Edge headless
(`msedge --headless --print-to-pdf`).

## Eckdaten auf den Assets (Quelle: Website-Stand)

- **Marke/Logo:** Luma Pizza (Logo: „LUMA PIZZA SHISHA CAFE BAR")
- **Adresse:** Warzfeldener Straße 1-3, 90599 Dietenhofen
- **Telefon:** 0151 24882899
- **Website:** www.luma-pizza.de (QR zeigt hierhin)
- **E-Mail auf Print:** `luma.bar@gmx.de` (Direktkontakt)
  — Hinweis: die **Website/Impressum** nutzt `info@luma-pizza.de`; Bestell-Mails laufen an
  `bestellungen@luma-pizza.de` (+ `luma.bar@gmx.de` als Kopie). Bewusst unterschiedlich.
- **Pizza:** 33 cm (kleine Größe), 45 cm (große)
- **Öffnungszeiten:** täglich 15:00 – 24:00 Uhr
- **Liefergebiet/Mindestbestellwert:** Dietenhofen ab 15 €, übrige Orte (≤ ~15 km, z. B.
  Heilsbronn) ab 30 €. Liefergebühr **gratis**. Lieferzeit ca. 30–45 Min., Abholung 20–30 Min.
- **„ab"-Preise:** Pizza/Pasta ab 10,50 €, Burger ab 11,50 €, Schnitzel ab 12,50 €, Fisch ab 12,50 €,
  Salate ab 9,50 €, Snacks ab 9,50 €, Desserts ab 2,50 €, Getränke ab 2,50 €
- **Bezahlen:** Karte · PayPal · Bar

Wenn sich Preise/Öffnungszeiten/Liefergebiet ändern (Pflege in `lib/menu.ts`,
`lib/opening-hours.ts`, `lib/business.ts`, `lib/postal-codes.ts`), sollten die Werte hier und
in den HTML-Quellen entsprechend nachgezogen werden.
