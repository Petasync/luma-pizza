import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { OrderStatus } from '@/lib/types'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

// GET: Status-Endpoint für den Live-Tracker auf der Bestellbestätigungsseite.
// Schutz = die UUID selbst (unguessable, 10^36 Möglichkeiten). Gibt nur das
// raus, was die Trackeranzeige braucht — keine zusätzliche PII.
export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .select('status, status_changed_at, type, created_at')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // Only the restaurant may move an order through its lifecycle.
  const valid = await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value)
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { status } = await req.json()
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const supabase = createSupabaseServer()
  const { error } = await supabase
    .from('orders')
    .update({ status, status_changed_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
