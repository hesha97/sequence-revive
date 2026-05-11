// POST /api/people/add — manual prospect insert (no Lemlist).
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let body: {
    first_name?: string
    last_name?: string
    company_name?: string | null
    job_title?: string | null
    email?: string | null
    linkedin_url?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  if (!body.first_name || !body.last_name) {
    return NextResponse.json({ error: 'first_name and last_name required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 500 })

  const { data: clientRows } = await admin
    .from('clients')
    .select('id')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })
    .limit(1)
  const clientId = clientRows?.[0]?.id ?? null
  if (!clientId) {
    return NextResponse.json(
      { error: 'no_client', message: 'Compile your brain in onboarding first.' },
      { status: 400 }
    )
  }

  const { data: inserted, error: insertErr } = await admin
    .from('prospects')
    .insert({
      organization_id: orgId,
      client_id: clientId,
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      company_name: body.company_name?.trim() ?? null,
      job_title: body.job_title?.trim() ?? null,
      email: body.email?.trim() ?? null,
      linkedin_url: body.linkedin_url?.trim() ?? null,
      source: 'manual',
      intel_status: 'pending',
    })
    .select('id, source_id, first_name, last_name, company_name, job_title, linkedin_url, email, research, intel_status, source')
    .single()

  if (insertErr) {
    return NextResponse.json({ error: 'insert_failed', message: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ prospect: inserted })
}
