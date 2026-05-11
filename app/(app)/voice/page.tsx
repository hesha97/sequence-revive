// Voice — brain editor. Reads clients.brain, writes via /api/voice/update.
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { VoiceClient } from './voice-client'
import type { Brain } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function VoicePage() {
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
  if (!client || !client.brain) redirect('/onboarding')

  return <VoiceClient clientId={client.id} initialBrain={client.brain as Brain} />
}
