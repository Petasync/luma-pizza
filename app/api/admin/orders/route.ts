import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth'
import { Order } from '@/lib/types'

// Customer PII lives behind RLS now (migration 005). The admin dashboard reads
// orders through here: service-role access, gated by the admin session cookie.
export async function GET(req: NextRequest) {
  const valid = await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value)
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseServer()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders: (data ?? []) as Order[] })
}
