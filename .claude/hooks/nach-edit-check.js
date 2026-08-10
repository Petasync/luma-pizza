#!/usr/bin/env node
/**
 * Nach-Edit-Prüfung (PostToolUse-Hook für Edit|Write).
 *
 * Reagiert nur auf .ts/.tsx-Dateien und führt dann aus:
 *   1. npx tsc --noEmit   (Typecheck, ganzes Projekt)
 *   2. npm run lint       (next lint — echter Lint-Befehl aus package.json)
 *
 * Fehler gehen über stderr + Exit-Code 2 zurück an Claude, damit sie
 * sofort behoben werden. Alles andere: Exit 0 (still).
 *
 * CommonJS (require), weil package.json kein "type":"module" hat.
 */
const { execSync } = require('child_process')
const { existsSync } = require('fs')
const { join } = require('path')

let eingabe = ''
process.stdin.on('data', chunk => (eingabe += chunk))
process.stdin.on('end', () => {
  let daten
  try {
    daten = JSON.parse(eingabe)
  } catch {
    process.exit(0) // Keine lesbare Eingabe — nichts zu prüfen.
  }

  const pfad = (daten.tool_input && daten.tool_input.file_path) || ''
  if (!/\.(ts|tsx)$/i.test(pfad)) {
    process.exit(0) // Nur TypeScript-Dateien prüfen.
  }

  const wurzel = daten.cwd || process.cwd()

  const schritte = [['Typecheck', 'npx tsc --noEmit']]

  // next lint wird ohne ESLint-Konfig INTERAKTIV (Einrichtungs-Dialog) und
  // würde den Hook bis zum Timeout blockieren — deshalb nur linten, wenn
  // eine Konfig vorhanden ist.
  const eslintKonfig = ['.eslintrc.json', '.eslintrc.js', 'eslint.config.js', 'eslint.config.mjs']
  if (eslintKonfig.some(k => existsSync(join(wurzel, k)))) {
    schritte.push(['Lint', 'npm run lint'])
  }

  const fehler = []
  for (const [name, befehl] of schritte) {
    try {
      execSync(befehl, { cwd: wurzel, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' })
    } catch (e) {
      const ausgabe = [e.stdout, e.stderr].filter(Boolean).join('\n').trim()
      fehler.push(`${name} fehlgeschlagen (${befehl}):\n${ausgabe}`)
    }
  }

  if (fehler.length > 0) {
    process.stderr.write(fehler.join('\n\n'))
    process.exit(2)
  }
  process.exit(0)
})
