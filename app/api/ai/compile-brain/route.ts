// POST /api/ai/compile-brain
// Two-step brain synthesis:
//   A) web_search market intel from the operator's company + win story
//   B) JSON-mode synthesis: intake answers + market intel → full brain
// Persists into clients.brain. Logs a usage_event.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { callAnthropic, extractText, parseJsonLoose } from '@/lib/anthropic'
import { INTAKE_STEPS } from '@/app/(app)/onboarding/intake-steps'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const SYNTHESIS_SYSTEM =
  'You are a precise data synthesizer. Output ONLY valid JSON. No prose, no markdown fences.'

const MARKET_INTEL_SYSTEM =
  'You are a market researcher. Search the web, then return the requested fields verbatim. No preamble.'

function buildMarketIntelPrompt(answers: Record<string, unknown>): string {
  const companyName = (answers['company-name'] as string) ?? ''
  const companyWebsite = (answers['company-website'] as string) ?? ''
  const whatYouSell = (answers['what-you-sell'] as string) ?? ''
  const winStory = (answers['biggest-win-story'] as string) ?? ''

  return `Research this B2B company so we can write better outreach for them.

Company: ${companyName}
Website: ${companyWebsite}
What they do: ${whatYouSell}
A favorite client win: ${winStory}

Search the web. Then return EXACTLY this format (no preamble, no markdown fences):

DAILY_PAIN:
[1 sentence — the most likely pain their typical buyer feels every day, inferred from what this company solves]

COMMON_OBJECTION:
[1 sentence — the objection their buyers most likely raise]

WINNING_ARGUMENT:
[1 sentence — the strongest closing argument for this kind of offer]

BUYING_SIGNALS:
[3-5 short signals to watch for, comma-separated — e.g. "new funding, exec hire, hiring sprint, RFP published"]

MARKET_CONTEXT:
[2 sentences max — what's happening in their industry right now that's relevant]`
}

function summarizeAnswers(answers: Record<string, unknown>): string {
  // Walk INTAKE_STEPS in order so the summary reads coherently.
  const lines: string[] = []
  for (const step of INTAKE_STEPS) {
    const v = answers[step.id]
    if (v === undefined || v === null) continue
    if (typeof v === 'string' && v.trim().length === 0) continue
    if (Array.isArray(v) && v.length === 0) continue
    const formatted = Array.isArray(v) ? v.join(', ') : String(v)
    lines.push(`${step.question}\n${formatted}`)
  }
  return lines.join('\n\n')
}

function buildSynthesisPrompt(intakeSummary: string, marketIntel: string): string {
  return `You are building the "Brain" for a B2B sales product. The operator answered intake questions, AND we've researched their company online.

INTAKE ANSWERS:
${intakeSummary}

WEB RESEARCH (from real-time search on their company + market):
${marketIntel || '(market research unavailable — infer from intake only)'}

Return a single JSON object with these fields ONLY (no preamble, no markdown):
{
  "company_summary": "2-3 sentence summary of what the company does and who it serves",
  "voice_essence": "1 sentence describing the tone/register the AI should write in (informed by their tone-register answer)",
  "ideal_buyer_summary": "1-2 sentence description of the ideal buyer — vivid, specific",
  "buyer_daily_pain": "1 sentence — the pain this buyer feels every day (derive from research, not generic)",
  "common_objection": "1 sentence — what they'll likely push back with",
  "winning_argument": "1 sentence — the argument that closes them",
  "buying_signals": ["array", "of", "5-7 specific signals to watch for in prospect research"],
  "key_value_props": ["array", "of", "3-4 short value prop phrases"],
  "named_proof": "the proof points the operator gave, summarized",
  "market_context": "1-2 sentences on what's happening in their industry right now",
  "search_filters": {
    "seniorities": ["copy exactly from ideal-buyer-title answers — these are Lemlist seniority enum strings"],
    "company_sizes": ["copy exactly from ideal-company-size answers"],
    "industries": ["copy from ideal-industries answers"],
    "departments": ["copy exactly from ideal-buyer-departments answers — these are Lemlist department enum strings"],
    "countries": ["the resolved country array from geography answer, OR ['Global'] if global"]
  }
}`
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: { answers?: Record<string, unknown>; clientId?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  const answers = body.answers ?? {}
  if (Object.keys(answers).length === 0) {
    return NextResponse.json({ error: 'No answers provided' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) {
    return NextResponse.json({ error: 'No organization for user' }, { status: 500 })
  }

  // STEP A — Market intel via web_search. On failure, log and continue with empty marketIntel.
  let marketIntel = ''
  let marketIntelError: string | null = null
  try {
    const content = await callAnthropic(
      [{ role: 'user', content: buildMarketIntelPrompt(answers) }],
      {
        systemPrompt: MARKET_INTEL_SYSTEM,
        maxTokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }
    )
    marketIntel = extractText(content)
  } catch (e) {
    marketIntelError = (e as Error).message
    console.error('Market intel web_search failed:', marketIntelError)
  }

  // STEP B — Synthesize the brain.
  let brain: Record<string, unknown>
  try {
    const content = await callAnthropic(
      [{ role: 'user', content: buildSynthesisPrompt(summarizeAnswers(answers), marketIntel) }],
      { systemPrompt: SYNTHESIS_SYSTEM, maxTokens: 2500 }
    )
    const text = extractText(content)
    try {
      brain = parseJsonLoose<Record<string, unknown>>(text)
    } catch (parseErr) {
      return NextResponse.json(
        {
          error: 'compile_failed',
          message: `Brain JSON parse failed: ${(parseErr as Error).message}`,
          raw_text: text.slice(0, 500),
        },
        { status: 502 }
      )
    }
  } catch (e) {
    return NextResponse.json(
      { error: 'compile_failed', message: (e as Error).message },
      { status: 502 }
    )
  }

  // Append metadata
  const brainWithMeta = {
    ...brain,
    raw_answers: answers,
    compiled_at: new Date().toISOString(),
    ...(marketIntelError ? { market_intel_error: marketIntelError } : {}),
  }

  const companyName =
    typeof answers['company-name'] === 'string' && (answers['company-name'] as string).trim().length > 0
      ? (answers['company-name'] as string).trim()
      : 'My company'

  let clientId = body.clientId ?? null

  if (clientId) {
    const { error: updateErr } = await admin
      .from('clients')
      .update({ name: companyName, brain: brainWithMeta })
      .eq('id', clientId)
      .eq('organization_id', orgId)
    if (updateErr) {
      return NextResponse.json(
        { error: 'persist_failed', message: updateErr.message },
        { status: 500 }
      )
    }
  } else {
    // Also detect existing client by org (no schema multi-client support yet).
    const { data: existingRows } = await admin
      .from('clients')
      .select('id')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })
      .limit(1)
    const existingId = existingRows?.[0]?.id ?? null
    if (existingId) {
      await admin
        .from('clients')
        .update({ name: companyName, brain: brainWithMeta })
        .eq('id', existingId)
        .eq('organization_id', orgId)
      clientId = existingId
    } else {
      const slugBase =
        companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 50) || 'workspace'
      const slug = `${slugBase}-${Date.now().toString(36)}`
      const { data: inserted, error: insertErr } = await admin
        .from('clients')
        .insert({
          organization_id: orgId,
          name: companyName,
          slug,
          brain: brainWithMeta,
        })
        .select('id')
        .single()
      if (insertErr) {
        return NextResponse.json(
          { error: 'persist_failed', message: insertErr.message },
          { status: 500 }
        )
      }
      clientId = inserted?.id ?? null
    }
  }

  // Log usage_event — Trust Theater antidote.
  await admin.from('usage_events').insert({
    organization_id: orgId,
    event_type: 'brain_compile',
    cost_credits: 0,
    cost_usd: 0,
    metadata: {
      client_id: clientId,
      market_intel_ok: !marketIntelError,
      market_intel_error: marketIntelError,
    },
  })

  return NextResponse.json({ brain: brainWithMeta, clientId })
}
