// POST /api/ai/research-prospect
// JSON-mode intel via Anthropic web_search. Two parallel calls (person + company).
//
// Error doctrine (Fix 5):
//   both fail   → intel_status='failed', 502 with both errors
//   one fails   → intel_status='ready', save partial intel, 200 with warning
//   both ok     → intel_status='ready', save full intel, 200
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { callAnthropic, extractText, parseJsonLoose } from '@/lib/anthropic'
import type { ProspectIntel, ProspectResearch } from '@/lib/types'

export const runtime = 'nodejs'
// Pro-tier max. Two parallel web_search legs (person + company), each
// capped at 60s, with 429 retry headroom. 60s was killing the retry path.
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Per-leg wall-time cap. Bounded so a stalled or chained web_search can't
// hog the function budget.
const LEG_TIMEOUT_MS = 60_000

type PersonResult = {
  about_them?: string
  conversation_hook?: string
  signal_strength?: 'hot' | 'warm' | 'cold'
}

type CompanyResult = {
  about_company?: string
  recent_signals?: string[]
}

type LegResult<T> = { ok: true; data: T } | { ok: false; error: string }

type LegContext = {
  orgId: string
  userId: string
  prospectId: string
}

async function searchPerson(
  p: {
    first_name: string | null
    last_name: string | null
    job_title: string | null
    company_name: string | null
  },
  ctx: LegContext
): Promise<LegResult<PersonResult>> {
  const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || '(unnamed)'
  const prompt = `Research this person for B2B outreach context: ${fullName}, ${p.job_title ?? '(no title)'} at ${p.company_name ?? '(no company)'}.

Search the web. Then return ONLY a JSON object (no markdown, no prose):
{
  "about_them": "3 sentences about their recent role, posts, signals, priorities",
  "conversation_hook": "1-2 sentences: specific opening angle referencing a real recent thing",
  "signal_strength": "hot" or "warm" or "cold"
}`
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), LEG_TIMEOUT_MS)
  try {
    const content = await callAnthropic(
      [{ role: 'user', content: prompt }],
      {
        systemPrompt: 'Output ONLY valid JSON.',
        maxTokens: 1500,
        // Cap to 2 searches so the model can't chain 5+ page reads.
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }],
        signal: abort.signal,
        organizationId: ctx.orgId,
        userId: ctx.userId,
        callType: 'research_prospect.person',
        metadata: { prospect_id: ctx.prospectId },
      }
    )
    const text = extractText(content)
    const data = parseJsonLoose<PersonResult>(text)
    return { ok: true, data }
  } catch (e) {
    const aborted = abort.signal.aborted
    return {
      ok: false,
      error: aborted
        ? `person research timed out after ${LEG_TIMEOUT_MS}ms`
        : (e as Error).message,
    }
  } finally {
    clearTimeout(timer)
  }
}

async function searchCompany(
  companyName: string | null,
  ctx: LegContext
): Promise<LegResult<CompanyResult>> {
  if (!companyName) return { ok: false, error: 'no company name on record' }
  const prompt = `Research this company: ${companyName}. Recent news, hiring, funding, RFPs, leadership changes (last 6 months).

Return ONLY JSON:
{
  "about_company": "3 sentences max — recent moves, hiring, news",
  "recent_signals": ["list of 2-3 specific recent events"]
}`
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), LEG_TIMEOUT_MS)
  try {
    const content = await callAnthropic(
      [{ role: 'user', content: prompt }],
      {
        systemPrompt: 'Output ONLY valid JSON.',
        maxTokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 2 }],
        signal: abort.signal,
        organizationId: ctx.orgId,
        userId: ctx.userId,
        callType: 'research_prospect.company',
        metadata: { prospect_id: ctx.prospectId, company_name: companyName },
      }
    )
    const text = extractText(content)
    const data = parseJsonLoose<CompanyResult>(text)
    return { ok: true, data }
  } catch (e) {
    const aborted = abort.signal.aborted
    return {
      ok: false,
      error: aborted
        ? `company research timed out after ${LEG_TIMEOUT_MS}ms`
        : (e as Error).message,
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: { prospectId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  if (!body.prospectId) {
    return NextResponse.json({ error: 'prospectId required' }, { status: 400 })
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

  const { data: prospect } = await admin
    .from('prospects')
    .select('id, first_name, last_name, job_title, company_name, research')
    .eq('id', body.prospectId)
    .eq('organization_id', orgId)
    .single()
  if (!prospect) {
    return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
  }

  // Mark researching
  await admin
    .from('prospects')
    .update({ intel_status: 'researching' })
    .eq('id', prospect.id)
    .eq('organization_id', orgId)

  const legCtx: LegContext = { orgId, userId: user.id, prospectId: prospect.id }
  const [person, company] = await Promise.all([
    searchPerson(prospect, legCtx),
    searchCompany(prospect.company_name, legCtx),
  ])

  // Both failed → mark failed + 502 with both errors
  if (!person.ok && !company.ok) {
    await admin
      .from('prospects')
      .update({ intel_status: 'failed' })
      .eq('id', prospect.id)
      .eq('organization_id', orgId)

    await admin.from('usage_events').insert({
      organization_id: orgId,
      event_type: 'prospect_research',
      cost_credits: 0,
      cost_usd: 0,
      metadata: {
        prospect_id: prospect.id,
        person_ok: false,
        company_ok: false,
        person_error: person.error,
        company_error: company.error,
      },
    })

    return NextResponse.json({
      error: 'research_failed',
      message: `Person: ${person.error}. Company: ${company.error}.`,
      person_error: person.error,
      company_error: company.error,
    }, { status: 502 })
  }

  // At least one succeeded
  const personData = person.ok ? person.data : {}
  const companyData = company.ok ? company.data : {}

  const intel: ProspectIntel = {
    about_them: personData.about_them,
    about_company: companyData.about_company,
    hook: personData.conversation_hook,
    signal: personData.signal_strength,
    recent_signals: companyData.recent_signals,
    researched_at: new Date().toISOString(),
  }

  const prevResearch = (prospect.research as ProspectResearch | null) ?? {}
  const nextResearch: ProspectResearch = { ...prevResearch, intel }

  await admin
    .from('prospects')
    .update({
      research: nextResearch,
      intel_status: 'ready',
    })
    .eq('id', prospect.id)
    .eq('organization_id', orgId)

  await admin.from('usage_events').insert({
    organization_id: orgId,
    event_type: 'prospect_research',
    cost_credits: 0,
    cost_usd: 0,
    metadata: {
      prospect_id: prospect.id,
      person_ok: person.ok,
      company_ok: company.ok,
      person_error: person.ok ? null : person.error,
      company_error: company.ok ? null : company.error,
    },
  })

  // Build response with optional warning if a leg failed
  const warning =
    !person.ok
      ? `Person research came back empty — ${person.error}`
      : !company.ok
      ? `Company research came back empty — ${company.error}`
      : undefined

  return NextResponse.json({ intel, warning })
}
