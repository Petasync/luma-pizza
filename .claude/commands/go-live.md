---
description: GO-LIVE.md + Kundentermin-Checkliste automatisch abarbeiten und offene Punkte melden
---

Arbeite die beiden Checklisten des Projekts ab und melde den Stand:

1. **Lies beide Dateien komplett:**
   - `GO-LIVE.md` (Repo-Root)
   - `docs/kundentermin-checkliste.md`

2. **Prüfe jeden prüfbaren Punkt selbst**, statt ihn nur aufzulisten:
   - Code/Konfig-Punkte: direkt im Repo nachsehen (Dateien lesen, greppen) —
     z. B. Migrationen vorhanden, Routen geschützt, Meta-Tags/SEO-Dateien da,
     Mindestbestellwert und Öffnungszeiten serverseitig durchgesetzt.
   - Live-Verhalten: mit den Playwright-Browser-Tools gegen
     https://www.luma-pizza.de prüfen (Seiten laden, Impressum/Datenschutz
     erreichbar, Bestellstrecke bis VOR die Zahlung). Keine echten
     Bestellungen abschicken, keine echten Zahlungen.
   - Deploy/Infrastruktur: Vercel-Tools (letztes Deployment grün? Cron
     `/api/cron/nachtwache` eingetragen?).
   - Als "Erledigt" markierte Punkte stichprobenartig gegenprüfen — die
     Datei kann veralten.

3. **Trenne sauber:**
   - ✅ Geprüft und in Ordnung (mit Beleg: Datei/URL/Screenshot)
   - ❌ Geprüft und NICHT in Ordnung (mit Fundstelle)
   - 👤 Menschen-Aufgabe — kann nur Phillip/Kadir erledigen (z. B.
     Allergen-Angaben liefern, Stripe-Webhook im Dashboard eintragen,
     Konto-Einstellungen). Nicht selbst versuchen, nur klar auflisten.

4. **Ampel-Fazit am Ende:**
   - 🟢 bereit — nichts Blockierendes offen
   - 🟡 geht, aber offene Punkte (aufzählen, wer dran ist)
   - 🔴 blockiert — Go-Live-/Termin-Blocker zuerst nennen
