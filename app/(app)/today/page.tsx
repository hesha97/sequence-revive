// Today — the home screen after sign-in. In Push 1 it's an empty state pointing
// the operator into onboarding (if they haven't done it) or to Find People.
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { TodayClient } from './today-client'

export const dynamic = 'force-dynamic'

export default async function TodayPage() {
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
  let hasBrain = false

  if (orgId) {
    const { data: clientRows } = await admin
      .from('clients')
      .select('brain')
      .eq('organization_id', orgId)
      .limit(1)
    hasBrain = Boolean(clientRows?.[0]?.brain)
  }

  return <TodayClient hasBrain={hasBrain} />
}
