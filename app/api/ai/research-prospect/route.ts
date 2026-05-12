// ⚠️ TIER-1 TEST VARIANT — web_search capped to 1 iteration AND the company
// search leg is dropped entirely (only the person search runs). Production
// branch (claude/create-claude-md-R5fhF) runs person + company in parallel
// with default web_search iteration count for richer intel. Restore the
// company leg + remove max_uses after Tier 2 upgrade.
// POST /api/ai/research-prospect
// JSON-mode intel via Anthropic web_search.
//
// Error doctrine:
//   fail   → intel_status='failed', 502 with error
//   ok     → intel_status='ready', save intel, 200
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { callAnthropic, extractText, parseJsonLoose } from '@/lib/anthropic'
import type { ProspectIntel, ProspectResearch } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

type PersonResult = {
  about_them?: string
  conversation_hook?: string
  signal_strength?: 'hot' | 'warm' | 'cold'
}

type LegResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function searchPerson(p: {
  first_name: string | null
  last_name: string | null
  job_title: string | null
  company_name: string | null
}): Promise<LegResult<PersonResult>> {
  const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || '(unnamed)'
  const prompt = `Research this person for B2B outreach context: ${fullName}, ${p.job_title ?? '(no title)'} at ${p.company_name ?? '(no company)'}.

Search the web once. Then return ONLY a JSON object (no markdown, no prose):
{
  "about_them": "3 sentences about their recent role, posts, signals, priorities",
  "conversation_hook": "1-2 sentences: specific opening angle referencing a real recent thing",
  "signal_strength": "hot" or "warm" or "cold"
}`
  try {
    const content = await callAnthropic(
      [{ role: 'user', content: prompt }],
      {
        systemPrompt: 'Output ONLY valid JSON.',
        maxTokens: 1500,
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 1, // TIER-1 TEST ONLY — production uses default iterations
        }],
      }
    )
    const text = extractText(content)
    const data = parseJsonLoose<PersonResult>(text)
    return { ok: true, data }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

// TODO (Tier 2): restore searchCompany() — runs in parallel with searchPerson()
// using web_search. See production branch claude/create-claude-md-R5fhF for the
// full implementation. Dropped here to halve per-prospect token cost.

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

  await admin
    .from('prospects')
    .update({ intel_status: 'researching' })
    .eq('id', prospect.id)
    .eq('organization_id', orgId)

  // TIER-1: only person search runs. Company search is dropped to fit token budget.
  const person = await searchPerson(prospect)

  if (!person.ok) {
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
        company_ok: 'skipped_tier_1',
        person_error: person.error,
      },
    })

    return NextResponse.json({
      error: 'research_failed',
      message: person.error,
      person_error: person.error,
    }, { status: 502 })
  }

  const intel: ProspectIntel = {
    about_them: person.data.about_them,
    hook: person.data.conversation_hook,
    signal: person.data.signal_strength,
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
      person_ok: true,
      company_ok: 'skipped_tier_1',
    },
  })

  return NextResponse.json({ intel })
}
