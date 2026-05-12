// POST /api/ai/generate-sequence
// Generates a 6-touch sequence for one prospect (M5 prompt).
// K4 fix: tight try/catch with JSON-cleaning step around the parse, so a
// single-prospect parse failure doesn't take down the batch.
// Client calls this once per prospect, limiting concurrency to 3 in parallel.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { callAnthropic, extractText, parseJsonLoose } from '@/lib/anthropic'
import type { Brain, ProspectResearch, Sequence } from '@/lib/types'

export const runtime = 'nodejs'
// Pro-tier max. Anthropic Tier 1 can issue 429 with retry-after up to 60s;
// our retry sleeps that long and re-fires (~20s), so the worst case is
// ~80s per prospect. 60s was killing the retry path at the Vercel edge.
export const maxDuration = 300
export const dynamic = 'force-dynamic'

// Hard wall-time cap per prospect. If we genuinely cannot get a sequence
// in 2 minutes (including 429 retry), surface the failure cleanly so the
// row goes to 'failed' and the operator can retry one prospect at a time.
const SEQUENCE_TIMEOUT_MS = 120_000

const SYSTEM =
  'You are an expert B2B copywriter who writes in the operator\'s exact voice. Output ONLY valid JSON. Never include markdown fences or prose outside the JSON.'

function buildPrompt(args: {
  prospect: {
    first_name: string | null
    last_name: string | null
    job_title: string | null
    company_name: string | null
  }
  country: string | null
  brain: Brain
  intel: ProspectResearch['intel'] | undefined
}): string {
  const intelBlock = args.intel
    ? `
PER-PROSPECT INTEL (from real web research — use this to shape the OPENER, but never state these facts directly. Iceberg Rule: research informs tone, never appears verbatim):
- About them: ${args.intel.about_them ?? ''}
- About their company: ${args.intel.about_company ?? ''}
- The opening angle to weave in: ${args.intel.hook ?? ''}
- Buying signal strength: ${args.intel.signal ?? ''}
`
    : ''

  return `You are writing a 6-touch outreach sequence for ONE specific person. Voice the company in. Never sound like a template.

PERSON YOU'RE WRITING TO:
- Name: ${args.prospect.first_name ?? ''} ${args.prospect.last_name ?? ''}
- Title: ${args.prospect.job_title ?? ''}
- Company: ${args.prospect.company_name ?? ''}
- Country: ${args.country ?? '—'}

WHO IS WRITING (the brain):
- Company summary: ${args.brain.company_summary ?? ''}
- Voice essence: ${args.brain.voice_essence ?? ''}
- Value props: ${(args.brain.key_value_props ?? []).join(', ')}
- Proof points: ${args.brain.named_proof || '(none — lead with vision)'}

THE BUYER PSYCHOLOGY (from market research — use this to shape every paragraph):
- Their daily pain: ${args.brain.buyer_daily_pain || '(general operational friction)'}
- Common objection: ${args.brain.common_objection || '(unspecified)'} — preempt this in email #2
- Winning argument: ${args.brain.winning_argument || '(time to value)'} — lead with this
- Buying signals to watch for: ${(args.brain.buying_signals ?? []).join(', ') || '(general)'}
- Market context: ${args.brain.market_context || '(general)'}
${intelBlock}
THE 6-TOUCH SEQUENCE (in order):
1. Day 0 — LinkedIn visit (no message — just shows up in their notifications)
2. Day 1 — LinkedIn invite with a short note (universal-ish, max 198 chars)
3. Day 3 — Email #1 — the introduction email
4. Day 7 — Email #2 — proof + new angle, progressively shorter
5. Day 10 — CONDITIONAL: if LinkedIn invite accepted → LinkedIn DM. If not → gentle follow-up email.
6. Day 14 — Soft breakup email with a kind goodbye

EMAIL #1 RULES (the most important one):
- 3 paragraphs, ~140 words
- Paragraph 1: greeting + sender intro + 1-2 named-client proof points + (if intel hook exists) weave in the SPECIFIC opening that references the recent thing without stating it as a fact
- Paragraph 2: department-specific angle. Touch the buyer's daily pain INDIRECTLY — never quote it back at them. Lead the value prop with the WINNING ARGUMENT shape (if winning_argument is "speed", lead with time; if "ROI", lead with cost; if "credibility", lead with track record).
- Paragraph 3: reply-driving CTA — NOT "book a meeting" — instead "reply yes and I'll send a credentials pack" (AVL-aware)
- Forward-survivable: sender clear by line 2, no attachments mentioned
- Intel from research shapes tone, NEVER appears as stated facts (Iceberg Rule)

EMAIL #2 RULES:
- ~80 words, more direct
- New angle (not a reminder of email #1)
- Add one piece of proof not in email #1
- PREEMPT the common objection identified above — address it before they raise it (if "price", show ROI angle; if "timing", show pilot/test option; if "incumbent", show complementary fit; if "wrong_person", offer to find the right one)
- Same reply-driving CTA shape
- IMPORTANT: This must be a REPLY to email #1 — same email thread. Subject must be "Re: [exactly the email #1 subject]". Body should NOT re-introduce — just continue the conversation.

EMAIL #3 (gentle follow-up if LinkedIn not accepted):
- ~50 words
- Acknowledge the noise of inboxes
- One last value prop
- Soft "if not now, no worries"
- Subject must be "Re: [exactly the email #1 subject]" — keep the thread alive

EMAIL #4 (breakup):
- ~40 words
- Warm exit, season-aware (Summer in MENA right now)
- Door open for the future
- Subject must be "Re: [exactly the email #1 subject]" — same thread, last message

LINKEDIN INVITE NOTE (under 198 chars):
- One line about why you're reaching out — no pitch, no link

LINKEDIN DM (if invite accepted):
- ~60 words, conversational
- "Glad we connected — quick reason I reached out..."
- Same CTA as email but conversational

OUTPUT — return ONLY a JSON object, no preamble, no markdown fences:
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

  const research = prospect.research as ProspectResearch | null
  const intel = research?.intel
  const country = (research?.lemlist_meta?.country as string | undefined) ?? null

  let sequence: Sequence
  const callAbort = new AbortController()
  const callTimer = setTimeout(() => callAbort.abort(), SEQUENCE_TIMEOUT_MS)
  try {
    const content = await callAnthropic(
      [{ role: 'user', content: buildPrompt({ prospect, country, brain, intel }) }],
      {
        systemPrompt: SYSTEM,
        maxTokens: 4000,
        signal: callAbort.signal,
        organizationId: orgId,
        userId: user.id,
        callType: 'generate_sequence',
        metadata: { campaign_prospect_id: cp.id, prospect_id: cp.prospect_id },
      }
    )
    const text = extractText(content)
    sequence = parseJsonLoose<Sequence>(text)
  } catch (e) {
    // K4 fix — fail this prospect, leave others alone
    await admin
      .from('campaign_prospects')
      .update({ generation_status: 'failed' })
      .eq('id', cp.id)

    await admin.from('usage_events').insert({
      organization_id: orgId,
      event_type: 'sequence_generation',
      cost_credits: 0,
      cost_usd: 0,
      metadata: { prospect_id: cp.prospect_id, status: 'failed', error: (e as Error).message },
    })

    const aborted = callAbort.signal.aborted
    clearTimeout(callTimer)
    return NextResponse.json(
      {
        error: 'generation_failed',
        message: aborted
          ? `sequence write timed out after ${SEQUENCE_TIMEOUT_MS}ms`
          : (e as Error).message,
      },
      { status: 502 }
    )
  }
  clearTimeout(callTimer)

  await admin
    .from('campaign_prospects')
    .update({
      generated_emails: sequence,
      generation_status: 'ready',
    })
    .eq('id', cp.id)

  await admin.from('usage_events').insert({
    organization_id: orgId,
    event_type: 'sequence_generation',
    cost_credits: 0,
    cost_usd: 0,
    metadata: { prospect_id: cp.prospect_id, status: 'ready' },
  })

  return NextResponse.json({ sequence, status: 'ready' })
}
