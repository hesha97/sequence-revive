// Prospects review — server component bootstraps user/org/brain/current roster
// then hands off to the client for the two-phase Refinement → Selection flow.
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ProspectsClient } from './prospects-client'
import type { ProspectRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ProspectsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id ?? null
  if (!orgId) redirect('/today')

  const { data: clientRows } = await admin
    .from('clients')
    .select('id, brain')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })
    .limit(1)
  const client = clientRows?.[0]
  if (!client || !client.brain) {
    redirect('/onboarding')
  }

  const { data: prospectRows } = await admin
    .from('prospects')
    .select('id, source_id, first_name, last_name, company_name, job_title, linkedin_url, email, research, intel_status, source')
    .eq('organization_id', orgId)
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  return (
    <ProspectsClient
      initialProspects={(prospectRows ?? []) as ProspectRow[]}
    />
  )
}
