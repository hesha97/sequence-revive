// POST /api/ai/draft-reply — M6 prompt. Drafts a warm reply to an inbound.
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { callAnthropic, extractText } from '@/lib/anthropic'
import type { Brain } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SYSTEM = 'You are an expert reply writer who matches the operator\'s voice.'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let body: { reply_text?: string; prospect_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 })
  }
  if (!body.reply_text || !body.prospect_id) {
    return NextResponse.json({ error: 'reply_text and prospect_id required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) return NextResponse.json({ error: 'No organization' }, { status: 500 })

  // Load prospect (org-scoped) + the client brain for that prospect.
  const { data: prospect } = await admin
    .from('prospects')
    .select('first_name, last_name, company_name, client_id')
    .eq('id', body.prospect_id)
    .eq('organization_id', orgId)
    .single()
  if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })

  const { data: client } = await admin
    .from('clients')
    .select('brain')
    .eq('id', prospect.client_id)
    .eq('organization_id', orgId)
    .single()
  const brain = (client?.brain as Brain) ?? {}

  const prompt = `Someone replied to your outreach. Draft a warm, concise reply.

THEY SAID: "${body.reply_text}"

CONTEXT: ${brain.company_summary ?? ''}
VOICE: ${brain.voice_essence ?? 'professional and warm'}

PERSON: ${prospect?.first_name ?? ''} ${prospect?.last_name ?? ''} at ${prospect?.company_name ?? ''}

Rules:
- 3 sentences max
- Warm, professional, not salesy
- If they sound interested → propose next step (call, credentials pack)
- If declining → graceful exit, door open
- If asking a question → answer directly, then propose next step
- Match their formality level

Output ONLY the reply body. No subject line.`

  try {
    const content = await callAnthropic(
      [{ role: 'user', content: prompt }],
      { systemPrompt: SYSTEM, maxTokens: 500 }
    )
    const text = extractText(content)
    return NextResponse.json({ draft: text })
  } catch (e) {
    return NextResponse.json(
      { error: 'draft_failed', message: (e as Error).message },
      { status: 502 }
    )
  }
}
