// POST /api/prospects/search
// Runs the operator's brain.search_filters against Lemlist's people search.
// Upserts results into the prospects table (org-scoped). Returns the upserted rows.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LEMLIST_BASE = 'https://api.lemlist.com/api'

type LemlistLead = {
  _id: string
  firstName?: string
  lastName?: string
  title?: string
  companyName?: string
  companyDomain?: string
  country?: string
  linkedinUrl?: string
}

export async function POST(req: NextRequest) {
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

  // Load the first client + its brain (Pattern 20)
  const { data: clientRows } = await admin
    .from('clients')
    .select('id, brain')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })
    .limit(1)
  const client = clientRows?.[0]
  if (!client || !client.brain) {
    return NextResponse.json({ error: 'No brain compiled yet' }, { status: 400 })
  }

  const brain = client.brain as Record<string, unknown>
  const filters = (brain.search_filters as Record<string, string[]>) ?? {}

  // Map brain filter contract -> Lemlist API field names
  const lemlistFilters: Record<string, string[]> = {}
  if (filters.seniorities?.length) lemlistFilters.currentCompanySeniority = filters.seniorities
  if (filters.company_sizes?.length) lemlistFilters.currentCompanySize = filters.company_sizes
  if (filters.industries?.length) lemlistFilters.currentCompanyIndustry = filters.industries
  if (filters.countries?.length) lemlistFilters.currentCompanyCountry = filters.countries
  if (filters.departments?.length) lemlistFilters.currentCompanyDepartment = filters.departments

  // Allow body to override limit (default 30)
  let limit = 30
  try {
    const body = await req.json()
    if (typeof body.limit === 'number' && body.limit > 0 && body.limit <= 50) {
      limit = body.limit
    }
  } catch {
    // no body — fine
  }

  // Lemlist API key (server-only)
  const key = process.env.LEMLIST_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  const token = Buffer.from(`:${key}`).toString('base64')

  let upstream: Response
  try {
    upstream = await fetch(`${LEMLIST_BASE}/leads/search`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        mode: 'people',
        limit,
        filters: lemlistFilters,
      }),
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

  const json = await upstream.json() as { results?: LemlistLead[] }
  const results = json.results ?? []

  // Upsert into prospects. Key by (organization_id, source, source_id) — source_id
  // is the vendor-agnostic identifier (Lemlist today, Apollo / manual later).
  const rows = results.map((r) => ({
    organization_id: orgId,
    client_id: client.id,
    source_id: r._id,
    first_name: r.firstName ?? null,
    last_name: r.lastName ?? null,
    company_name: r.companyName ?? null,
    job_title: r.title ?? null,
    linkedin_url: r.linkedinUrl ?? null,
    source: 'lemlist',
    intel_status: 'pending',
  }))

  if (rows.length > 0) {
    // Best-effort dedupe — if no unique index on (org, source, source_id) yet, fall back to insert with manual filter.
    const { data: existing } = await admin
      .from('prospects')
      .select('source_id')
      .eq('organization_id', orgId)
      .eq('source', 'lemlist')
      .in('source_id', rows.map((r) => r.source_id).filter((v): v is string => Boolean(v)))
    const existingIds = new Set((existing ?? []).map((e) => e.source_id))
    const toInsert = rows.filter((r) => r.source_id && !existingIds.has(r.source_id))
    if (toInsert.length > 0) {
      await admin.from('prospects').insert(toInsert)
    }
  }

  // Re-fetch the org's prospects (includes any verdicts persisted in research jsonb).
  const { data: prospectRows } = await admin
    .from('prospects')
    .select('id, source_id, first_name, last_name, company_name, job_title, linkedin_url, email, research, intel_status, source')
    .eq('organization_id', orgId)
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return NextResponse.json({ prospects: prospectRows ?? [] })
}
