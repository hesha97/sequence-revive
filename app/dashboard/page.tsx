// Server component. Middleware already gated unauthenticated users out,
// but we double-check the session here and load org data via RLS.
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // RLS scopes this to memberships where user_id = auth.uid()
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name, slug, plan)')
    .eq('user_id', user.id)

  return (
    <DashboardClient
      userEmail={user.email ?? ''}
      memberships={memberships ?? []}
    />
  )
}
