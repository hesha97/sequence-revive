// Settings — org info, plan, reset (deletes all prospects+campaigns), signout.
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { SettingsClient } from './settings-client'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id ?? null
  const role = memberRows?.[0]?.role ?? null
  if (!orgId) redirect('/today')

  const { data: orgRow } = await admin
    .from('organizations')
    .select('name, slug, plan')
    .eq('id', orgId)
    .single()

  const { count: prospectCount } = await admin
    .from('prospects')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const { count: campaignCount } = await admin
    .from('campaigns')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  return (
    <SettingsClient
      email={user.email ?? ''}
      orgName={orgRow?.name ?? ''}
      orgSlug={orgRow?.slug ?? ''}
      plan={orgRow?.plan ?? 'free'}
      role={role ?? 'member'}
      prospectCount={prospectCount ?? 0}
      campaignCount={campaignCount ?? 0}
    />
  )
}
