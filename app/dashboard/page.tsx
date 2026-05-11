// Server component. Loads the user's org via two separate queries
// (avoids PostgREST join that conflicts with cross-table RLS).
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

  // Query 1: get the user's membership (RLS: user_id = auth.uid())
  const { data: memberRows } = await supabase
    .from('organization_members')
    .select('role, organization_id')
    .eq('user_id', user.id)

  // Query 2: get the org details (RLS: id in user_org_ids())
  let org = null
  let role = null
  if (memberRows && memberRows.length > 0) {
    role = memberRows[0].role
    const { data: orgRow } = await supabase
      .from('organizations')
      .select('id, name, slug, plan')
      .eq('id', memberRows[0].organization_id)
      .single()
    org = orgRow
  }

  return (
    <DashboardClient
      userEmail={user.email ?? ''}
      org={org}
      role={role}
    />
  )
}
