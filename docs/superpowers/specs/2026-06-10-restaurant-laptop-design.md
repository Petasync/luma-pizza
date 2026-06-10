# Restaurant-Laptop (HP, Win 11) als Bestell-Terminal — Design

Stand: 2026-06-10

Ein dedizierter HP-Laptop (Windows 11) wird in der Pizzeria als Bestell-Terminal
aufgestellt. Er soll beim Einschalten ohne Bedienung hochfahren, das Luma-Pizza-
Admin-Dashboard im Vollbild anzeigen, automatisch angemeldet sein und bei jeder
neuen Bestellung einen lauten, sich wiederholenden Ton abspielen.

## Bestätigte Entscheidungen

- **Anzeige:** Kiosk-Modus (Edge Vollbild, nur Dashboard, keine Adressleiste/Tabs).
- **Dashboard-Login:** automatisch bei jedem Start — umgesetzt über einen separaten
  **Geräte-Token** (nicht das echte Admin-Passwort), unabhängig sperrbar.
- **Sound:** lauter, wiederholt sich alle ~4 s, solange ≥1 Bestellung „Ausstehend"
  ist; stoppt automatisch beim Bestätigen + „Ton aus"-Knopf.
- **Windows:** Auto-Login beim Booten (kein Anmeldebildschirm).
- **Browser:** Microsoft Edge (auf Win 11 vorinstalliert).

## Drei Teile

### 1. Code-Änderung am Dashboard (geht live über `main` → Vercel)

**a) Geräte-Login-Route** `app/api/admin/device/route.ts` (GET)
- Liest `?key=` aus der URL, vergleicht (timing-safe) mit `DASHBOARD_DEVICE_TOKEN`.
- Bei Treffer: setzt das vorhandene HMAC-`admin_session`-Cookie (7 Tage) und
  leitet auf `/admin` weiter → sofort angemeldet.
- Bei Fehlschlag: 401.
- Liegt unter `/api/admin/*`, wird also **nicht** von der Middleware blockiert
  (Middleware matcht nur `/admin/:path*`).
- Neue Helper-Funktion `verifyDeviceToken(key)` in `lib/admin-auth.ts`
  (nutzt das vorhandene `timingSafeEqual`). Token getrennt vom Passwort →
  Laptop-Verlust = nur `DASHBOARD_DEVICE_TOKEN` in Vercel neu setzen.

**b) Alarm-Sound** — Hook `components/admin/use-order-alarm.ts`
- `useOrderAlarm(pendingCount)` → `{ enabled, enable, muted, setMuted }`.
- AudioContext wird erst nach einer Nutzergeste erzeugt (`enable()`), umgeht den
  Browser-Autoplay-Schutz. Bis dahin zeigt das Dashboard ein großes Banner
  „🔔 Ton aktivieren" (einmal pro Schicht antippen).
- Klingelt (lauter Zweiton, Gain 0.6 statt 0.25) alle ~4 s, solange
  `pendingCount > 0 && !muted`.
- Steigt `pendingCount` (neue Bestellung), wird `muted` automatisch zurückgesetzt.
- `app/admin/page.tsx`: alte `playNewOrderChime()` entfällt, ersetzt durch den Hook;
  „Ton aus"-Knopf erscheint im Header während es klingelt.

**c)** `.env.local.example` um `DASHBOARD_DEVICE_TOKEN` erweitern.

### 2. Windows-Einrichtungs-Skript `restaurant-laptop/1-windows-setup.ps1`
Einmal als Administrator. Konfiguriert:
- Strom: nie Standby/Display-aus/Ruhezustand (AC+DC) via `powercfg`.
- Bildschirmschoner aus.
- Lautstärke auf Maximum + Unmute (SendKeys Volume-Up-Schleife).
- Windows-Auto-Login: Registry `AutoAdminLogon`/`DefaultUserName`/`DefaultPassword`
  (`HKLM\...\Winlogon`). Benutzer trägt Name+Passwort oben im Skript ein.
- Windows-Update-Aktivzeiten auf Öffnungszeiten.
- Legt die Autostart-Verknüpfung für Teil 3 in `shell:startup` an.

### 3. Kiosk-Autostart `restaurant-laptop/2-kiosk-launcher.cmd`
- Startet Edge: `--kiosk "<DEVICE-URL>" --edge-kiosk-type=fullscreen --no-first-run`.
- DEVICE-URL = `https://www.luma-pizza.de/api/admin/device?key=<TOKEN>`.
- Token trägt der Nutzer einmal im `.cmd` ein.

### Anleitung `restaurant-laptop/README.md`
Schritt-für-Schritt auf Deutsch: Token in Vercel anlegen, beide Werte eintragen,
Skripte ausführen, einmal „Ton aktivieren" antippen.

## Tests
- `__tests__/lib/admin-auth.test.ts`: `verifyDeviceToken` (Treffer, Fehlschlag,
  Token nicht gesetzt, leerer Key) + Session-Token-Roundtrip.
- `tsc --noEmit`, `jest`, `next build` müssen grün sein vor Push.

## Sicherheit / Abwägung
- Geräte-Token ist ein Bearer-Token in einer URL auf dem physischen Shop-Laptop —
  Trust-Level wie ein hinterlegtes Passwort, aber **revozierbar** und **gescoped**.
- Windows-Passwort liegt bei Auto-Login technisch bedingt in der Registry
  (Standard für Kassen-/Terminal-PCs) — bewusst akzeptiert.
