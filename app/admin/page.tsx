'use client'
import { useEffect, useMemo, useState } from 'react'
import { Order, OrderStatus } from '@/lib/types'
import StatsHeader from '@/components/admin/stats-header'
import RevenueChart from '@/components/admin/revenue-chart'
import OrderCard from '@/components/admin/order-card'
import { useOrderAlarm } from '@/components/admin/use-order-alarm'

type Filter = 'aktiv' | 'alle' | OrderStatus

const FILTER_LABELS: Record<Filter, string> = {
  aktiv: 'Aktiv',
  alle: 'Alle',
  pending: 'Ausstehend',
  confirmed: 'Bestätigt',
  preparing: 'Zubereitung',
  ready: 'Fertig',
  delivered: 'Abgeschlossen',
}

const POLL_INTERVAL_MS = 10_000
// Vorwarnung vor Ablauf der Geräte-Anmeldung: reicht, einmal pro Stunde zu
// prüfen (die Geräte-Anmeldung ist auf 1 Jahr gültig, das ändert sich nicht
// schnell) — anders als das 10-Sekunden-Polling der Bestellungen.
const SESSION_STATUS_INTERVAL_MS = 60 * 60 * 1000
// Ab wie vielen Tagen vor Ablauf gewarnt wird — genug Vorlauf, damit jemand
// in Ruhe den Kiosk-Laptop einmal neu starten kann.
const DEVICE_WARNING_THRESHOLD_DAYS = 14

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('aktiv')
  /**
   * Warum das wichtig ist: Bis zum 26.07.2026 wurde ein Abrufversagen hier
   * stillschweigend verschluckt (`if (!res.ok) return`). Als die Sitzung des
   * Terminals nach 7 Tagen ablief, lieferte der Server nur noch 401 — die Seite
   * sah aber völlig normal aus und zeigte weiter die alte Liste. Neue
   * Bestellungen kamen nie an und niemand konnte es sehen. Deshalb wird ein
   * anhaltender Fehler jetzt groß angezeigt UND vertont.
   */
  const [stoerung, setStoerung] = useState<string | null>(null)
  // Vorwarnung vor Ablauf der Geräte-Anmeldung (siehe /api/admin/session-status) —
  // null = unbekannt/nicht betroffen (kein Kiosk-Gerät angemeldet).
  const [deviceExpiresInDays, setDeviceExpiresInDays] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    async function pruefeAblauf() {
      try {
        const res = await fetch('/api/admin/session-status', { cache: 'no-store' })
        if (!res.ok || !active) return
        const { deviceExpiresInDays: tage } = (await res.json()) as { deviceExpiresInDays: number | null }
        if (active) setDeviceExpiresInDays(tage)
      } catch {
        /* Kein Grund zur Sorge machen, wenn diese Nebenprüfung selbst scheitert —
           das Haupt-Polling unten meldet echte Ausfälle ohnehin lautstark. */
      }
    }

    pruefeAblauf()
    const interval = setInterval(pruefeAblauf, SESSION_STATUS_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    // Orders carry customer PII, so they're behind RLS — we poll the
    // admin-only API route instead of reading Supabase from the browser.
    let active = true

    async function hole(): Promise<Response> {
      return fetch('/api/admin/orders', { cache: 'no-store' })
    }

    async function load() {
      try {
        let res = await hole()

        // Sitzung abgelaufen? Das Terminal erneuert sie über sein Geräte-Cookie
        // selbst und versucht es genau einmal erneut.
        if (res.status === 401) {
          const erneuert = await fetch('/api/admin/refresh', { method: 'POST' })
          if (erneuert.ok) {
            res = await hole()
          } else if (active) {
            setStoerung('Das Terminal ist nicht mehr angemeldet. Bitte den Laptop neu starten.')
            setLoading(false)
            return
          }
        }

        if (!res.ok) {
          if (active) {
            setStoerung(`Bestellungen konnten nicht geladen werden (Fehler ${res.status}).`)
            setLoading(false)
          }
          return
        }

        const { orders: fetched } = (await res.json()) as { orders: Order[] }
        if (!active) return

        setOrders(fetched)
        setStoerung(null)
        setLoading(false)
      } catch {
        if (active) {
          setStoerung('Keine Verbindung zum Server. Internet prüfen.')
          setLoading(false)
        }
      }
    }

    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const filteredOrders = useMemo(() => {
    if (filter === 'aktiv') return orders.filter(o => o.status !== 'delivered')
    if (filter === 'alle') return orders
    return orders.filter(o => o.status === filter)
  }, [orders, filter])

  const counts = useMemo(() => ({
    aktiv: orders.filter(o => o.status !== 'delivered').length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  }), [orders])

  // Audible alarm for the terminal — rings while orders await confirmation
  // und ebenso, solange keine Bestellungen abgerufen werden können.
  const alarm = useOrderAlarm(counts.pending, stoerung !== null)

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-cream-100">
        <p className="text-charcoal-500 text-sm">Daten werden geladen …</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cream-100 p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Störung: darf man nicht übersehen können. Vorher fiel genau dieser
            Fall komplett stumm aus — die Seite sah normal aus, war aber blind. */}
        {stoerung && (
          <div
            role="alert"
            className="mb-6 bg-wine-600 text-cream-50 px-6 py-6 border-4 border-wine-700 animate-pulse"
          >
            <p className="text-sm uppercase tracking-widest font-semibold mb-2">
              ⚠ Achtung — keine Verbindung zu den Bestellungen
            </p>
            <p className="text-lg leading-snug">{stoerung}</p>
            <p className="text-sm mt-3 text-cream-100/90">
              Solange dieser Balken zu sehen ist, werden <strong>keine neuen Bestellungen angezeigt</strong>.
              Bitte telefonisch erreichbar bleiben und Phillip Bescheid geben.
            </p>
          </div>
        )}

        {/* Vorwarnung, BEVOR die Geräte-Anmeldung abläuft — bewusst ruhiger
            gestaltet als die rote Störung oben, damit man beides klar
            auseinanderhalten kann. */}
        {!stoerung && deviceExpiresInDays !== null && deviceExpiresInDays <= DEVICE_WARNING_THRESHOLD_DAYS && (
          <div role="status" className="mb-6 bg-gold-500/20 border-2 border-gold-600 text-charcoal-900 px-6 py-4">
            <p className="text-sm font-semibold">
              ⚠ Hinweis — Anmeldung läuft bald ab
            </p>
            <p className="text-sm mt-1">
              {deviceExpiresInDays <= 0
                ? 'Die Geräte-Anmeldung dieses Terminals läuft heute ab.'
                : `Die Geräte-Anmeldung dieses Terminals läuft in ${deviceExpiresInDays} Tagen ab.`}{' '}
              Bitte den Laptop bei Gelegenheit einmal neu starten — danach verlängert sie sich automatisch um ein weiteres Jahr.
            </p>
          </div>
        )}

        {/* Tap-once banner to unlock audio (browsers block sound until a gesture). */}
        {!alarm.enabled && (
          <button
            onClick={alarm.enable}
            className="w-full mb-6 bg-charcoal-900 text-cream-50 py-5 px-6 flex items-center justify-center gap-3 hover:bg-charcoal-800 transition-colors"
          >
            <span className="text-2xl">🔔</span>
            <span className="text-sm uppercase tracking-widest font-medium">
              Ton aktivieren — einmal antippen
            </span>
          </button>
        )}

        {/* Header */}
        <header className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="eyebrow mb-2">Restaurant-Dashboard</p>
            <h1 className="heading-serif text-4xl">Bestellungen.</h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-charcoal-500">
            {alarm.enabled && !alarm.muted && (counts.pending > 0 || stoerung) && (
              <button
                onClick={() => alarm.setMuted(true)}
                className="flex items-center gap-2 bg-wine-600 text-cream-50 px-3 py-2 uppercase tracking-widest text-[11px] font-medium hover:bg-wine-700 transition-colors animate-pulse"
              >
                🔕 Ton aus
              </button>
            )}
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></span>
              Aktualisiert automatisch
            </span>
          </div>
        </header>

        {/* Stats */}
        <div className="mb-8">
          <StatsHeader orders={orders} />
        </div>

        {/* Chart + active summary */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RevenueChart orders={orders} />
          </div>
          <div className="bg-charcoal-900 text-cream-50 p-6">
            <p className="text-[10px] uppercase tracking-widest text-gold-400 mb-4">Aktive Bestellungen</p>
            <div className="space-y-3">
              {([
                ['Ausstehend', counts.pending, 'bg-cream-200/20'],
                ['Bestätigt', counts.confirmed, 'bg-cream-200/20'],
                ['In Zubereitung', counts.preparing, 'bg-gold-500/25'],
                ['Fertig', counts.ready, 'bg-wine-600/30'],
              ] as const).map(([label, count, cls]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-cream-100/80">{label}</span>
                  <span className={`font-serif text-lg w-10 text-center ${cls}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 border-b border-charcoal-900/10">
          {(['aktiv', 'pending', 'confirmed', 'preparing', 'ready', 'alle'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-3 text-xs uppercase tracking-widest font-medium transition-colors relative ${
                filter === f ? 'text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-900'
              }`}
            >
              {FILTER_LABELS[f]}
              {filter === f && (
                <span className="absolute bottom-0 left-2 right-2 h-px bg-gold-500" />
              )}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {filteredOrders.length === 0 ? (
          <div className="bg-cream-50 border border-charcoal-900/10 py-16 text-center">
            <p className="text-charcoal-500 text-sm">Keine Bestellungen in dieser Ansicht.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={s => setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: s, status_changed_at: new Date().toISOString() } : o))}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
