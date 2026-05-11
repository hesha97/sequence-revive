// Celebration screen. Honest copy — no real Lemlist campaign was created.
// Sending happens when the operator's mailboxes are connected (Sending Stage).
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function SequencesActivatePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()
  const { data: memberRows } = await admin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) redirect('/today')

  const { data: campaignRows } = await admin
    .from('campaigns')
    .select('id, status')
    .eq('organization_id', orgId)
    .eq('status', 'ready_to_send')
    .order('updated_at', { ascending: false })
    .limit(1)
  const campaign = campaignRows?.[0]
  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <p className="text-fg-secondary mb-6">No wave is ready yet.</p>
        <Link
          href="/sequences"
          className="bg-earth-sand text-fg-inverse hover:bg-earth-stone px-6 py-3 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
        >
          Back to the wave
        </Link>
      </div>
    )
  }

  const { count } = await admin
    .from('campaign_prospects')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-gold mb-6">
        Saved
      </p>
      <h1 className="font-serif text-5xl md:text-6xl text-fg-primary mb-6 max-w-3xl leading-tight">
        <span className="italic">Your wave is written.</span>
      </h1>
      <p className="text-fg-secondary text-lg max-w-xl mb-8 leading-relaxed">
        {count ?? 0} conversation{count === 1 ? '' : 's'} ready to go.
        Sending kicks off the moment your business inboxes are connected.
      </p>
      <p className="text-fg-tertiary text-sm font-mono uppercase tracking-widest mb-10">
        Status &middot; Ready to send
      </p>
      <div className="flex gap-3">
        <Link
          href="/today"
          className="bg-earth-sand text-fg-inverse hover:bg-earth-stone px-6 py-3 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
        >
          Back to today
        </Link>
        <Link
          href="/sequences/approve"
          className="border border-earth-border text-fg-secondary hover:text-fg-primary px-6 py-3 rounded-md font-mono text-xs uppercase tracking-widest transition-colors"
        >
          Re-read the wave
        </Link>
      </div>
    </div>
  )
}
