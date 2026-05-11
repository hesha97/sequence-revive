// POST /api/settings/reset — deletes all prospects, campaigns, campaign_prospects,
// replies for the operator's org. Leaves the org + clients + brain intact.
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
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 500 })

  // CASCADE will take care of campaign_prospects + replies when campaigns + prospects go.
  await admin.from('campaigns').delete().eq('organization_id', orgId)
  await admin.from('prospects').delete().eq('organization_id', orgId)

  return NextResponse.json({ ok: true })
}
