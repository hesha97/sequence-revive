// Sequences entry — server component ensures a draft campaign exists for the
// strong-verdict prospects, then hands a list of campaign_prospects to the
// client for generation progress.
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { SequencesClient, CampaignProspectLite } from './sequences-client'
import type { ProspectResearch } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SequencesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) redirect('/today')

  const { data: clientRows } = await admin
    .from('clients')
    .select('id')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })
    .limit(1)
  const clientId = clientRows?.[0]?.id ?? null
  if (!clientId) redirect('/onboarding')

  // Strong prospects = those with research.verdict === 'strong'
  const { data: allProspects } = await admin
    .from('prospects')
    .select('id, first_name, last_name, job_title, company_name, research')
    .eq('organization_id', orgId)
    .eq('client_id', clientId)
  const strong = (allProspects ?? []).filter(
    (p) => (p.research as ProspectResearch | null)?.verdict === 'strong'
  )

  if (strong.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-gold mb-6">
          The wave
        </p>
        <h1 className="font-serif text-3xl text-fg-primary mb-4 max-w-xl">
          <span className="italic">Pick some people first.</span>
        </h1>
        <p className="text-fg-secondary mb-8">
          Mark a few as Strong, then come back. We&apos;ll write their conversation.
        </p>
        <a
          href="/prospects"
          className="bg-earth-sand text-fg-inverse hover:bg-earth-stone px-6 py-3 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
        >
          Find people
        </a>
      </div>
    )
  }

  // Find or create a draft campaign for this client
  const { data: draftRows } = await admin
    .from('campaigns')
    .select('id')
    .eq('organization_id', orgId)
    .eq('client_id', clientId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)

  let campaignId = draftRows?.[0]?.id ?? null
  if (!campaignId) {
    const { data: inserted } = await admin
      .from('campaigns')
      .insert({
        organization_id: orgId,
        client_id: clientId,
        name: `Wave · ${new Date().toISOString().slice(0, 10)}`,
        status: 'draft',
        architecture: {
          touches: ['linkedin_visit', 'linkedin_invite', 'email_1', 'email_2', 'conditional_day10', 'breakup'],
          days: [0, 1, 3, 7, 10, 14],
        },
      })
      .select('id')
      .single()
    campaignId = inserted?.id ?? null
  }

  if (!campaignId) {
    throw new Error('Failed to create draft campaign')
  }

  // Ensure a campaign_prospects row exists for each strong prospect
  const { data: existingCps } = await admin
    .from('campaign_prospects')
    .select('id, prospect_id, generation_status, generated_emails')
    .eq('campaign_id', campaignId)

  const existingByProspect = new Map(
    (existingCps ?? []).map((c) => [c.prospect_id, c])
  )

  const missing = strong.filter((p) => !existingByProspect.has(p.id))
  if (missing.length > 0) {
    const { error: cpInsertErr } = await admin.from('campaign_prospects').insert(
      missing.map((p) => ({
        organization_id: orgId,
        campaign_id: campaignId,
        prospect_id: p.id,
        generation_status: 'pending',
      }))
    )
    if (cpInsertErr) {
      throw new Error(`Failed to add prospects to campaign: ${cpInsertErr.message}`)
    }
  }

  // Heal orphaned 'generating' rows before we render. A row stuck in
  // 'generating' with no generated_emails and either no last_action_at OR a
  // last_action_at older than 3 minutes is from a previously killed function
  // (Vercel 504 before our 120s timeout could catch it, or a deploy mid-call).
  // The client gates on generatingCount >= MAX_CONCURRENT, so even one stuck
  // row blocks the whole queue — reset them to 'pending' so the queue moves.
  // Three minutes is well outside our 120s SEQUENCE_TIMEOUT_MS, so we won't
  // race a genuinely in-flight call.
  const orphanCutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString()
  await admin
    .from('campaign_prospects')
    .update({ generation_status: 'pending', last_action_at: null })
    .eq('campaign_id', campaignId)
    .eq('generation_status', 'generating')
    .is('generated_emails', null)
    .or(`last_action_at.is.null,last_action_at.lt.${orphanCutoff}`)

  // Re-fetch with prospect names joined
  const { data: cps } = await admin
    .from('campaign_prospects')
    .select('id, prospect_id, generation_status, generated_emails')
    .eq('campaign_id', campaignId)

  const items: CampaignProspectLite[] = (cps ?? []).map((c) => {
    const p = strong.find((sp) => sp.id === c.prospect_id)
    return {
      id: c.id,
      prospectId: c.prospect_id,
      firstName: p?.first_name ?? '',
      lastName: p?.last_name ?? '',
      jobTitle: p?.job_title ?? '',
      companyName: p?.company_name ?? '',
      status: (c.generation_status ?? 'pending') as 'pending' | 'generating' | 'ready' | 'failed',
      hasSequence: Boolean(c.generated_emails),
    }
  })

  return <SequencesClient campaignId={campaignId} items={items} />
}
