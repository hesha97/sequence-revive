// POST /api/ai/score-prospects
// Runs the M2 Prospect Scoring prompt against a candidate list, persists
// score + reason + archetype into prospects.research.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { callAnthropic, extractText, parseJsonLoose } from '@/lib/anthropic'
import type { Brain, ProspectResearch } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SYSTEM = 'You are a precise scorer. Output ONLY valid JSON array.'

type Scored = { index: number; score: number; reason: string; archetype: string }

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: { prospectIds?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  const prospectIds = body.prospectIds ?? []
  if (prospectIds.length === 0) {
    return NextResponse.json({ scored: [] })
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

  // Load brain
  const { data: clientRows } = await admin
    .from('clients')
    .select('brain')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })
    .limit(1)
  const brain = (clientRows?.[0]?.brain as Brain) ?? null
  if (!brain) {
    return NextResponse.json({ error: 'No brain' }, { status: 400 })
  }

  // Load candidate prospects
  const { data: prospects } = await admin
    .from('prospects')
    .select('id, first_name, last_name, job_title, company_name, research')
    .in('id', prospectIds)
    .eq('organization_id', orgId)
  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ scored: [] })
  }

  // Build the learned-exclusions block from past `verdict='skip'` rows.
  const { data: skipped } = await admin
    .from('prospects')
    .select('job_title, company_name, research')
    .eq('organization_id', orgId)
  const skippedList = (skipped ?? []).filter(
    (r) => (r.research as ProspectResearch | null)?.verdict === 'skip'
  )
  const exclusionsBlock =
    skippedList.length >= 3
      ? `\nLEARNED EXCLUSIONS (the operator has skipped these types before — score them lower):\n` +
        skippedList
          .slice(0, 10)
          .map((r) => {
            const arch = (r.research as ProspectResearch | null)?.archetype ?? 'unspecified'
            return `- ${r.job_title ?? '(no title)'} at ${r.company_name ?? '(no co)'} (${arch})`
          })
          .join('\n')
      : ''

  const prospectsSummary = prospects
    .map((p, i) => {
      const meta = (p.research as ProspectResearch | null)?.lemlist_meta ?? {}
      const country = meta.country ?? '—'
      const dept = meta.department ?? '—'
      return `${i + 1}. ${p.first_name ?? ''} ${p.last_name ?? ''}, ${p.job_title ?? '(no title)'} at ${p.company_name ?? '(no co)'} (${country}, ${dept})`
    })
    .join('\n')

  const industries = brain.search_filters?.industries ?? []
  const signals = brain.buying_signals ?? []
  const industriesLine = industries.length > 0 ? `\n- Industries of interest: ${industries.join(', ')}` : ''
  const signalsLine = signals.length > 0 ? `\n- Buying signals: ${signals.join(', ')}` : ''

  const prompt = `You are scoring B2B prospects against this brain.

BRAIN:
- Company: ${brain.company_summary ?? ''}
- Ideal buyer: ${brain.ideal_buyer_summary ?? ''}
- Daily pain solved: ${brain.buyer_daily_pain ?? ''}${signalsLine}${industriesLine}
${exclusionsBlock}

PROSPECTS (1-indexed):
${prospectsSummary}

Return ONLY a JSON array of {index: 1-${prospects.length}, score: 0-100, reason: "1 sentence", archetype: "1-3 word label"} sorted by score descending. No prose, no markdown.`

  let scored: Scored[]
  try {
    const content = await callAnthropic(
      [{ role: 'user', content: prompt }],
      { systemPrompt: SYSTEM, maxTokens: 3000 }
    )
    const text = extractText(content)
    scored = parseJsonLoose<Scored[]>(text)
  } catch (e) {
    return NextResponse.json(
      { error: 'score_failed', message: (e as Error).message },
      { status: 502 }
    )
  }

  // Persist each prospect's score back into research jsonb (merging)
  const updates = await Promise.all(
    scored.map(async (s) => {
      const idx = s.index - 1
      const p = prospects[idx]
      if (!p) return null
      const prev = (p.research as ProspectResearch | null) ?? {}
      const next: ProspectResearch = {
        ...prev,
        score: s.score,
        score_reason: s.reason,
        archetype: s.archetype,
      }
      await admin
        .from('prospects')
        .update({ research: next })
        .eq('id', p.id)
        .eq('organization_id', orgId)
      return { id: p.id, score: s.score, reason: s.reason, archetype: s.archetype }
    })
  )

  return NextResponse.json({ scored: updates.filter(Boolean) })
}
