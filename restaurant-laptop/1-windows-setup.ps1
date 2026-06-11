<#
================================================================================
  Luma Pizza – Bestell-Terminal Einrichtung (HP Laptop, Windows 11)
================================================================================
  Macht aus dem Laptop ein Bestell-Terminal:
    - geht nie in Standby / Display bleibt an / kein Ruhezustand
    - kein Bildschirmschoner
    - Lautstaerke auf Maximum + Stummschaltung aus
    - Windows-Auto-Login (kein Anmeldebildschirm beim Einschalten)
    - Windows-Update startet nicht waehrend der Oeffnungszeiten neu
    - Edge oeffnet beim Hochfahren automatisch das Dashboard (Kiosk-Vollbild)

  ANLEITUNG:
    1. Unten die drei Werte zwischen den >>> <<< ausfuellen.
    2. Diese Datei mit RECHTSKLICK > "Mit PowerShell ausfuehren" starten.
       (Falls eine Sicherheitsfrage kommt: bestaetigen / "Ja".)
    3. Laptop neu starten – fertig.
================================================================================
#>

# >>> HIER AUSFUELLEN >>>------------------------------------------------------

# Windows-Benutzername (steht z.B. unter Einstellungen > Konten, oder C:\Benutzer\<NAME>)
$WindowsUser     = "HIER-WINDOWS-BENUTZERNAME"

# Windows-Anmeldepasswort dieses Benutzers (fuer den Auto-Login).
# Hat der Benutzer kein Passwort, "" leer lassen.
$WindowsPassword = "HIER-WINDOWS-PASSWORT"

# Oeffnungszeiten fuer Windows-Update (verhindert Neustart waehrend des Betriebs).
# 24-Stunden-Format. Beispiel: 10 Uhr bis 23 Uhr.
$AktivVon = 10
$AktivBis = 23

# <<< ENDE AUSFUELLEN <<<------------------------------------------------------


# --- Adminrechte sicherstellen -----------------------------------------------
$istAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $istAdmin) {
    Write-Host "Starte mit Administratorrechten neu..." -ForegroundColor Yellow
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "`n=== Luma Pizza Terminal-Einrichtung ===`n" -ForegroundColor Cyan

# --- 1. Energie: nie schlafen, Display immer an ------------------------------
Write-Host "[1/6] Energieeinstellungen (nie Standby, Display bleibt an)..."
powercfg /change standby-timeout-ac 0
powercfg /change standby-timeout-dc 0
powercfg /change monitor-timeout-ac 0
powercfg /change monitor-timeout-dc 0
powercfg /change hibernate-timeout-ac 0
powercfg /change hibernate-timeout-dc 0
powercfg /change disk-timeout-ac 0
powercfg /change disk-timeout-dc 0
powercfg /hibernate off 2>$null
# Deckel zuklappen tut nichts (Laptop laeuft im Betrieb evtl. zugeklappt weiter)
powercfg /setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setdcvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setactive SCHEME_CURRENT

# --- 2. Bildschirmschoner aus ------------------------------------------------
Write-Host "[2/6] Bildschirmschoner deaktivieren..."
Set-ItemProperty "HKCU:\Control Panel\Desktop" -Name ScreenSaveActive -Value "0" -ErrorAction SilentlyContinue
Set-ItemProperty "HKCU:\Control Panel\Desktop" -Name ScreenSaveTimeOut -Value "0" -ErrorAction SilentlyContinue

# --- 3. Lautstaerke auf Maximum + Unmute -------------------------------------
Write-Host "[3/6] Lautstaerke auf Maximum, Stummschaltung aus..."
$wsh = New-Object -ComObject WScript.Shell
# Erst sicher entstummen (Mute-Taste toggelt – daher zweimal um definiert laut zu landen),
# dann 50x lauter (jede Stufe = 2 %, deckt den ganzen Bereich ab).
1..50 | ForEach-Object { $wsh.SendKeys([char]175) }  # Volume Up
# Unmute, falls stummgeschaltet (174=Down, 175=Up, 173=Mute-Toggle)
# Wir druecken Mute nicht – stattdessen garantiert lautes Hochregeln oben.

# --- 4. Windows-Auto-Login ---------------------------------------------------
Write-Host "[4/6] Windows-Auto-Login einrichten..."
$winlogon = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
if ($WindowsUser -eq "HIER-WINDOWS-BENUTZERNAME") {
    Write-Host "   ! Benutzername nicht ausgefuellt – Auto-Login uebersprungen." -ForegroundColor Yellow
} else {
    Set-ItemProperty $winlogon -Name AutoAdminLogon  -Value "1"            -Type String
    Set-ItemProperty $winlogon -Name DefaultUserName -Value $WindowsUser   -Type String
    Set-ItemProperty $winlogon -Name DefaultPassword -Value $WindowsPassword -Type String
    # Domaene leeren (lokales Konto)
    Set-ItemProperty $winlogon -Name DefaultDomainName -Value $env:COMPUTERNAME -Type String
    Write-Host "   Auto-Login fuer '$WindowsUser' aktiv."
}

# --- 5. Windows-Update-Aktivzeiten -------------------------------------------
Write-Host "[5/6] Windows-Update-Aktivzeiten ($AktivVon-$AktivBis Uhr)..."
$wu = "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings"
if (-not (Test-Path $wu)) { New-Item -Path $wu -Force | Out-Null }
Set-ItemProperty $wu -Name ActiveHoursStart -Value $AktivVon -Type DWord
Set-ItemProperty $wu -Name ActiveHoursEnd   -Value $AktivBis -Type DWord

# --- 6. Kiosk-Autostart verknuepfen ------------------------------------------
Write-Host "[6/6] Autostart fuer das Dashboard einrichten..."
$startupDir = [Environment]::GetFolderPath('Startup')
$launcher   = Join-Path $PSScriptRoot "2-kiosk-launcher.cmd"
if (-not (Test-Path $launcher)) {
    Write-Host "   ! 2-kiosk-launcher.cmd nicht gefunden neben diesem Skript." -ForegroundColor Yellow
} else {
    $lnkPath = Join-Path $startupDir "Luma-Dashboard.lnk"
    $sh = New-Object -ComObject WScript.Shell
    $lnk = $sh.CreateShortcut($lnkPath)
    $lnk.TargetPath = $launcher
    $lnk.WorkingDirectory = $PSScriptRoot
    $lnk.Description = "Luma Pizza Dashboard (Kiosk)"
    $lnk.Save()
    Write-Host "   Autostart-Verknuepfung angelegt."
}

Write-Host "`n=== Fertig! ===" -ForegroundColor Green
Write-Host "Bitte den Laptop jetzt NEU STARTEN. Danach oeffnet sich das"
Write-Host "Dashboard automatisch. Einmal auf '🔔 Ton aktivieren' tippen."
Write-Host ""
Read-Host "Mit ENTER schliessen"
