// POST /api/sequences/save-edit
// Writes inline edits back to campaign_prospects.generated_emails.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let body: { campaignProspectId?: string; sequence?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  if (!body.campaignProspectId || !body.sequence) {
    return NextResponse.json({ error: 'campaignProspectId and sequence required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 500 })

  // Confirm the campaign_prospect belongs to a campaign in this org
  const { data: cp } = await admin
    .from('campaign_prospects')
    .select('id, campaign_id')
    .eq('id', body.campaignProspectId)
    .single()
  if (!cp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: camp } = await admin
    .from('campaigns')
    .select('organization_id')
    .eq('id', cp.campaign_id)
    .single()
  if (!camp || camp.organization_id !== orgId) {
    return NextResponse.json({ error: 'Wrong org' }, { status: 403 })
  }

  await admin
    .from('campaign_prospects')
    .update({ generated_emails: body.sequence })
    .eq('id', cp.id)

  return NextResponse.json({ ok: true })
}
