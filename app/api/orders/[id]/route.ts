import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { OrderStatus } from '@/lib/types'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
