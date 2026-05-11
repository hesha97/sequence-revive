// GET /api/prospects/enrich/[id]
// On-tap enrichment of a single prospect via Lemlist /api/leads/{leadId}.
// Updates email/phone/linkedin on the prospects row. Logs a usage_event.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LEMLIST_BASE = 'https://api.lemlist.com/api'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) {
    return NextResponse.json({ error: 'No organization' }, { status: 500 })
  }

  // Load the prospect, confirm it belongs to this org
  const { data: prospect } = await admin
    .from('prospects')
    .select('id, lemlist_lead_id, email')
    .eq('id', params.id)
    .eq('organization_id', orgId)
    .single()
  if (!prospect || !prospect.lemlist_lead_id) {
    return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
  }

  const key = process.env.LEMLIST_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  const token = Buffer.from(`:${key}`).toString('base64')

  let upstream: Response
  try {
    upstream = await fetch(`${LEMLIST_BASE}/leads/${prospect.lemlist_lead_id}`, {
      headers: { Authorization: `Basic ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    })
  } catch (e) {
    return NextResponse.json(
      { error: 'lemlist_unreachable', message: (e as Error).message },
      { status: 502 }
    )
  }
  if (!upstream.ok) {
    const errBody = await upstream.text()
    return NextResponse.json(
      { error: `lemlist_${upstream.status}`, message: errBody.slice(0, 400) },
      { status: 502 }
    )
  }

  const lead = await upstream.json() as {
    email?: string
    phone?: string
    linkedinUrl?: string
    firstName?: string
    lastName?: string
    companyName?: string
    title?: string
  }

  await admin
    .from('prospects')
    .update({
      email: lead.email ?? null,
      linkedin_url: lead.linkedinUrl ?? null,
      first_name: lead.firstName ?? null,
      last_name: lead.lastName ?? null,
      company_name: lead.companyName ?? null,
      job_title: lead.title ?? null,
    })
    .eq('id', prospect.id)
    .eq('organization_id', orgId)

  // Log a usage event if a new email was added
  if (lead.email && !prospect.email) {
    await admin.from('usage_events').insert({
      organization_id: orgId,
      event_type: 'email_find',
      cost_credits: 1,
      cost_usd: 0,
      metadata: { prospect_id: prospect.id, source: 'lemlist' },
    })
  }

  return NextResponse.json({
    prospect: {
      id: prospect.id,
      email: lead.email ?? null,
      linkedin_url: lead.linkedinUrl ?? null,
    },
  })
}
