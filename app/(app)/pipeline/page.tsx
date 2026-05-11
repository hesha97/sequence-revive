// Pipeline — board grouped by campaign_prospects.outcome.
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type Outcome = 'discovered' | 'contacted' | 'replied' | 'hot' | 'booked' | 'lost'

const COLUMNS: { id: Outcome | 'pending'; label: string }[] = [
  { id: 'pending', label: 'Just written' },
  { id: 'contacted', label: 'Said hi' },
  { id: 'replied', label: 'Heard back' },
  { id: 'hot', label: 'Hot' },
  { id: 'booked', label: 'Booked' },
  { id: 'lost', label: 'Closed' },
]

export default async function PipelinePage() {
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

  const { data: campaigns } = await admin
    .from('campaigns')
    .select('id')
    .eq('organization_id', orgId)
  const campaignIds = (campaigns ?? []).map((c) => c.id)

  let cps: Array<{
    id: string
    outcome: string | null
    prospect_id: string
  }> = []
  if (campaignIds.length > 0) {
    const { data } = await admin
      .from('campaign_prospects')
      .select('id, outcome, prospect_id')
      .in('campaign_id', campaignIds)
    cps = data ?? []
  }

  const prospectIds = cps.map((c) => c.prospect_id)
  const prospectMap = new Map<string, { first_name: string | null; last_name: string | null; company_name: string | null }>()
  if (prospectIds.length > 0) {
    const { data } = await admin
      .from('prospects')
      .select('id, first_name, last_name, company_name')
      .in('id', prospectIds)
    for (const p of data ?? []) {
      prospectMap.set(p.id, p)
    }
  }

  const grouped = new Map<string, typeof cps>()
  for (const col of COLUMNS) grouped.set(col.id, [])
  for (const cp of cps) {
    const key = cp.outcome ?? 'pending'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(cp)
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-gold mb-2">
          What&apos;s brewing
        </p>
        <h1 className="font-serif text-3xl text-fg-primary">
          <span className="italic">Where every conversation stands.</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {COLUMNS.map((col) => {
          const rows = grouped.get(col.id) ?? []
          return (
            <div
              key={col.id}
              className="border border-earth-border bg-earth-surface rounded-md p-4 min-h-[200px]"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-fg-tertiary">
                  {col.label}
                </p>
                <p className="font-mono text-[10px] text-fg-tertiary">{rows.length}</p>
              </div>
              <div className="space-y-2">
                {rows.map((cp) => {
                  const p = prospectMap.get(cp.prospect_id)
                  return (
                    <div
                      key={cp.id}
                      className="bg-earth-surfaceHover rounded-md p-3"
                    >
                      <p className="text-fg-primary text-sm">
                        {p?.first_name ?? ''} {p?.last_name ?? ''}
                      </p>
                      <p className="text-fg-tertiary text-xs">
                        {p?.company_name ?? ''}
                      </p>
                    </div>
                  )
                })}
                {rows.length === 0 && (
                  <p className="text-fg-tertiary text-xs italic">Empty for now.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
