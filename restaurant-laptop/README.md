# Luma Pizza – Bestell-Terminal (HP Laptop) einrichten

Macht den HP-Laptop zum Bestell-Terminal: einschalten → Windows startet ohne
Passwort → Edge öffnet im Vollbild automatisch das Dashboard, **angemeldet** →
bei jeder neuen Bestellung **klingelt es laut**, bis die Bestellung bestätigt wird.

Es gibt **zwei Geheimnisse**, die du einmal einträgst:
1. **Geräte-Token** – damit das Dashboard sich automatisch anmeldet.
2. **Windows-Passwort** – damit Windows ohne Anmeldebildschirm hochfährt.

---

## Schritt 1 – Geräte-Token in Vercel anlegen (einmalig, am normalen PC)

Der Token ist ein langes, geheimes Zufallswort. So legst du ihn an:

1. Token erzeugen: irgendeine lange zufällige Zeichenkette, z. B. in PowerShell:
   ```powershell
   -join ((48..57) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
   ```
   Das ausgegebene Wort kopieren (Beispiel: `k7f2p9x...`).
2. Auf **vercel.com** einloggen → Projekt **luma-pizza** → **Settings** →
   **Environment Variables**.
3. Neue Variable anlegen:
   - **Name:** `DASHBOARD_DEVICE_TOKEN`
   - **Value:** das erzeugte Wort
   - **Environments:** Production (und gern Preview)
4. **Save**. Dann unter **Deployments** das neueste Deployment **Redeploy**en,
   damit der Token aktiv wird.

> Diesen Token-Wert brauchst du gleich in Schritt 3 nochmal. Notiere ihn dir kurz.

---

## Schritt 2 – Beide Dateien auf den HP-Laptop kopieren

Den ganzen Ordner `restaurant-laptop` (mit `1-windows-setup.ps1` und
`2-kiosk-launcher.cmd`) z. B. per USB-Stick auf den **Desktop** des HP-Laptops kopieren.

---

## Schritt 3 – Werte eintragen (auf dem HP-Laptop)

**a)** Die Vorlage **`2-kiosk-launcher.cmd.example`** kopieren und die Kopie in
**`2-kiosk-launcher.cmd`** umbenennen (also `.example` am Ende entfernen).
Diese Kopie mit Rechtsklick → *Bearbeiten* öffnen und die Zeile
```
set "TOKEN=HIER-GERAETE-TOKEN"
```
ändern in deinen Token aus Schritt 1, z. B.:
```
set "TOKEN=k7f2p9x..."
```
Speichern, schließen.

> Warum die Kopie? Die echte `2-kiosk-launcher.cmd` mit dem Token wird bewusst
> **nicht** zu GitHub hochgeladen (steht in `.gitignore`), damit dein Token
> geheim bleibt. Im Repo liegt nur die `.example`-Vorlage mit Platzhalter.

**b) `1-windows-setup.ps1`** mit Rechtsklick → *Bearbeiten* öffnen und oben
ausfüllen:
```powershell
$WindowsUser     = "DeinWindowsBenutzername"
$WindowsPassword = "DeinWindowsPasswort"
$AktivVon = 10   # Öffnung
$AktivBis = 23   # Schließung
```
> Den Windows-Benutzernamen siehst du als Ordnername unter `C:\Benutzer\`.
> Hat das Konto kein Passwort, `$WindowsPassword = ""` leer lassen.

Speichern, schließen.

---

## Schritt 4 – Einrichtung starten

`1-windows-setup.ps1` per **Rechtsklick → „Mit PowerShell ausführen"** starten.
- Kommt eine Sicherheitsabfrage (Benutzerkontensteuerung): **Ja**.
- Kommt „… kann nicht geladen werden, da die Ausführung von Skripts deaktiviert
  ist", dann stattdessen so starten: Startmenü → *PowerShell* → Rechtsklick →
  *Als Administrator* → Befehl:
  ```powershell
  Set-ExecutionPolicy -Scope Process Bypass -Force; & "$HOME\Desktop\restaurant-laptop\1-windows-setup.ps1"
  ```

Das Skript stellt alles ein und legt den Autostart an.

---

## Schritt 5 – Neu starten & Ton aktivieren

Laptop **neu starten**. Er fährt ohne Anmeldung hoch, Edge öffnet das Dashboard
im Vollbild und ist angemeldet.

**Einmal pro Schicht** oben auf das schwarze Feld **„🔔 Ton aktivieren"** tippen.
Das ist nötig, weil Browser Ton erst nach einer Berührung erlauben — technisch
nicht umgehbar. Danach klingelt jede neue Bestellung laut, bis sie bestätigt wird.
Mit **„🔕 Ton aus"** (rot, oben rechts) lässt sich die aktuelle Runde stummschalten;
die nächste neue Bestellung klingelt wieder.

---

## Gut zu wissen

- **Kiosk verlassen** (z. B. für Wartung): `Strg` + `Alt` + `Entf` → Abmelden,
  oder `Alt` + `F4`.
- **Token sperren** (Laptop verloren/gestohlen): in Vercel `DASHBOARD_DEVICE_TOKEN`
  auf einen neuen Wert ändern + redeploy. Der alte Laptop ist sofort ausgesperrt;
  dein Admin-Passwort bleibt unberührt.
- **Ton zu leise/laut?** Die Wiederhol-Lautstärke steckt im Code
  (`components/admin/use-order-alarm.ts`, `gain ... 0.6`) — kann angepasst werden.
- Der Laptop bleibt dauerhaft an (kein Standby). Das ist Absicht für ein Terminal.
