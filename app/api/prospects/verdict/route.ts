// POST /api/prospects/verdict
// Persists a verdict (skip | like | strong) onto prospects.research.verdict.
// Verdict lives in the existing research jsonb to avoid a schema migration.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { ProspectResearch, Verdict } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID: Verdict[] = ['skip', 'like', 'strong']

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let body: { prospectId?: string; verdict?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  if (!body.prospectId || !body.verdict || !VALID.includes(body.verdict as Verdict)) {
    return NextResponse.json({ error: 'prospectId and verdict (skip|like|strong) required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 500 })

  const { data: prospect } = await admin
    .from('prospects')
    .select('id, research')
    .eq('id', body.prospectId)
    .eq('organization_id', orgId)
    .single()
  if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })

  const prev = (prospect.research as ProspectResearch | null) ?? {}
  const next: ProspectResearch = { ...prev, verdict: body.verdict as Verdict }

  await admin
    .from('prospects')
    .update({ research: next })
    .eq('id', prospect.id)
    .eq('organization_id', orgId)

  return NextResponse.json({ ok: true })
}
