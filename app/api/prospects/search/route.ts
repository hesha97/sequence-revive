// POST /api/prospects/search
// Lemlist People Database — POST /api/database/people with the filter-array
// shape: [{ filterId, in: [...], out: [...] }].
// Maps brain.search_filters to Lemlist filterIds. Persists results into
// prospects (source='lemlist', source_id=_id). Logs a usage_event.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LEMLIST_PEOPLE_DB = 'https://api.lemlist.com/api/database/people'

type LemlistFilter = { filterId: string; in: string[]; out: string[] }

type LemlistExperience = {
  company_name?: string
  company_size?: string
  company_industry?: string
  company_domain?: string
  title?: string
  title_normalized?: string
  current_exp_bucket?: string
}

type LemlistLead = {
  _id: string
  lead_id?: number
  full_name?: string
  country?: string
  department?: string
  lead_linkedin_url?: string
  headline?: string
  summary?: string
  experiences?: LemlistExperience[]
}

type LemlistResponse = {
  results?: LemlistLead[]
  total?: number
  page?: number
  size?: number
  limitation?: number
  team?: string
}

// "Alex Doe" → ["Alex", "Doe"]. "Madonna" → ["Madonna", null].
function splitFullName(full?: string): [string | null, string | null] {
  if (!full) return [null, null]
  const trimmed = full.trim()
  if (!trimmed) return [null, null]
  const idx = trimmed.indexOf(' ')
  if (idx === -1) return [trimmed, null]
  return [trimmed.slice(0, idx), trimmed.slice(idx + 1)]
}

function brainFiltersToLemlist(filters: Record<string, unknown>): LemlistFilter[] {
  const out: LemlistFilter[] = []

  const seniorities = filters.seniorities as string[] | undefined
  if (seniorities && seniorities.length > 0) {
    out.push({ filterId: 'seniority', in: Array.from(new Set(seniorities)), out: [] })
  }

  const departments = filters.departments as string[] | undefined
  if (departments && departments.length > 0) {
    out.push({ filterId: 'department', in: Array.from(new Set(departments)), out: [] })
  }

  const sizes = filters.company_sizes as string[] | undefined
  if (sizes && sizes.length > 0) {
    out.push({ filterId: 'currentCompanyHeadcount', in: sizes, out: [] })
  }

  const countries = filters.countries as string[] | string | undefined
  // "Global" sentinel = no country filter.
  if (Array.isArray(countries) && countries.length > 0 && !countries.includes('Global')) {
    out.push({ filterId: 'country', in: countries, out: [] })
  }

  // industries are NOT used as a Lemlist filter (no first-class filter).
  // We use them downstream for AI scoring.

  return out
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Optional body { limit }
  let limit = 30
  try {
    const body = await req.json().catch(() => ({}))
    if (typeof body?.limit === 'number' && body.limit > 0 && body.limit <= 50) {
      limit = body.limit
    }
  } catch {
    // defaults are fine
  }

  // 3. Find org + client + brain
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

  const { data: clientRows } = await admin
    .from('clients')
    .select('id, brain')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })
    .limit(1)
  const client = clientRows?.[0]
  if (!client || !client.brain) {
    return NextResponse.json({
      error: 'No brain compiled yet — finish onboarding first.',
    }, { status: 400 })
  }

  const brain = client.brain as Record<string, unknown>
  const searchFilters = (brain.search_filters as Record<string, unknown>) ?? {}
  const lemlistFilters = brainFiltersToLemlist(searchFilters)

  if (lemlistFilters.length === 0) {
    return NextResponse.json({
      error: 'No filters set — onboarding may not have completed.',
    }, { status: 400 })
  }

  // 4. Call Lemlist
  const apiKey = process.env.LEMLIST_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Server misconfigured — missing search key.' }, { status: 500 })
  }
  const authHeader = 'Basic ' + Buffer.from(':' + apiKey).toString('base64')

  let upstream: Response
  try {
    upstream = await fetch(LEMLIST_PEOPLE_DB, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        filters: lemlistFilters,
        page: 1,
        size: limit,
      }),
      cache: 'no-store',
    })
  } catch (e) {
    return NextResponse.json({
      error: 'lemlist_unreachable',
      message: (e as Error).message,
    }, { status: 502 })
  }

  if (!upstream.ok) {
    const errBody = await upstream.text()
    console.error('Lemlist People DB error:', upstream.status, errBody.slice(0, 500))
    return NextResponse.json({
      error: `lemlist_${upstream.status}`,
      message: errBody.slice(0, 400),
    }, { status: 502 })
  }

  const json = (await upstream.json()) as LemlistResponse
  const results = json.results ?? []

  // 5. Build prospect rows
  type ProspectInsert = {
    organization_id: string
    client_id: string
    source: string
    source_id: string
    first_name: string | null
    last_name: string | null
    job_title: string | null
    company_name: string | null
    linkedin_url: string | null
    intel_status: string
    research: Record<string, unknown>
  }

  const rows: ProspectInsert[] = results.map((r) => {
    const [firstName, lastName] = splitFullName(r.full_name)
    const exp = r.experiences?.[0] ?? {}
    return {
      organization_id: orgId,
      client_id: client.id,
      source: 'lemlist',
      source_id: r._id,
      first_name: firstName,
      last_name: lastName,
      job_title: exp.title ?? null,
      company_name: exp.company_name ?? null,
      linkedin_url: r.lead_linkedin_url ?? null,
      intel_status: 'pending',
      research: {
        lemlist_meta: {
          country: r.country ?? null,
          department: r.department ?? null,
          company_size: exp.company_size ?? null,
          company_industry: exp.company_industry ?? null,
          company_domain: exp.company_domain ?? null,
          headline: r.headline ?? null,
        },
      },
    }
  })

  // 6. Dedupe against existing (organization_id, source, source_id)
  if (rows.length > 0) {
    const sourceIds = rows.map((r) => r.source_id).filter(Boolean)
    const { data: existing } = await admin
      .from('prospects')
      .select('source_id')
      .eq('organization_id', orgId)
      .eq('source', 'lemlist')
      .in('source_id', sourceIds)
    const existingSet = new Set((existing ?? []).map((e) => e.source_id))
    const toInsert = rows.filter((r) => !existingSet.has(r.source_id))
    if (toInsert.length > 0) {
      const { error: insertErr } = await admin.from('prospects').insert(toInsert)
      if (insertErr) {
        console.error('Prospects insert failed:', insertErr.message)
        return NextResponse.json({
          error: 'persist_failed',
          message: insertErr.message,
        }, { status: 500 })
      }
    }
  }

  // 7. Log usage_event
  await admin.from('usage_events').insert({
    organization_id: orgId,
    event_type: 'prospect_search',
    cost_credits: 0,
    cost_usd: 0,
    metadata: {
      filters_applied: lemlistFilters.length,
      total_returned: results.length,
      lemlist_total: json.total ?? null,
      lemlist_remaining: json.limitation ?? null,
    },
  })

  // 8. Re-fetch org's prospects for this client
  const { data: prospectRows } = await admin
    .from('prospects')
    .select('id, source_id, first_name, last_name, company_name, job_title, linkedin_url, email, research, intel_status, source')
    .eq('organization_id', orgId)
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return NextResponse.json({
    prospects: prospectRows ?? [],
    total_in_lemlist: json.total ?? null,
    remaining_calls: json.limitation ?? null,
  })
}
