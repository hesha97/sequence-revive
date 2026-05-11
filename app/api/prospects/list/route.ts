// GET /api/prospects/list — returns the org's prospects.
// Optional ?id=<prospectId> filter for refreshing a single row.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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

  const onlyId = req.nextUrl.searchParams.get('id')

  let query = admin
    .from('prospects')
    .select('id, source_id, first_name, last_name, company_name, job_title, linkedin_url, email, research, intel_status, source')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
  if (onlyId) {
    query = query.eq('id', onlyId)
  }

  const { data } = await query
  return NextResponse.json({ prospects: data ?? [] })
}
