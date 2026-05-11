// POST /api/sequences/activate
// Flips the draft campaign to status='ready_to_send'. NO Lemlist API call.
// Sending Stage Doctrine — Push 1-4 stops here.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let body: { campaignId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  if (!body.campaignId) {
    return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 500 })

  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, organization_id, status')
    .eq('id', body.campaignId)
    .single()
  if (!campaign || campaign.organization_id !== orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Confirm we have prospects + every one is ready + every one has the 6-touch sequence saved.
  const { data: cps } = await admin
    .from('campaign_prospects')
    .select('id, generation_status, generated_emails')
    .eq('campaign_id', campaign.id)

  if (!cps || cps.length === 0) {
    return NextResponse.json(
      { error: 'empty_campaign', message: 'No prospects in this campaign yet.' },
      { status: 400 }
    )
  }

  const notReady = cps.filter((c) => c.generation_status !== 'ready')
  if (notReady.length > 0) {
    return NextResponse.json(
      { error: 'not_ready', message: `${notReady.length} prospect(s) still pending or failed` },
      { status: 400 }
    )
  }

  // Each generated_emails must include the 6 sequence steps.
  const REQUIRED_STEPS = [
    'step1_visit',
    'step2_invite',
    'step3_email1',
    'step4_email2',
    'step5_conditional',
    'step6_breakup',
  ] as const
  const incomplete = cps.filter((c) => {
    const seq = c.generated_emails as Record<string, unknown> | null
    if (!seq) return true
    return REQUIRED_STEPS.some((step) => !seq[step])
  })
  if (incomplete.length > 0) {
    return NextResponse.json(
      {
        error: 'incomplete_sequence',
        message: `${incomplete.length} prospect(s) missing one or more sequence steps`,
      },
      { status: 400 }
    )
  }

  // Flip campaign to ready_to_send. Sending Stage will read these later.
  await admin
    .from('campaigns')
    .update({
      status: 'ready_to_send',
      // Explicitly NOT setting lemlist_campaign_id — Sending Stage Doctrine.
    })
    .eq('id', campaign.id)
    .eq('organization_id', orgId)

  return NextResponse.json({ ok: true, campaignId: campaign.id })
}
