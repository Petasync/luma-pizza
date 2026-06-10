@echo off
REM ============================================================================
REM  Luma Pizza – Dashboard im Kiosk-Vollbild oeffnen
REM  Wird vom Windows-Autostart bei jedem Hochfahren gestartet.
REM ============================================================================
REM
REM  HIER den Geraete-Token eintragen (denselben Wert wie DASHBOARD_DEVICE_TOKEN
REM  in Vercel). Den Teil  HIER-GERAETE-TOKEN  ersetzen, Anfuehrungszeichen weg.
REM ============================================================================

set "TOKEN=HIER-GERAETE-TOKEN"
set "URL=https://www.luma-pizza.de/api/admin/device?key=%TOKEN%"

REM Kurz warten, bis Netzwerk/WLAN nach dem Boot bereit ist
timeout /t 8 /nobreak >nul

REM Edge im Kiosk-Vollbild starten (nur Dashboard, keine Adressleiste/Tabs).
start msedge --kiosk "%URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-features=Translate
