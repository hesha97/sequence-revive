// Authenticated app shell. Server component fetches user + org via admin client
// (Pattern 20), then renders the sidebar + page content.
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { SidebarShell } from './sidebar-shell'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Pattern 20 — admin client for bootstrap reads
  const admin = createAdminClient()

  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)

  const orgId = memberRows?.[0]?.organization_id ?? null
  let orgName: string | null = null

  if (orgId) {
    const { data: orgRow } = await admin
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()
    orgName = orgRow?.name ?? null
  }

  return (
    <SidebarShell userEmail={user.email ?? ''} orgName={orgName}>
      {children}
    </SidebarShell>
  )
}
