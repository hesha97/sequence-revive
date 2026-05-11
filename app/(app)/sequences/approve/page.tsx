// Approve — review + edit each prospect's 6-touch sequence, then activate.
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ApproveClient, ApproveItem } from './approve-client'
import type { Sequence } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function SequencesApprovePage() {
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

  const { data: campaignRows } = await admin
    .from('campaigns')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
  const campaignId = campaignRows?.[0]?.id ?? null
  if (!campaignId) redirect('/sequences')

  const { data: cps } = await admin
    .from('campaign_prospects')
    .select('id, prospect_id, generation_status, generated_emails')
    .eq('campaign_id', campaignId)

  const prospectIds = (cps ?? []).map((c) => c.prospect_id)
  const { data: prospects } = await admin
    .from('prospects')
    .select('id, first_name, last_name, job_title, company_name')
    .in('id', prospectIds.length > 0 ? prospectIds : ['00000000-0000-0000-0000-000000000000'])

  const prospectsById = new Map((prospects ?? []).map((p) => [p.id, p]))

  const items: ApproveItem[] = (cps ?? [])
    .map((c) => {
      const p = prospectsById.get(c.prospect_id)
      if (!p) return null
      return {
        id: c.id,
        firstName: p.first_name ?? '',
        lastName: p.last_name ?? '',
        jobTitle: p.job_title ?? '',
        companyName: p.company_name ?? '',
        status: (c.generation_status ?? 'pending') as ApproveItem['status'],
        sequence: (c.generated_emails as Sequence | null) ?? null,
      }
    })
    .filter((x): x is ApproveItem => x !== null)

  return <ApproveClient campaignId={campaignId} items={items} />
}
