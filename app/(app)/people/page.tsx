// People — full prospects list + ManualAddForm for adding people not from Lemlist.
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PeopleClient } from './people-client'
import type { ProspectRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PeoplePage() {
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

  const { data: rows } = await admin
    .from('prospects')
    .select('id, source_id, first_name, last_name, company_name, job_title, linkedin_url, email, research, intel_status, source')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(500)

  return <PeopleClient initialProspects={(rows ?? []) as ProspectRow[]} />
}
