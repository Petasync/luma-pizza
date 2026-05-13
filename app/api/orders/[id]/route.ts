import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { OrderStatus } from '@/lib/types'

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
