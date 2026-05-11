// Server component — uses admin client to bypass RLS for workspace bootstrap.
// This is safe: runs server-side only, service_role key never reaches browser.
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Auth check: uses session cookies (anon key + JWT)
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    redirect('/auth/login')
  }

  // Data query: uses admin client (service_role, bypasses RLS)
  const admin = createAdminClient()

  const { data: memberRows, error: memberError } = await admin
    .from('organization_members')
    .select('role, organization_id')
    .eq('user_id', user.id)

  let org = null
  let role = null

  if (memberRows && memberRows.length > 0) {
    role = memberRows[0].role
    const { data: orgRow } = await admin
      .from('organizations')
      .select('id, name, slug, plan')
      .eq('id', memberRows[0].organization_id)
      .single()
    org = orgRow
  }

  // Debug: if still null, surface why (temporary — remove after confirmed working)
  const debugInfo = (!org && memberError)
    ? `Debug: ${memberError.message}`
    : null

  return (
    <DashboardClient
      userEmail={user.email ?? ''}
      org={org}
      role={role}
      debugInfo={debugInfo}
    />
  )
}
