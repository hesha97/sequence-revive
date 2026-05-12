// POST /api/voice/rebuild — clears the operator's brain so onboarding runs fresh.
// Preserves the client row (so prospect/campaign FKs survive) but wipes brain
// to null. Caller is expected to redirect to /onboarding.
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
  const row = memberRows?.[0]
  if (!row) return NextResponse.json({ error: 'No organization' }, { status: 500 })
  if (row.role !== 'owner') {
    return NextResponse.json({ error: 'Owner only' }, { status: 403 })
  }

  const { error: updateErr } = await admin
    .from('clients')
    .update({ brain: null })
    .eq('organization_id', row.organization_id)
  if (updateErr) {
    return NextResponse.json(
      { error: 'clear_failed', message: updateErr.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
