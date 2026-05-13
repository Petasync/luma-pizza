import { Order, OrderStatus } from './types'

export type Priority = 'normal' | 'attention' | 'urgent'

// Max minutes per status before order is flagged as urgent.
const URGENT_THRESHOLDS: Record<OrderStatus, number> = {
  pending: 5,      // unconfirmed > 5 min = urgent
  confirmed: 8,    // confirmed but not in prep > 8 min = urgent
  preparing: 30,   // in prep > 30 min = urgent (typical pizza ~20)
  ready: 15,       // sitting ready > 15 min (delivery driver late?)
  delivered: 9999,
}
const ATTENTION_THRESHOLDS: Record<OrderStatus, number> = {
  pending: 3,
  confirmed: 5,
  preparing: 20,
  ready: 8,
  delivered: 9999,
}

export function minutesSince(iso: string, now: number = Date.now()): number {
  return Math.floor((now - new Date(iso).getTime()) / 60000)
}

export function getPriority(order: Order, now: number = Date.now()): Priority {
  if (order.status === 'delivered') return 'normal'
  const mins = minutesSince(order.status_changed_at ?? order.created_at, now)
  if (mins >= URGENT_THRESHOLDS[order.status]) return 'urgent'
  if (mins >= ATTENTION_THRESHOLDS[order.status]) return 'attention'
  return 'normal'
}

export function formatMinutes(mins: number): string {
  if (mins < 1) return 'gerade eben'
  if (mins === 1) return '1 min'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}min`
}

export function calcAvgPrepTime(orders: Order[]): number | null {
  const completed = orders.filter(o => o.status === 'delivered')
  if (completed.length === 0) return null
  const totalMins = completed.reduce((sum, o) => {
    return sum + minutesSince(o.created_at, new Date(o.status_changed_at ?? o.created_at).getTime())
  }, 0)
  return Math.round(totalMins / completed.length)
}

export function ordersToday(orders: Order[]): Order[] {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const startTs = startOfDay.getTime()
  return orders.filter(o => new Date(o.created_at).getTime() >= startTs)
}

export function revenueByHour(orders: Order[]): { hour: number; total: number }[] {
  const buckets: Record<number, number> = {}
  for (let h = 0; h < 24; h++) buckets[h] = 0
  for (const o of orders) {
    const h = new Date(o.created_at).getHours()
    buckets[h] += Number(o.total_price)
  }
  return Object.entries(buckets).map(([h, total]) => ({ hour: Number(h), total }))
}
