// Conversations — honest empty state for now. Replies inbox + AI-drafted
// responses arrive when the Sending Stage launches and inbound starts flowing.
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ConversationsPage() {
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

  let replyCount = 0
  if (orgId) {
    // Count replies via campaign_prospects -> campaigns -> org
    const { data: campaigns } = await admin
      .from('campaigns')
      .select('id')
      .eq('organization_id', orgId)
    const campaignIds = (campaigns ?? []).map((c) => c.id)
    if (campaignIds.length > 0) {
      const { data: cps } = await admin
        .from('campaign_prospects')
        .select('id')
        .in('campaign_id', campaignIds)
      const cpIds = (cps ?? []).map((c) => c.id)
      if (cpIds.length > 0) {
        const { count } = await admin
          .from('replies')
          .select('id', { count: 'exact', head: true })
          .in('campaign_prospect_id', cpIds)
        replyCount = count ?? 0
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-gold mb-6">
        Conversations
      </p>
      <h1 className="font-serif text-4xl md:text-5xl text-fg-primary mb-6 max-w-2xl leading-tight">
        <span className="italic">
          {replyCount > 0 ? `${replyCount} reply waiting.` : 'Nothing back yet.'}
        </span>
      </h1>
      <p className="text-fg-secondary text-base max-w-lg leading-relaxed">
        Replies land here as your conversations start. We&apos;ll flag the hot ones
        and draft a response in your voice for you to approve.
      </p>
    </div>
  )
}
