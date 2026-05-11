// Onboarding entry point. Server component: looks up the user's first client (if any)
// and passes its id down to the client flow so re-takes update the existing row.
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { OnboardingFlow } from './onboarding-flow'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
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
  let clientId: string | null = null

  if (orgId) {
    const { data: clientRows } = await admin
      .from('clients')
      .select('id')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })
      .limit(1)
    clientId = clientRows?.[0]?.id ?? null
  }

  return <OnboardingFlow clientId={clientId} />
}
