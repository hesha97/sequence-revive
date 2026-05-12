// GET /api/debug/logs — owner-only. Returns last 20 usage_events for the org.
// Used by the Settings Debug panel to prove the app is doing real work.
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('role, organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const row = memberRows?.[0]
  if (!row) return NextResponse.json({ error: 'No organization' }, { status: 500 })
  if (row.role !== 'owner') {
    return NextResponse.json({ error: 'Owner only' }, { status: 403 })
  }

  const { data: events } = await admin
    .from('usage_events')
    .select('event_type, cost_credits, cost_usd, metadata, created_at')
    .eq('organization_id', row.organization_id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ events: events ?? [] })
}
