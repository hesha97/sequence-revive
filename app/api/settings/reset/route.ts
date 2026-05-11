// POST /api/settings/reset — deletes prospects, campaigns, campaign_prospects, replies
// for the operator's org. Order: replies → campaign_prospects → campaigns → prospects.
// Leaves the org + clients + brain intact so onboarding doesn't have to repeat.
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

  const errors: string[] = []
  const repliesRes = await admin.from('replies').delete().eq('organization_id', orgId)
  if (repliesRes.error) errors.push(`replies: ${repliesRes.error.message}`)

  const cpRes = await admin.from('campaign_prospects').delete().eq('organization_id', orgId)
  if (cpRes.error) errors.push(`campaign_prospects: ${cpRes.error.message}`)

  const campRes = await admin.from('campaigns').delete().eq('organization_id', orgId)
  if (campRes.error) errors.push(`campaigns: ${campRes.error.message}`)

  const prosRes = await admin.from('prospects').delete().eq('organization_id', orgId)
  if (prosRes.error) errors.push(`prospects: ${prosRes.error.message}`)

  if (errors.length > 0) {
    return NextResponse.json({ error: 'partial_reset', details: errors }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
