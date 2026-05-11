// POST /api/ai/generate-sequence
// Generates a 6-touch sequence for one prospect (M5 prompt).
// K4 fix: tight try/catch with JSON-cleaning step around the parse, so a
// single-prospect parse failure doesn't take down the batch.
// Client calls this once per prospect, limiting concurrency to 5 in parallel.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { callAnthropic, extractText, parseJsonLoose } from '@/lib/anthropic'
import type { Brain, ProspectResearch, Sequence } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const SYSTEM =
  'You are an expert B2B copywriter who writes in the operator\'s exact voice. Output ONLY valid JSON. Never include markdown fences or prose outside the JSON.'

function buildPrompt(args: {
  prospect: {
    first_name: string | null
    last_name: string | null
    job_title: string | null
    company_name: string | null
  }
  brain: Brain
  intel: ProspectResearch['intel'] | undefined
}): string {
  const intelBlock = args.intel
    ? `
PER-PROSPECT INTEL (real web research — shape the OPENER, never state these as facts. Iceberg Rule):
- About them: ${args.intel.about_them ?? ''}
- About their company: ${args.intel.about_company ?? ''}
- Opening angle: ${args.intel.hook ?? ''}
- Buying signal: ${args.intel.signal ?? ''}
`
    : ''

  return `You are writing a 6-touch outreach sequence for ONE specific person.

PERSON:
- Name: ${args.prospect.first_name ?? ''} ${args.prospect.last_name ?? ''}
- Title: ${args.prospect.job_title ?? ''}
- Company: ${args.prospect.company_name ?? ''}

BRAIN:
- Company summary: ${args.brain.company_summary ?? ''}
- Voice essence: ${args.brain.voice_essence ?? ''}
- Value props: ${(args.brain.key_value_props ?? []).join(', ')}
- Proof: ${args.brain.named_proof ?? ''}

BUYER PSYCHOLOGY:
- Daily pain: ${args.brain.buyer_daily_pain ?? ''}
- Common objection: ${args.brain.common_objection ?? ''} — preempt in email #2
- Winning argument: ${args.brain.winning_argument ?? ''} — lead with this
- Signals: ${(args.brain.buying_signals ?? []).join(', ')}
- Market: ${args.brain.market_context ?? ''}
${intelBlock}

THE 6-TOUCH SEQUENCE:
1. Day 0 — LinkedIn visit (no message)
2. Day 1 — LinkedIn invite (max 198 chars)
3. Day 3 — Email #1 (~140 words, 3 paragraphs: intro+proof / pain+value / reply CTA)
4. Day 7 — Email #2 (~80 words, new angle, preempt objection, "Re: <email #1 subject>")
5. Day 10 — CONDITIONAL: if invite accepted, LinkedIn DM (~60 words). If not, email #3 (~50 words, Re: thread).
6. Day 14 — Breakup email (~40 words, warm exit, Re: thread).

Email #1 rules: Para 1 greeting + sender intro + 1-2 proof points + intel hook woven in (Iceberg Rule). Para 2 department angle, touch pain INDIRECTLY, lead with winning argument shape. Para 3 reply CTA — "reply yes and I'll send a credentials pack" (AVL-aware MENA corporate). Forward-survivable. Intel shapes tone, never appears as facts.

Email #2: ~80 words, new angle, proof not in #1, preempt the objection. Re: thread.
Email #3: ~50 words, acknowledge inbox noise, last value prop. Re: thread.
Email #4: ~40 words, warm exit, season-aware. Re: thread.
LinkedIn invite: under 198 chars, one line, no pitch.
LinkedIn DM: ~60 words, conversational, same CTA.

OUTPUT — ONLY JSON:
{
  "step1_visit": { "type": "linkedin_visit", "day": 0 },
  "step2_invite": { "type": "linkedin_invite", "day": 1, "note": "..." },
  "step3_email1": { "type": "email", "day": 3, "subject": "...", "body": "..." },
  "step4_email2": { "type": "email", "day": 7, "subject": "Re: ...", "body": "..." },
  "step5_conditional": {
    "if_accepted": { "type": "linkedin_message", "day": 10, "body": "..." },
    "if_not": { "type": "email", "day": 10, "subject": "Re: ...", "body": "..." }
  },
  "step6_breakup": { "type": "email", "day": 14, "subject": "Re: ...", "body": "..." }
}`
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let body: { campaignProspectId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  if (!body.campaignProspectId) {
    return NextResponse.json({ error: 'campaignProspectId required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 500 })

  // Resolve campaign_prospect -> prospect + campaign + client + brain
  const { data: cp } = await admin
    .from('campaign_prospects')
    .select('id, campaign_id, prospect_id, generation_status, generated_emails')
    .eq('id', body.campaignProspectId)
    .single()
  if (!cp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, organization_id, client_id')
    .eq('id', cp.campaign_id)
    .single()
  if (!campaign || campaign.organization_id !== orgId) {
    return NextResponse.json({ error: 'Wrong org' }, { status: 403 })
  }

  const { data: prospect } = await admin
    .from('prospects')
    .select('first_name, last_name, job_title, company_name, research')
    .eq('id', cp.prospect_id)
    .single()
  if (!prospect) return NextResponse.json({ error: 'Prospect missing' }, { status: 404 })

  const { data: client } = await admin
    .from('clients')
    .select('brain')
    .eq('id', campaign.client_id)
    .single()
  const brain = (client?.brain as Brain) ?? null
  if (!brain) return NextResponse.json({ error: 'No brain' }, { status: 400 })

  // Mark generating
  await admin
    .from('campaign_prospects')
    .update({ generation_status: 'generating' })
    .eq('id', cp.id)

  const intel = (prospect.research as ProspectResearch | null)?.intel

  let sequence: Sequence
  try {
    const content = await callAnthropic(
      [{ role: 'user', content: buildPrompt({ prospect, brain, intel }) }],
      { systemPrompt: SYSTEM, maxTokens: 4000 }
    )
    const text = extractText(content)
    sequence = parseJsonLoose<Sequence>(text)
  } catch (e) {
    // K4 fix — fail this prospect, leave others alone
    await admin
      .from('campaign_prospects')
      .update({ generation_status: 'failed' })
      .eq('id', cp.id)
    return NextResponse.json(
      { error: 'generation_failed', message: (e as Error).message },
      { status: 502 }
    )
  }

  await admin
    .from('campaign_prospects')
    .update({
      generated_emails: sequence,
      generation_status: 'ready',
    })
    .eq('id', cp.id)

  return NextResponse.json({ sequence, status: 'ready' })
}
