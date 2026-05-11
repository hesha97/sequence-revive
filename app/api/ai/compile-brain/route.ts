// POST /api/ai/compile-brain
// Synthesizes the brain JSON from intake answers (M1 prompt).
// Upserts into clients.brain for the operator's org.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { callAnthropic, extractText, parseJsonLoose } from '@/lib/anthropic'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SYSTEM = 'You are a precise data synthesizer. Output ONLY valid JSON. No prose, no markdown fences.'

function buildPrompt(intakeSummary: string): string {
  return `You are building the "Brain" for a B2B sales product. The operator answered intake questions about their company and ideal buyer. Synthesize a complete brain from these answers.

INTAKE ANSWERS:
${intakeSummary}

Return a single JSON object with these fields ONLY (no preamble, no markdown):
{
  "company_summary": "2-3 sentence summary of what the company does and who it serves",
  "voice_essence": "1 sentence describing the tone/register the AI should write in (informed by their tone-register answer)",
  "ideal_buyer_summary": "1-2 sentence description of the ideal buyer — vivid, specific",
  "buyer_daily_pain": "1 sentence — the pain this buyer feels every day",
  "common_objection": "1 sentence — what they'll likely push back with",
  "winning_argument": "1 sentence — the argument that closes them",
  "buying_signals": ["array", "of", "5-7 specific signals to watch for in prospect research"],
  "key_value_props": ["array", "of", "3-4 short value prop phrases"],
  "named_proof": "the proof points the operator gave, summarized",
  "market_context": "1-2 sentences on what's happening in their industry right now",
  "search_filters": {
    "seniorities": ["copy exactly from ideal-buyer-title answers"],
    "company_sizes": ["copy exactly from ideal-company-size answers"],
    "industries": ["copy exactly from ideal-industries answers"],
    "departments": ["copy exactly from ideal-buyer-departments answers"],
    "countries": ["copy exactly from ideal-countries answers"]
  }
}`
}

function summarizeAnswers(answers: Record<string, unknown>): string {
  return Object.entries(answers)
    .map(([k, v]) => {
      const value = Array.isArray(v) ? v.join(', ') : String(v ?? '')
      return `${k}:\n${value}`
    })
    .join('\n\n')
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Parse body
  let body: { answers?: Record<string, unknown>; clientId?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  const answers = body.answers ?? {}
  if (!answers || Object.keys(answers).length === 0) {
    return NextResponse.json({ error: 'No answers provided' }, { status: 400 })
  }

  // 3. Find org (admin client — Pattern 20)
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

  // 4. Call Anthropic
  let brain: Record<string, unknown>
  try {
    const content = await callAnthropic(
      [{ role: 'user', content: buildPrompt(summarizeAnswers(answers)) }],
      { systemPrompt: SYSTEM, maxTokens: 2500 }
    )
    const text = extractText(content)
    brain = parseJsonLoose<Record<string, unknown>>(text)
  } catch (e) {
    return NextResponse.json(
      { error: 'compile_failed', message: (e as Error).message },
      { status: 502 }
    )
  }

  // 5. Persist — upsert clients row
  const brainWithMeta = {
    ...brain,
    raw_answers: answers,
    compiled_at: new Date().toISOString(),
  }

  const companyName =
    typeof answers.company_name === 'string' && answers.company_name.trim().length > 0
      ? (answers.company_name as string).trim()
      : 'My company'

  let clientId = body.clientId ?? null

  if (clientId) {
    await admin
      .from('clients')
      .update({ name: companyName, brain: brainWithMeta })
      .eq('id', clientId)
      .eq('organization_id', orgId)
  } else {
    const slugBase = companyName
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

  return NextResponse.json({ brain: brainWithMeta, clientId })
}
