// POST /api/voice/update — saves edits to clients.brain.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let body: { clientId?: string; brain?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  if (!body.clientId || !body.brain) {
    return NextResponse.json({ error: 'clientId and brain required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 500 })

  // Preserve raw_answers + compiled_at if already present
  const { data: existing } = await admin
    .from('clients')
    .select('brain')
    .eq('id', body.clientId)
    .eq('organization_id', orgId)
    .single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const prevBrain = (existing.brain as Record<string, unknown> | null) ?? {}
  // Preserve targeting (search_filters) + raw_answers + compiled_at across voice edits.
  // search_filters are set during onboarding, not via voice. Wiping them here
  // would break Find People silently.
  const merged: Record<string, unknown> = {
    ...body.brain,
    search_filters: prevBrain.search_filters,
    raw_answers: prevBrain.raw_answers,
    compiled_at: prevBrain.compiled_at,
    edited_at: new Date().toISOString(),
  }

  const { error: updateErr } = await admin
    .from('clients')
    .update({ brain: merged })
    .eq('id', body.clientId)
    .eq('organization_id', orgId)
  if (updateErr) {
    return NextResponse.json(
      { error: 'persist_failed', message: updateErr.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
