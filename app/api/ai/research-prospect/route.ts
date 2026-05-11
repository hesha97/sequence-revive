// POST /api/ai/research-prospect
// JSON-mode intel for one prospect. Two parallel Anthropic web_search calls
// (person + company), merged into ProspectIntel. K2 fix — no regex parsing.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { callAnthropic, extractText, parseJsonLoose } from '@/lib/anthropic'
import type { ProspectIntel, ProspectResearch } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PersonResult = {
  about_them?: string
  conversation_hook?: string
  signal_strength?: 'hot' | 'warm' | 'cold'
}

type CompanyResult = {
  about_company?: string
  recent_signals?: string[]
}

async function searchPerson(p: {
  first_name: string | null
  last_name: string | null
  job_title: string | null
  company_name: string | null
}): Promise<PersonResult> {
  const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || '(unnamed)'
  const prompt = `Research this person for B2B outreach context: ${fullName}, ${p.job_title ?? '(no title)'} at ${p.company_name ?? '(no company)'}.

Search the web. Then return ONLY a JSON object (no markdown, no prose):
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
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }
    )
    const text = extractText(content)
    return parseJsonLoose<PersonResult>(text)
  } catch {
    return {}
  }
}

async function searchCompany(companyName: string | null): Promise<CompanyResult> {
  if (!companyName) return {}
  const prompt = `Research this company: ${companyName}. Recent news, hiring, funding, RFPs, leadership changes (last 6 months).

Return ONLY JSON:
{
  "about_company": "3 sentences max — recent moves, hiring, news",
  "recent_signals": ["list of 2-3 specific recent events"]
}`
  try {
    const content = await callAnthropic(
      [{ role: 'user', content: prompt }],
      {
        systemPrompt: 'Output ONLY valid JSON.',
        maxTokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }
    )
    const text = extractText(content)
    return parseJsonLoose<CompanyResult>(text)
  } catch {
    return {}
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

  // Mark as researching
  await admin
    .from('prospects')
    .update({ intel_status: 'researching' })
    .eq('id', prospect.id)
    .eq('organization_id', orgId)

  // Parallel person + company search (JSON mode — K2 fix)
  const [person, company] = await Promise.all([
    searchPerson(prospect),
    searchCompany(prospect.company_name),
  ])

  const intel: ProspectIntel = {
    about_them: person.about_them,
    about_company: company.about_company,
    hook: person.conversation_hook,
    signal: person.signal_strength,
    recent_signals: company.recent_signals,
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

  return NextResponse.json({ intel })
}
