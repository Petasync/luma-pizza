---
name: neue-migration
description: Neue Supabase-Migration korrekt anlegen (Nummerierung + APPLY_IN_SUPABASE.sql). Nutzen bei: Migration, Datenbank-Änderung, Schema-Änderung.
---

# Neue Supabase-Migration anlegen

Jede Migration lebt an **zwei Stellen** — beide müssen gepflegt werden, sonst
läuft die Sammeldatei und der Migrationsordner auseinander.

## Vorgehen

1. **Höchste Nummer finden:**
   `supabase/migrations/` ansehen — Dateien heißen `NNN_beschreibung.sql`
   (dreistellig, snake_case, deutsch), z. B. `006_zahlung_absichern.sql`.
   Die neue Datei bekommt die nächste freie Nummer.

2. **Migrationsdatei anlegen:**
   `supabase/migrations/NNN_beschreibung.sql` mit sprechendem Namen.
   SQL **idempotent** schreiben (gefahrlos wiederholbar), wie die bestehenden
   Migrationen: `create table if not exists`, `create index if not exists`,
   `alter table … add column if not exists`, `drop policy if exists`.

3. **Denselben SQL-Block in die Sammeldatei einpflegen:**
   Ans Ende von `supabase/APPLY_IN_SUPABASE.sql` anhängen, mit
   Abschnitts-Kommentar im bestehenden Stil:
   `-- ---- NNN: Kurzbeschreibung ----`
   Der Kopfkommentar der Datei dokumentiert, welche Migrationen bereits
   direkt angewendet wurden — bei Bedarf mitpflegen. Die Datei wird von
   Menschen komplett in den Supabase SQL Editor kopiert und ausgeführt,
   deshalb ist Idempotenz Pflicht.

4. **RLS bei neuen Tabellen — immer:**
   Row Level Security aktivieren und nur der Service-Rolle Zugriff geben.
   Muster aus den bestehenden Migrationen übernehmen
   (`001_orders.sql`: Policy "service role full access";
   `005_lock_down_rls.sql`: anon-Policies entfernt — der anon-Key darf
   **keine** Kundendaten lesen). Ohne explizite Policy für `service_role`
   und ohne anon-Zugriff ist der sichere Grundzustand.

5. **Kontrolle:** Nach dem Anwenden im Dashboard prüfen, z. B.
   `select policyname from pg_policies where tablename = '<tabelle>';`

## Merksatz

Neue Migration = neue Datei mit nächster Nummer **UND** Block in
`APPLY_IN_SUPABASE.sql`. Eines von beiden allein ist ein Fehler.
