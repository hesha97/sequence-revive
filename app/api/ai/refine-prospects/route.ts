// POST /api/ai/refine-prospects
// M3 Lookalike Refinement — operator marked some as "Like" → AI re-ranks the
// remaining (un-verdicted) prospects by similarity to the seed pattern.
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { callAnthropic, extractText, parseJsonLoose } from '@/lib/anthropic'
import type { ProspectResearch } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ranked = { index: number; score: number; reason: string }

export async function POST() {
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

  const { data: rows } = await admin
    .from('prospects')
    .select('id, first_name, last_name, job_title, company_name, research')
    .eq('organization_id', orgId)
  if (!rows) return NextResponse.json({ refined: [] })

  const seeds = rows.filter((r) => (r.research as ProspectResearch | null)?.verdict === 'like')
  const remaining = rows.filter((r) => {
    const v = (r.research as ProspectResearch | null)?.verdict
    return v !== 'like' && v !== 'skip' && v !== 'strong'
  })

  if (seeds.length === 0 || remaining.length === 0) {
    return NextResponse.json({ refined: [] })
  }

  const seedSummary = seeds
    .map((s) => {
      const arch = (s.research as ProspectResearch | null)?.archetype ?? 'unspecified'
      return `- ${s.first_name ?? ''} ${s.last_name ?? ''}, ${s.job_title ?? '(no title)'} at ${s.company_name ?? '(no co)'} (archetype: ${arch})`
    })
    .join('\n')

  const remainingSummary = remaining
    .map((r, i) => `${i + 1}. ${r.first_name ?? ''} ${r.last_name ?? ''}, ${r.job_title ?? '(no title)'} at ${r.company_name ?? '(no co)'}`)
    .join('\n')

  const prompt = `The operator marked these as the EXACT type they want:

SEED PATTERNS:
${seedSummary}

Re-rank the REMAINING prospects by match to seed pattern (industry, role pattern, company stage, archetype). Return ONLY a JSON array of {index, score: 0-100, reason: "1 short sentence"} sorted descending. No prose.

REMAINING:
${remainingSummary}`

  let ranked: Ranked[]
  try {
    const content = await callAnthropic(
      [{ role: 'user', content: prompt }],
      { systemPrompt: 'Output ONLY valid JSON array.', maxTokens: 3000 }
    )
    const text = extractText(content)
    ranked = parseJsonLoose<Ranked[]>(text)
  } catch (e) {
    return NextResponse.json(
      { error: 'refine_failed', message: (e as Error).message },
      { status: 502 }
    )
  }

  // Persist new scores
  const updates = await Promise.all(
    ranked.map(async (r) => {
      const target = remaining[r.index - 1]
      if (!target) return null
      const prev = (target.research as ProspectResearch | null) ?? {}
      const next: ProspectResearch = { ...prev, score: r.score, score_reason: r.reason }
      await admin
        .from('prospects')
        .update({ research: next })
        .eq('id', target.id)
        .eq('organization_id', orgId)
      return { id: target.id, score: r.score, reason: r.reason }
    })
  )

  return NextResponse.json({ refined: updates.filter(Boolean) })
}
